package com.careersuccex.verification.controller;

import com.careersuccex.auth.security.SecurityUtils;
import com.careersuccex.verification.dto.VerificationDtos;
import com.careersuccex.verification.service.VerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/verifications")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;
    private final SecurityUtils securityUtils;

    @PostMapping("/start")
    public VerificationDtos.StartResponse start(@RequestBody VerificationDtos.StartRequest request) {
        return verificationService.start(securityUtils.getCurrentUserId(), request);
    }

    @PostMapping("/{id}/submit")
    public VerificationDtos.SubmitResponse submit(@PathVariable UUID id, @RequestBody VerificationDtos.SubmitRequest request) {
        return verificationService.submit(securityUtils.getCurrentUserId(), id, request);
    }

    @GetMapping("/history")
    public List<VerificationDtos.HistoryItem> history() {
        return verificationService.history(securityUtils.getCurrentUserId());
    }

    @GetMapping("/badges")
    public List<VerificationDtos.Badge> badges() {
        return verificationService.badges(securityUtils.getCurrentUserId());
    }
}
