package com.careersuccex.cv.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class CvDtos {

    @Data
    public static class AnalyzeCvRequest {
        private UUID documentId;
        private UUID targetRoleId;
    }

    @Data
    @Builder
    public static class CvAnalysisResponse {
        private UUID id;
        private BigDecimal atsScore;
        private ScoreBreakdown breakdown;
        private Map<String, List<String>> keywordReport;
        private List<String> suggestions;
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
