package com.careersuccex.github.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class GitHubDtos {

    @Data
    @Builder
    public static class AnalyzeResponse {
        private UUID jobId;
        private UUID analysisId;
        private String status;
    }

    @Data
    @Builder
    public static class AnalysisResponse {
        private UUID id;
        private BigDecimal overallScore;
        private BigDecimal activityScore;
        private BigDecimal readmeScore;
        private BigDecimal diversityScore;
        private Map<String, Object> languageStats;
        private Map<String, Object> repoStats;
        private List<String> recommendations;
        private Instant analyzedAt;
    }

    @Data
    @Builder
    public static class ConnectionStatus {
        private boolean connected;
        private boolean oauthConfigured;
        private String username;
        private Instant lastSyncedAt;
    }
}
