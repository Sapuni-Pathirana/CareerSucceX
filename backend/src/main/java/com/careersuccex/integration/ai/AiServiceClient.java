package com.careersuccex.integration.ai;

import com.careersuccex.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiServiceClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${app.ai-service-url}")
    private String aiServiceUrl;

    public AiDtos.CvEnrichResponse enrichCv(AiDtos.CvEnrichRequest request) {
        return post("/ai/cv/enrich", request, AiDtos.CvEnrichResponse.class);
    }

    public AiDtos.AtsKeywordResponse matchAtsKeywords(AiDtos.AtsKeywordRequest request) {
        return post("/ai/cv/ats-keywords", request, AiDtos.AtsKeywordResponse.class);
    }

    public AiDtos.GitHubAnalyzeResponse analyzeGitHub(AiDtos.GitHubAnalyzeRequest request) {
        return post("/ai/github/analyze", request, AiDtos.GitHubAnalyzeResponse.class);
    }

    public AiDtos.GenerateQuestionsResponse generateQuestions(AiDtos.GenerateQuestionsRequest request) {
        return post("/ai/interview/generate-questions", request, AiDtos.GenerateQuestionsResponse.class);
    }

    public AiDtos.EvaluateAnswerResponse evaluateAnswer(AiDtos.EvaluateAnswerRequest request) {
        return post("/ai/interview/evaluate-answer", request, AiDtos.EvaluateAnswerResponse.class);
    }

    public AiDtos.SummarizeInterviewResponse summarizeInterview(AiDtos.SummarizeInterviewRequest request) {
        return post("/ai/interview/summarize", request, AiDtos.SummarizeInterviewResponse.class);
    }

    public AiDtos.GenerateRoadmapResponse generateRoadmap(AiDtos.GenerateRoadmapRequest request) {
        return post("/ai/roadmap/generate", request, AiDtos.GenerateRoadmapResponse.class);
    }

    public AiDtos.GenerateQuizResponse generateQuiz(AiDtos.GenerateQuizRequest request) {
        return post("/ai/verification/generate-quiz", request, AiDtos.GenerateQuizResponse.class);
    }

    public AiDtos.GradeQuizResponse gradeQuiz(AiDtos.GradeQuizRequest request) {
        return post("/ai/verification/grade", request, AiDtos.GradeQuizResponse.class);
    }

    private <T> T post(String path, Object body, Class<T> responseType) {
        try {
            return webClientBuilder.build()
                    .post()
                    .uri(aiServiceUrl + path)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(responseType)
                    .block();
        } catch (WebClientResponseException e) {
            log.error("AI service HTTP {} for {}: {}", e.getStatusCode().value(), path, e.getResponseBodyAsString());
            throw new ApiException(resolveAiErrorMessage(e), HttpStatus.SERVICE_UNAVAILABLE);
        } catch (Exception e) {
            log.error("AI service call failed for {}", path, e);
            throw new ApiException(
                    "AI service unavailable. Configure GROK_API_KEY and ensure ai-service is running.",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    private String resolveAiErrorMessage(WebClientResponseException e) {
        String body = e.getResponseBodyAsString();
        if (body != null && !body.isBlank()) {
            return body.length() > 300 ? body.substring(0, 300) : body;
        }
        return "AI analysis failed (" + e.getStatusCode().value() + "). Check Grok API configuration.";
    }
}
