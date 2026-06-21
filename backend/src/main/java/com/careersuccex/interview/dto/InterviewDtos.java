package com.careersuccex.interview.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class InterviewDtos {

    @Data
    public static class StartSessionRequest {
        private UUID targetRoleId;
        private String type;
        private String difficulty;
    }

    @Data
    @Builder
    public static class SessionResponse {
        private UUID id;
        private String status;
        private String interviewType;
        private String difficulty;
        private BigDecimal overallScore;
        private String summaryFeedback;
        private List<QuestionResponse> questions;
        private Instant startedAt;
        private Instant completedAt;
    }

    @Data
    @Builder
    public static class QuestionResponse {
        private UUID id;
        private Integer questionOrder;
        private String questionText;
        private String questionType;
        private AnswerResponse answer;
    }

    @Data
    @Builder
    public static class AnswerResponse {
        private String answerText;
        private BigDecimal score;
        private Map<String, Object> feedback;
    }

    @Data
    public static class SubmitAnswerRequest {
        private UUID questionId;
        private String answerText;
    }
}
