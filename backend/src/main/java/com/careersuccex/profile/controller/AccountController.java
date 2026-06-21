package com.careersuccex.profile.controller;

import com.careersuccex.auth.repository.UserRepository;
import com.careersuccex.auth.security.SecurityUtils;
import com.careersuccex.common.exception.ApiException;
import com.careersuccex.profile.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/account")
@RequiredArgsConstructor
public class AccountController {

    private final ProfileService profileService;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    @GetMapping("/export")
    public Map<String, Object> exportData() {
        var userId = securityUtils.getCurrentUserId();
        var user = userRepository.findById(userId).orElseThrow();
        return Map.of(
                "email", user.getEmail(),
                "profile", profileService.getProfile(userId),
                "exportedAt", java.time.Instant.now().toString()
        );
    }

    @DeleteMapping
    @Transactional
    public void deleteAccount() {
        var userId = securityUtils.getCurrentUserId();
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
        user.setIsActive(false);
        user.setRefreshTokenHash(null);
        userRepository.save(user);
    }
}
