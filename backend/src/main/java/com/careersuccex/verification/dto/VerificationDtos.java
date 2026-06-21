package com.careersuccex.verification.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class VerificationDtos {

    @Data
    public static class StartRequest {
        private UUID skillId;
    }

    @Data
    @Builder
    public static class StartResponse {
        private UUID verificationId;
        private List<QuestionDto> questions;
    }

    @Data
    @Builder
    public static class QuestionDto {
        private String id;
        private String type;
        private String question;
        private List<String> options;
    }

    @Data
    public static class SubmitRequest {
        private List<Map<String, Object>> answers;
    }

    @Data
    @Builder
    public static class SubmitResponse {
        private BigDecimal score;
        private boolean passed;
        private Map<String, Object> feedback;
    }

    @Data
    @Builder
    public static class HistoryItem {
        private UUID id;
        private String skillName;
        private BigDecimal score;
        private boolean passed;
        private Instant verifiedAt;
    }

    @Data
    @Builder
    public static class Badge {
        private UUID skillId;
        private String skillName;
        private Instant verifiedAt;
    }
}
