package com.careersuccex.github.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AnalyzeRequest {
        private UUID targetRoleId;
        private Boolean includeJustifications;
    }

    @Data
    @Builder
    public static class RecommendationItem {
        private String text;
        private String justification;
        private String evidence;
        private String priority;
    }

    @Data
    @Builder
    public static class AnalysisResponse {
        private UUID id;
        private BigDecimal overallScore;
        private BigDecimal activityScore;
        private BigDecimal readmeScore;
        private BigDecimal diversityScore;
        private BigDecimal roleAlignmentScore;
        private String roleAlignmentSummary;
        private UUID targetRoleId;
        private String targetRoleTitle;
        private Map<String, Object> languageStats;
        private Map<String, Object> repoStats;
        private List<String> summaryTips;
        private String summaryText;
        private String reportSummary;
        private List<String> recommendations;
        private List<RecommendationItem> recommendationItems;
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
