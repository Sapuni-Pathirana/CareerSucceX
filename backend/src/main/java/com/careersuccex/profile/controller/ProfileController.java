package com.careersuccex.profile.controller;

import com.careersuccex.auth.security.SecurityUtils;
import com.careersuccex.profile.dto.DashboardResponse;
import com.careersuccex.profile.dto.ProfileResponse;
import com.careersuccex.profile.dto.UpdateProfileRequest;
import com.careersuccex.profile.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ProfileResponse getProfile() {
        return profileService.getProfile(securityUtils.getCurrentUserId());
    }

    @PutMapping
    public ProfileResponse updateProfile(@RequestBody UpdateProfileRequest request) {
        return profileService.updateProfile(securityUtils.getCurrentUserId(), request);
    }

    @GetMapping("/dashboard")
    public DashboardResponse getDashboard() {
        return profileService.getDashboard(securityUtils.getCurrentUserId());
    }
}
