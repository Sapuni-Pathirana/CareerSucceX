package com.careersuccex.common.controller;

import com.careersuccex.auth.security.SecurityUtils;
import com.careersuccex.common.service.AnalysisJobService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class JobController {

    private final AnalysisJobService jobService;
    private final SecurityUtils securityUtils;

    @GetMapping("/{id}")
    public Map<String, Object> getJob(@PathVariable UUID id) {
        return jobService.getJobStatus(securityUtils.getCurrentUserId(), id);
    }
}
