package com.careersuccex.auth.service;

import com.careersuccex.auth.dto.*;
import com.careersuccex.auth.entity.User;
import com.careersuccex.auth.repository.UserRepository;
import com.careersuccex.auth.security.JwtService;
import com.careersuccex.auth.security.UserPrincipal;
import com.careersuccex.common.enums.UserRole;
import com.careersuccex.common.exception.ApiException;
import com.careersuccex.profile.entity.UserProfile;
import com.careersuccex.profile.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException("Email already registered", HttpStatus.CONFLICT);
        }
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.STUDENT)
                .build();
        user = userRepository.save(user);

        UserProfile profile = UserProfile.builder()
                .user(user)
                .fullName(request.getFullName())
                .build();
        profileRepository.save(profile);

        UserPrincipal principal = new UserPrincipal(user);
        return buildAuthResponse(principal);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException("Invalid credentials", HttpStatus.UNAUTHORIZED));
        UserPrincipal principal = new UserPrincipal(user);
        AuthResponse response = buildAuthResponse(principal);
        user.setRefreshTokenHash(hashToken(response.getRefreshToken()));
        userRepository.save(user);
        return response;
    }

    public AuthResponse refresh(String refreshToken) {
        if (!jwtService.isRefreshToken(refreshToken)) {
            throw new ApiException("Invalid refresh token", HttpStatus.UNAUTHORIZED);
        }
        String email = jwtService.extractEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.UNAUTHORIZED));
        UserPrincipal principal = new UserPrincipal(user);
        if (!jwtService.isTokenValid(refreshToken, principal)) {
            throw new ApiException("Refresh token expired", HttpStatus.UNAUTHORIZED);
        }
        String storedHash = user.getRefreshTokenHash();
        if (storedHash == null || !storedHash.equals(hashToken(refreshToken))) {
            throw new ApiException("Refresh token revoked", HttpStatus.UNAUTHORIZED);
        }
        AuthResponse response = buildAuthResponse(principal);
        user.setRefreshTokenHash(hashToken(response.getRefreshToken()));
        userRepository.save(user);
        return response;
    }

    @Transactional
    public void logout(UserPrincipal principal) {
        userRepository.findById(principal.getId()).ifPresent(user -> {
            user.setRefreshTokenHash(null);
            userRepository.save(user);
        });
    }

    public UserResponse getCurrentUser(User user) {
        UserProfile profile = profileRepository.findByUserId(user.getId()).orElse(null);
        UserResponse.ProfileSummary summary = null;
        if (profile != null) {
            summary = UserResponse.ProfileSummary.builder()
                    .fullName(profile.getFullName())
                    .university(profile.getUniversity())
                    .degree(profile.getDegree())
                    .graduationYear(profile.getGraduationYear())
                    .targetRoleId(profile.getTargetRole() != null ? profile.getTargetRole().getId() : null)
                    .targetRoleTitle(profile.getTargetRole() != null ? profile.getTargetRole().getTitle() : null)
                    .build();
        }
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .profile(summary)
                .build();
    }

    private AuthResponse buildAuthResponse(UserPrincipal principal) {
        return AuthResponse.builder()
                .accessToken(jwtService.generateAccessToken(principal))
                .refreshToken(jwtService.generateRefreshToken(principal))
                .tokenType("Bearer")
                .build();
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
