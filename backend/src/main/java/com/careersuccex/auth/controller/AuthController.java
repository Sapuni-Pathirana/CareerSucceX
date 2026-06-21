package com.careersuccex.auth.controller;

import com.careersuccex.auth.dto.*;
import com.careersuccex.auth.repository.UserRepository;
import com.careersuccex.auth.security.SecurityUtils;
import com.careersuccex.auth.service.AuthService;
import com.careersuccex.common.exception.ApiException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final SecurityUtils securityUtils;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@RequestBody(required = false) RefreshRequest request,
                                @RequestHeader(value = "X-Refresh-Token", required = false) String headerToken) {
        String token = request != null && request.getRefreshToken() != null
                ? request.getRefreshToken() : headerToken;
        if (token == null) {
            throw new ApiException("Refresh token required", HttpStatus.BAD_REQUEST);
        }
        return authService.refresh(token);
    }

    @PostMapping("/logout")
    public void logout() {
        authService.logout(securityUtils.getCurrentUser());
    }

    @GetMapping("/me")
    public UserResponse me() {
        var user = userRepository.findById(securityUtils.getCurrentUserId())
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
        return authService.getCurrentUser(user);
    }
}
