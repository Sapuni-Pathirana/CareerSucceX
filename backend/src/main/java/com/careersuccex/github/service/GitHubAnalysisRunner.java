package com.careersuccex.github.service;

import com.careersuccex.common.service.AnalysisJobService;
import com.careersuccex.common.util.EncryptionUtil;
import com.careersuccex.common.util.JsonUtil;
import com.careersuccex.github.entity.GitHubAnalysis;
import com.careersuccex.github.entity.GitHubConnection;
import com.careersuccex.github.repository.GitHubAnalysisRepository;
import com.careersuccex.github.repository.GitHubConnectionRepository;
import com.careersuccex.readiness.service.ReadinessRecalculationService;
import com.careersuccex.skills.service.SkillAggregationService;
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

    @Transactional
    public void run(UUID jobId, UUID analysisId, GitHubConnection conn) {
        jobService.markRunning(jobId);
        try {
            GitHubConnection connection = connectionRepository.findById(conn.getId()).orElseThrow();
            String token = encryptionUtil.decrypt(connection.getAccessTokenEnc());
            JsonNode repos = fetchRepos(token);
            Map<String, Object> stats = computeStats(repos);

            GitHubAnalysis analysis = analysisRepository.findById(analysisId).orElseThrow();
            analysis.setOverallScore((BigDecimal) stats.get("overallScore"));
            analysis.setLanguageStats(jsonUtil.toJson(stats.get("languageStats")));
            analysis.setRepoStats(jsonUtil.toJson(stats.get("repoStats")));
            analysis.setActivityScore((BigDecimal) stats.get("activityScore"));
            analysis.setReadmeScore((BigDecimal) stats.get("readmeScore"));
            analysis.setDiversityScore((BigDecimal) stats.get("diversityScore"));
            analysis.setRecommendations(jsonUtil.toJson(stats.get("recommendations")));
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

        List<String> recommendations = new ArrayList<>();
        if (repoCount < 3) recommendations.add("Add more original projects to your portfolio");
        if (readmeScore.compareTo(BigDecimal.valueOf(50)) < 0) recommendations.add("Add detailed README files to repositories");
        if (languages.size() < 2) recommendations.add("Showcase projects in multiple languages/frameworks");

        Map<String, Object> languageStats = new HashMap<>();
        languages.forEach((k, v) -> languageStats.put(k, v * 100 / Math.max(1, repoCount)));

        return Map.of(
                "overallScore", overall,
                "languageStats", languageStats,
                "repoStats", Map.of("count", repoCount, "stars", totalStars, "languages", languages.size()),
                "activityScore", activityScore,
                "readmeScore", readmeScore,
                "diversityScore", diversityScore,
                "recommendations", recommendations
        );
    }
}
