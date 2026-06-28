package com.careersuccex.integration.ai;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class AiDtos {

    @Data
    public static class RoleSkillRequirement {
        private String skillName;
        private int minLevel = 1;
        private double weight = 1.0;
    }

    @Data
    public static class RoleContext {
        private String title;
        private String industry = "";
        private String description = "";
        private List<RoleSkillRequirement> requiredSkills = List.of();
    }

    @Data
    public static class RecommendationItem {
        private String text;
        private String justification;
        private String evidence;
        private String priority = "medium";
    }

    @Data
    public static class CvEnrichRequest {
        private String cvText;
        private String targetRole;
        private RoleContext roleContext;
        private boolean includeJustifications;
    }

    @Data
    public static class CvEnrichResponse {
        private Map<String, Object> parsedData;
        private List<String> suggestions;
        private List<String> summaryTips;
        private String summaryText;
        private String reportSummary;
        private List<RecommendationItem> recommendations;
        private BigDecimal completenessScore;
        private BigDecimal roleFitScore;
        private String roleFitSummary;
        private BigDecimal keywordScore;
        private List<String> matched;
        private List<String> missing;
        private List<RecommendationItem> keywordNotes;
    }

    @Data
    public static class AtsKeywordRequest {
        private String cvText;
        private List<String> requiredKeywords;
        private String jobDescription;
        private RoleContext roleContext;
        private boolean includeJustifications;
    }

    @Data
    public static class AtsKeywordResponse {
        private BigDecimal keywordScore;
        private List<String> matched;
        private List<String> missing;
        private List<RecommendationItem> keywordNotes;
    }

    @Data
    public static class GitHubRepoSummary {
        private String name;
        private String description = "";
        private String language = "";
        private int stars;
        private List<String> topics = List.of();
        private boolean hasReadme;
        private String updatedAt = "";
    }

    @Data
    public static class GitHubAnalyzeRequest {
        private List<GitHubRepoSummary> repos;
        private RoleContext roleContext;
        private Map<String, Object> portfolioStats;
        private boolean includeJustifications;
    }

    @Data
    public static class GitHubAnalyzeResponse {
        private List<RecommendationItem> recommendations;
        private List<String> summaryTips;
        private String summaryText;
        private String reportSummary;
        private BigDecimal roleAlignmentScore;
        private String roleAlignmentSummary;
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
