package com.careersuccex.github.service;

import com.careersuccex.common.service.AnalysisJobService;
import com.careersuccex.common.service.RoleContextBuilder;
import com.careersuccex.common.util.EncryptionUtil;
import com.careersuccex.common.util.JsonUtil;
import com.careersuccex.github.entity.GitHubAnalysis;
import com.careersuccex.github.entity.GitHubConnection;
import com.careersuccex.github.repository.GitHubAnalysisRepository;
import com.careersuccex.github.repository.GitHubConnectionRepository;
import com.careersuccex.integration.ai.AiDtos;
import com.careersuccex.integration.ai.AiServiceClient;
import com.careersuccex.readiness.service.ReadinessRecalculationService;
import com.careersuccex.skills.entity.TargetRole;
import com.careersuccex.skills.service.SkillAggregationService;
import com.careersuccex.skills.service.SkillGapService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class GitHubAnalysisRunner {

    private final GitHubAnalysisRepository analysisRepository;
    private final GitHubConnectionRepository connectionRepository;
    private final EncryptionUtil encryptionUtil;
    private final WebClient.Builder webClientBuilder;
    private final JsonUtil jsonUtil;
    private final AnalysisJobService jobService;
    private final SkillAggregationService skillAggregationService;
    private final ReadinessRecalculationService readinessRecalculationService;
    private final RoleContextBuilder roleContextBuilder;
    private final AiServiceClient aiServiceClient;
    private final SkillGapService skillGapService;

    @Transactional
    public void run(UUID jobId, UUID analysisId, GitHubConnection conn, TargetRole targetRole, boolean includeJustifications) {
        jobService.markRunning(jobId);
        try {
            GitHubConnection connection = connectionRepository.findById(conn.getId()).orElseThrow();
            String token = encryptionUtil.decrypt(connection.getAccessTokenEnc());
            JsonNode repos = fetchRepos(token);
            Map<String, Object> stats = computeStats(repos);
            AiDtos.RoleContext roleContext = roleContextBuilder.toRoleContext(targetRole);

            AiDtos.GitHubAnalyzeRequest aiReq = new AiDtos.GitHubAnalyzeRequest();
            aiReq.setRepos(buildRepoSummaries(repos));
            aiReq.setRoleContext(roleContext);
            aiReq.setPortfolioStats(buildPortfolioStats(stats));
            aiReq.setIncludeJustifications(includeJustifications);
            AiDtos.GitHubAnalyzeResponse aiResult = aiServiceClient.analyzeGitHub(aiReq);
            assertAiGitHubResult(aiResult);

            GitHubAnalysis analysis = analysisRepository.findById(analysisId).orElseThrow();
            analysis.setOverallScore((BigDecimal) stats.get("overallScore"));
            analysis.setLanguageStats(jsonUtil.toJson(stats.get("languageStats")));
            Map<String, Object> repoStats = new LinkedHashMap<>((Map<String, Object>) stats.get("repoStats"));
            repoStats.put("targetRoleTitle", roleContext.getTitle());
            if (aiResult.getRoleAlignmentScore() != null) {
                repoStats.put("roleAlignmentScore", aiResult.getRoleAlignmentScore());
            }
            if (aiResult.getRoleAlignmentSummary() != null) {
                repoStats.put("roleAlignmentSummary", aiResult.getRoleAlignmentSummary());
            }
            analysis.setRepoStats(jsonUtil.toJson(repoStats));
            analysis.setActivityScore((BigDecimal) stats.get("activityScore"));
            analysis.setReadmeScore((BigDecimal) stats.get("readmeScore"));
            analysis.setDiversityScore((BigDecimal) stats.get("diversityScore"));
            analysis.setRecommendations(jsonUtil.toJson(buildRecommendationPayload(aiResult)));
            analysis.setAnalyzedAt(Instant.now());
            analysisRepository.save(analysis);

            connection.setLastSyncedAt(Instant.now());
            connectionRepository.save(connection);

            UUID userId = connection.getUser().getId();
            @SuppressWarnings("unchecked")
            Map<String, Object> langStats = (Map<String, Object>) stats.get("languageStats");
            skillAggregationService.syncFromGitHub(userId, langStats, analysisId);
            jobService.markCompleted(jobId, analysisId);
            try {
                readinessRecalculationService.recalculate(userId);
            } catch (Exception e) {
                log.warn("Readiness recalculation failed after GitHub analysis for user {}", userId, e);
            }
            if (targetRole != null) {
                try {
                    skillGapService.recalculate(userId, targetRole.getId());
                } catch (Exception e) {
                    log.warn("Skill gap recalculation failed after GitHub analysis for user {}", userId, e);
                }
            }
        } catch (Exception e) {
            log.error("GitHub analysis failed for job {}", jobId, e);
            jobService.markFailed(jobId, e.getMessage() != null ? e.getMessage() : "GitHub analysis failed");
        }
    }

    private JsonNode fetchRepos(String token) {
        return webClientBuilder.build().get()
                .uri("https://api.github.com/user/repos?per_page=100&sort=updated")
                .header("Authorization", "Bearer " + token)
                .header("Accept", "application/vnd.github+json")
                .retrieve().bodyToMono(JsonNode.class).block();
    }

    private List<AiDtos.GitHubRepoSummary> buildRepoSummaries(JsonNode repos) {
        List<AiDtos.GitHubRepoSummary> summaries = new ArrayList<>();
        for (JsonNode repo : repos) {
            if (repo.path("fork").asBoolean(false)) {
                continue;
            }
            AiDtos.GitHubRepoSummary summary = new AiDtos.GitHubRepoSummary();
            summary.setName(repo.path("name").asText(""));
            summary.setDescription(repo.path("description").asText(""));
            summary.setLanguage(repo.path("language").isNull() ? "" : repo.path("language").asText(""));
            summary.setStars(repo.path("stargazers_count").asInt(0));
            List<String> topics = new ArrayList<>();
            if (repo.has("topics")) {
                repo.get("topics").forEach(t -> topics.add(t.asText()));
            }
            summary.setTopics(topics);
            summary.setHasReadme(repo.path("has_wiki").asBoolean() || summary.getDescription().length() > 20);
            summary.setUpdatedAt(repo.path("updated_at").asText(""));
            summaries.add(summary);
        }
        return summaries;
    }

    private Map<String, Object> buildPortfolioStats(Map<String, Object> stats) {
        Map<String, Object> portfolio = new LinkedHashMap<>();
        portfolio.put("activityScore", stats.get("activityScore"));
        portfolio.put("readmeScore", stats.get("readmeScore"));
        portfolio.put("diversityScore", stats.get("diversityScore"));
        portfolio.put("overallScore", stats.get("overallScore"));
        @SuppressWarnings("unchecked")
        Map<String, Object> repoStats = (Map<String, Object>) stats.get("repoStats");
        portfolio.put("repoCount", repoStats.get("count"));
        portfolio.put("stars", repoStats.get("stars"));
        portfolio.put("languages", repoStats.get("languages"));
        return portfolio;
    }

    private void assertAiGitHubResult(AiDtos.GitHubAnalyzeResponse aiResult) {
        if (aiResult.getRoleAlignmentSummary() != null
                && aiResult.getRoleAlignmentSummary().toLowerCase().contains("unavailable")) {
            throw new IllegalStateException("GitHub analysis must use Grok AI — fallback results are not allowed");
        }
        if (aiResult.getRecommendations() == null || aiResult.getRecommendations().isEmpty()) {
            throw new IllegalStateException("GitHub analysis returned no AI recommendations");
        }
        for (AiDtos.RecommendationItem rec : aiResult.getRecommendations()) {
            if (rec.getText() != null && rec.getText().toLowerCase().contains("ai service unavailable")) {
                throw new IllegalStateException("GitHub analysis must use Grok AI — fallback results are not allowed");
            }
        }
    }

    private Map<String, Object> buildRecommendationPayload(AiDtos.GitHubAnalyzeResponse aiResult) {
        List<Map<String, Object>> detailed = toStoredRecommendations(aiResult);
        List<String> summaryTips = aiResult.getSummaryTips() != null && !aiResult.getSummaryTips().isEmpty()
                ? aiResult.getSummaryTips()
                : List.of();
        String summaryText = aiResult.getSummaryText() != null && !aiResult.getSummaryText().isBlank()
                ? aiResult.getSummaryText()
                : String.join(" ", summaryTips);
        if ((summaryText == null || summaryText.isBlank()) && !detailed.isEmpty()) {
            summaryText = detailed.stream()
                    .map(m -> String.valueOf(m.get("text")))
                    .filter(t -> t != null && !t.isBlank())
                    .limit(3)
                    .reduce((a, b) -> a + " " + b)
                    .orElse("");
        }
        String reportSummary = aiResult.getReportSummary() != null && !aiResult.getReportSummary().isBlank()
                ? aiResult.getReportSummary()
                : summaryText;
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("summaryText", summaryText);
        payload.put("reportSummary", reportSummary);
        payload.put("summaryTips", summaryTips);
        payload.put("recommendations", detailed);
        return payload;
    }

    private List<Map<String, Object>> toStoredRecommendations(AiDtos.GitHubAnalyzeResponse aiResult) {
        if (aiResult.getRecommendations() == null) {
            return List.of();
        }
        List<Map<String, Object>> items = new ArrayList<>();
        for (AiDtos.RecommendationItem rec : aiResult.getRecommendations()) {
            if (rec.getText() == null || rec.getText().isBlank()) continue;
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("text", rec.getText());
            map.put("priority", rec.getPriority() != null ? rec.getPriority() : "medium");
            if (rec.getJustification() != null && !rec.getJustification().isBlank()) {
                map.put("justification", rec.getJustification());
            }
            if (rec.getEvidence() != null && !rec.getEvidence().isBlank()) {
                map.put("evidence", rec.getEvidence());
            }
            items.add(map);
        }
        return items;
    }

    private Map<String, Object> computeStats(JsonNode repos) {
        int repoCount = repos.size();
        int withReadme = 0;
        int totalStars = 0;
        Map<String, Integer> languages = new HashMap<>();
        Set<String> topics = new HashSet<>();

        for (JsonNode repo : repos) {
            if (!repo.path("fork").asBoolean(false)) {
                totalStars += repo.path("stargazers_count").asInt(0);
                if (repo.has("language") && !repo.get("language").isNull()) {
                    String lang = repo.get("language").asText();
                    languages.merge(lang, 1, Integer::sum);
                }
                if (repo.has("topics")) {
                    repo.get("topics").forEach(t -> topics.add(t.asText()));
                }
            }
            if (repo.path("has_wiki").asBoolean() || repo.path("description").asText("").length() > 20) {
                withReadme++;
            }
        }

        BigDecimal readmeScore = repoCount == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(withReadme * 100.0 / repoCount).setScale(2, RoundingMode.HALF_UP);
        BigDecimal activityScore = BigDecimal.valueOf(Math.min(100, repoCount * 10 + totalStars));
        BigDecimal diversityScore = BigDecimal.valueOf(Math.min(100, languages.size() * 15 + topics.size() * 5));
        BigDecimal overall = readmeScore.multiply(BigDecimal.valueOf(0.3))
                .add(activityScore.multiply(BigDecimal.valueOf(0.4)))
                .add(diversityScore.multiply(BigDecimal.valueOf(0.3)))
                .setScale(2, RoundingMode.HALF_UP);

        Map<String, Object> languageStats = new HashMap<>();
        languages.forEach((k, v) -> languageStats.put(k, v * 100 / Math.max(1, repoCount)));

        return Map.of(
                "overallScore", overall,
                "languageStats", languageStats,
                "repoStats", Map.of("count", repoCount, "stars", totalStars, "languages", languages.size()),
                "activityScore", activityScore,
                "readmeScore", readmeScore,
                "diversityScore", diversityScore
        );
    }
}
