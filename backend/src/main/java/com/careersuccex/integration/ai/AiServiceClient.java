package com.careersuccex.integration.ai;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
@RequiredArgsConstructor
public class AiServiceClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${app.ai-service-url}")
    private String aiServiceUrl;

    @CircuitBreaker(name = "aiService", fallbackMethod = "fallbackCvEnrich")
    public AiDtos.CvEnrichResponse enrichCv(AiDtos.CvEnrichRequest request) {
        return post("/ai/cv/enrich", request, AiDtos.CvEnrichResponse.class);
    }

    @CircuitBreaker(name = "aiService", fallbackMethod = "fallbackAtsKeywords")
    public AiDtos.AtsKeywordResponse matchAtsKeywords(AiDtos.AtsKeywordRequest request) {
        return post("/ai/cv/ats-keywords", request, AiDtos.AtsKeywordResponse.class);
    }

    @CircuitBreaker(name = "aiService", fallbackMethod = "fallbackGenerateQuestions")
    public AiDtos.GenerateQuestionsResponse generateQuestions(AiDtos.GenerateQuestionsRequest request) {
        return post("/ai/interview/generate-questions", request, AiDtos.GenerateQuestionsResponse.class);
    }

    @CircuitBreaker(name = "aiService", fallbackMethod = "fallbackEvaluateAnswer")
    public AiDtos.EvaluateAnswerResponse evaluateAnswer(AiDtos.EvaluateAnswerRequest request) {
        return post("/ai/interview/evaluate-answer", request, AiDtos.EvaluateAnswerResponse.class);
    }

    @CircuitBreaker(name = "aiService", fallbackMethod = "fallbackSummarize")
    public AiDtos.SummarizeInterviewResponse summarizeInterview(AiDtos.SummarizeInterviewRequest request) {
        return post("/ai/interview/summarize", request, AiDtos.SummarizeInterviewResponse.class);
    }

    @CircuitBreaker(name = "aiService", fallbackMethod = "fallbackRoadmap")
    public AiDtos.GenerateRoadmapResponse generateRoadmap(AiDtos.GenerateRoadmapRequest request) {
        return post("/ai/roadmap/generate", request, AiDtos.GenerateRoadmapResponse.class);
    }

    @CircuitBreaker(name = "aiService", fallbackMethod = "fallbackQuiz")
    public AiDtos.GenerateQuizResponse generateQuiz(AiDtos.GenerateQuizRequest request) {
        return post("/ai/verification/generate-quiz", request, AiDtos.GenerateQuizResponse.class);
    }

    @CircuitBreaker(name = "aiService", fallbackMethod = "fallbackGrade")
    public AiDtos.GradeQuizResponse gradeQuiz(AiDtos.GradeQuizRequest request) {
        return post("/ai/verification/grade", request, AiDtos.GradeQuizResponse.class);
    }

    private <T> T post(String path, Object body, Class<T> responseType) {
        return webClientBuilder.build()
                .post()
                .uri(aiServiceUrl + path)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(responseType)
                .block();
    }

    @SuppressWarnings("unused")
    private AiDtos.CvEnrichResponse fallbackCvEnrich(AiDtos.CvEnrichRequest request, Throwable t) {
        AiDtos.CvEnrichResponse r = new AiDtos.CvEnrichResponse();
        r.setSuggestions(java.util.List.of("AI service unavailable — review CV sections manually"));
        r.setCompletenessScore(java.math.BigDecimal.valueOf(50));
        return r;
    }

    @SuppressWarnings("unused")
    private AiDtos.AtsKeywordResponse fallbackAtsKeywords(AiDtos.AtsKeywordRequest request, Throwable t) {
        AiDtos.AtsKeywordResponse r = new AiDtos.AtsKeywordResponse();
        r.setKeywordScore(java.math.BigDecimal.valueOf(50));
        r.setMatched(java.util.List.of());
        r.setMissing(request.getRequiredKeywords());
        return r;
    }

    @SuppressWarnings("unused")
    private AiDtos.GenerateQuestionsResponse fallbackGenerateQuestions(AiDtos.GenerateQuestionsRequest request, Throwable t) {
        AiDtos.GenerateQuestionsResponse r = new AiDtos.GenerateQuestionsResponse();
        r.setQuestions(java.util.List.of(
                question("Tell me about yourself.", "BEHAVIORAL"),
                question("Describe a challenging project.", "BEHAVIORAL"),
                question("Explain a technical concept you recently learned.", "TECHNICAL")
        ));
        return r;
    }

    @SuppressWarnings("unused")
    private AiDtos.EvaluateAnswerResponse fallbackEvaluateAnswer(AiDtos.EvaluateAnswerRequest request, Throwable t) {
        AiDtos.EvaluateAnswerResponse r = new AiDtos.EvaluateAnswerResponse();
        r.setScore(java.math.BigDecimal.valueOf(60));
        r.setFeedback(java.util.Map.of("comment", "AI evaluation unavailable — answer saved"));
        return r;
    }

    @SuppressWarnings("unused")
    private AiDtos.SummarizeInterviewResponse fallbackSummarize(AiDtos.SummarizeInterviewRequest request, Throwable t) {
        AiDtos.SummarizeInterviewResponse r = new AiDtos.SummarizeInterviewResponse();
        r.setOverallScore(java.math.BigDecimal.valueOf(60));
        r.setSummary("Session completed. AI summary unavailable.");
        r.setTips(java.util.List.of("Practice STAR method for behavioral questions"));
        return r;
    }

    @SuppressWarnings("unused")
    private AiDtos.GenerateRoadmapResponse fallbackRoadmap(AiDtos.GenerateRoadmapRequest request, Throwable t) {
        AiDtos.GenerateRoadmapResponse r = new AiDtos.GenerateRoadmapResponse();
        AiDtos.RoadmapItemDto item = new AiDtos.RoadmapItemDto();
        item.setItemType("LEARN");
        item.setTitle("Review core skills for " + request.getTargetRole());
        item.setDescription("Focus on identified skill gaps");
        r.setItems(java.util.List.of(item));
        return r;
    }

    @SuppressWarnings("unused")
    private AiDtos.GenerateQuizResponse fallbackQuiz(AiDtos.GenerateQuizRequest request, Throwable t) {
        AiDtos.GenerateQuizResponse r = new AiDtos.GenerateQuizResponse();
        AiDtos.QuizQuestion q = new AiDtos.QuizQuestion();
        q.setId("1");
        q.setType("MCQ");
        q.setQuestion("What is a fundamental concept in " + request.getSkillName() + "?");
        q.setOptions(java.util.List.of("Option A", "Option B", "Option C", "Option D"));
        r.setQuestions(java.util.List.of(q));
        return r;
    }

    @SuppressWarnings("unused")
    private AiDtos.GradeQuizResponse fallbackGrade(AiDtos.GradeQuizRequest request, Throwable t) {
        AiDtos.GradeQuizResponse r = new AiDtos.GradeQuizResponse();
        r.setScore(java.math.BigDecimal.valueOf(70));
        r.setPassed(true);
        r.setFeedback(java.util.Map.of("comment", "Graded with fallback scoring"));
        return r;
    }

    private AiDtos.QuestionItem question(String text, String type) {
        AiDtos.QuestionItem q = new AiDtos.QuestionItem();
        q.setText(text);
        q.setType(type);
        return q;
    }
}
