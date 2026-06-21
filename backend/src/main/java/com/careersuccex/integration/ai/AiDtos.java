package com.careersuccex.integration.ai;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class AiDtos {

    @Data
    public static class CvEnrichRequest {
        private String cvText;
        private String targetRole;
    }

    @Data
    public static class CvEnrichResponse {
        private Map<String, Object> parsedData;
        private List<String> suggestions;
        private BigDecimal completenessScore;
    }

    @Data
    public static class AtsKeywordRequest {
        private String cvText;
        private List<String> requiredKeywords;
        private String jobDescription;
    }

    @Data
    public static class AtsKeywordResponse {
        private BigDecimal keywordScore;
        private List<String> matched;
        private List<String> missing;
    }

    @Data
    public static class GenerateQuestionsRequest {
        private String targetRole;
        private String interviewType;
        private String difficulty;
        private String profileSummary;
        private int count;
    }

    @Data
    public static class GenerateQuestionsResponse {
        private List<QuestionItem> questions;
    }

    @Data
    public static class QuestionItem {
        private String text;
        private String type;
    }

    @Data
    public static class EvaluateAnswerRequest {
        private String question;
        private String answer;
        private String targetRole;
        private String questionType;
    }

    @Data
    public static class EvaluateAnswerResponse {
        private BigDecimal score;
        private Map<String, Object> feedback;
    }

    @Data
    public static class SummarizeInterviewRequest {
        private List<Map<String, Object>> qaPairs;
        private String targetRole;
    }

    @Data
    public static class SummarizeInterviewResponse {
        private BigDecimal overallScore;
        private String summary;
        private List<String> tips;
    }

    @Data
    public static class GenerateRoadmapRequest {
        private String targetRole;
        private List<String> skillGaps;
        private String weakAreas;
    }

    @Data
    public static class GenerateRoadmapResponse {
        private List<RoadmapItemDto> items;
    }

    @Data
    public static class RoadmapItemDto {
        private String itemType;
        private String title;
        private String description;
        private List<Map<String, String>> resources;
        private String skillName;
    }

    @Data
    public static class GenerateQuizRequest {
        private String skillName;
        private int questionCount;
    }

    @Data
    public static class GenerateQuizResponse {
        private List<QuizQuestion> questions;
    }

    @Data
    public static class QuizQuestion {
        private String id;
        private String type;
        private String question;
        private List<String> options;
    }

    @Data
    public static class GradeQuizRequest {
        private String skillName;
        private List<Map<String, Object>> questions;
        private List<Map<String, Object>> answers;
    }

    @Data
    public static class GradeQuizResponse {
        private BigDecimal score;
        private boolean passed;
        private Map<String, Object> feedback;
    }
}
