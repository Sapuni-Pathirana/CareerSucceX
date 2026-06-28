package com.careersuccex.cv.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class CvDtos {

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AnalyzeCvRequest {
        private UUID documentId;
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
    public static class CvAnalysisResponse {
        private UUID id;
        private UUID documentId;
        private String fileName;
        private UUID targetRoleId;
        private String targetRoleTitle;
        private BigDecimal atsScore;
        private BigDecimal roleFitScore;
        private String roleFitSummary;
        private ScoreBreakdown breakdown;
        private Map<String, List<String>> keywordReport;
        private List<String> summaryTips;
        private String summaryText;
        private String reportSummary;
        private List<String> suggestions;
        private List<RecommendationItem> recommendations;
        private Map<String, Object> parsedData;
        private Instant analyzedAt;
    }

    @Data
    @Builder
    public static class ScoreBreakdown {
        private BigDecimal keywordScore;
        private BigDecimal formatScore;
        private BigDecimal completenessScore;
    }

    @Data
    @Builder
    public static class CvDocumentResponse {
        private UUID id;
        private String fileName;
        private String fileType;
        private Integer fileSizeBytes;
        private Instant uploadedAt;
    }

    @Data
    @Builder
    public static class AnalyzeJobResponse {
        private UUID analysisId;
        private UUID jobId;
        private String status;
    }
}
