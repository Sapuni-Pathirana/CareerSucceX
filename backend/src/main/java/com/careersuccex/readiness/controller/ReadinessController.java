package com.careersuccex.readiness.controller;

import com.careersuccex.auth.security.SecurityUtils;
import com.careersuccex.readiness.dto.ReadinessDtos;
import com.careersuccex.readiness.service.ReadinessService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/readiness")
@RequiredArgsConstructor
public class ReadinessController {

    private final ReadinessService readinessService;
    private final SecurityUtils securityUtils;

    @GetMapping("/score")
    public ReadinessDtos.ScoreResponse getScore() {
        return readinessService.getLatest(securityUtils.getCurrentUserId());
    }

    @GetMapping("/history")
    public List<ReadinessDtos.HistoryPoint> getHistory() {
        return readinessService.getHistory(securityUtils.getCurrentUserId());
    }

    @GetMapping("/recommendations")
    public List<String> getRecommendations() {
        return readinessService.getRecommendations(securityUtils.getCurrentUserId());
    }
}
