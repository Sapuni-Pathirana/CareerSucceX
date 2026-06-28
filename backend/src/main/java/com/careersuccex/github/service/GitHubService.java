package com.careersuccex.github.service;

import com.careersuccex.auth.entity.User;
import com.careersuccex.auth.repository.UserRepository;
import com.careersuccex.common.enums.JobType;
import com.careersuccex.common.exception.ApiException;
import com.careersuccex.common.service.AnalysisAsyncExecutor;
import com.careersuccex.common.service.AnalysisJobService;
import com.careersuccex.common.service.RateLimitService;
import com.careersuccex.common.service.RoleContextBuilder;
import com.careersuccex.common.util.EncryptionUtil;
import com.careersuccex.common.util.JsonUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.careersuccex.github.dto.GitHubDtos;
import com.careersuccex.github.entity.GitHubAnalysis;
import com.careersuccex.github.entity.GitHubConnection;
import com.careersuccex.github.repository.GitHubAnalysisRepository;
import com.careersuccex.github.repository.GitHubConnectionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GitHubService {

    private final GitHubConnectionRepository connectionRepository;
    private final GitHubAnalysisRepository analysisRepository;
    private final UserRepository userRepository;
    private final EncryptionUtil encryptionUtil;
    private final WebClient.Builder webClientBuilder;
    private final AnalysisJobService jobService;
    private final RateLimitService rateLimitService;
    private final AnalysisAsyncExecutor analysisAsyncExecutor;
    private final JsonUtil jsonUtil;
    private final RoleContextBuilder roleContextBuilder;

    @Value("${app.github.client-id:}")
    private String clientId;

    @Value("${app.github.client-secret:}")
    private String clientSecret;

    @Value("${app.github.redirect-uri:}")
    private String redirectUri;

    public String getConnectUrl(UUID userId) {
        if (!isOAuthConfigured()) {
            throw new ApiException("GitHub OAuth not configured", HttpStatus.SERVICE_UNAVAILABLE);
        }
        if (!userRepository.existsById(userId)) {
            throw new ApiException("User not found", HttpStatus.NOT_FOUND);
        }
        return UriComponentsBuilder.fromUriString("https://github.com/login/oauth/authorize")
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("scope", "repo read:user")
                .queryParam("state", userId.toString())
                .build().toUriString();
    }

    @Transactional
    public void handleCallback(String code, UUID userId) {
        if (!isOAuthConfigured()) {
            throw new ApiException("GitHub OAuth not configured", HttpStatus.SERVICE_UNAVAILABLE);
        }
        String token = exchangeCodeForToken(code);
        JsonNode userNode = fetchGitHubUser(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
        GitHubConnection conn = connectionRepository.findByUserId(userId)
                .orElse(GitHubConnection.builder().user(user).build());
        conn.setGithubUserId(userNode.get("id").asLong());
        conn.setGithubUsername(userNode.get("login").asText());
        conn.setAccessTokenEnc(encryptionUtil.encrypt(token));
        conn.setConnectedAt(Instant.now());
        conn.setLastSyncedAt(Instant.now());
        connectionRepository.save(conn);
    }

    @Transactional
    public GitHubDtos.AnalyzeResponse analyze(UUID userId, GitHubDtos.AnalyzeRequest request) {
        if (!rateLimitService.allowGithubRefresh(userId)) {
            throw new ApiException("Daily GitHub refresh limit reached", HttpStatus.TOO_MANY_REQUESTS);
        }
        GitHubConnection conn = connectionRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException("GitHub not connected", HttpStatus.BAD_REQUEST));
        UUID targetRoleId = request != null ? request.getTargetRoleId() : null;
        boolean includeJustifications = true;
        var targetRole = roleContextBuilder.resolveTargetRole(userId, targetRoleId);

        var job = jobService.createJob(conn.getUser(), JobType.GITHUB_SYNC);
        GitHubAnalysis analysis = GitHubAnalysis.builder().connection(conn).build();
        analysis = analysisRepository.save(analysis);
        analysisAsyncExecutor.runGitHubAnalysis(job.getId(), analysis.getId(), conn, targetRole, includeJustifications);
        return GitHubDtos.AnalyzeResponse.builder().jobId(job.getId()).analysisId(analysis.getId()).status("PENDING").build();
    }

    public GitHubDtos.AnalysisResponse getLatest(UUID userId) {
        GitHubAnalysis a = analysisRepository.findFirstByConnectionUserIdOrderByAnalyzedAtDesc(userId)
                .orElseThrow(() -> new ApiException("No analysis found", HttpStatus.NOT_FOUND));
        return toResponse(a);
    }

    public List<GitHubDtos.AnalysisResponse> listAnalyses(UUID userId) {
        return analysisRepository.findByConnectionUserIdOrderByAnalyzedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void disconnect(UUID userId) {
        connectionRepository.findByUserId(userId).ifPresent(connectionRepository::delete);
    }

    public GitHubDtos.ConnectionStatus getStatus(UUID userId) {
        boolean oauthConfigured = isOAuthConfigured();
        return connectionRepository.findByUserId(userId)
                .map(c -> GitHubDtos.ConnectionStatus.builder()
                        .connected(true)
                        .oauthConfigured(oauthConfigured)
                        .username(c.getGithubUsername())
                        .lastSyncedAt(c.getLastSyncedAt())
                        .build())
                .orElse(GitHubDtos.ConnectionStatus.builder()
                        .connected(false)
                        .oauthConfigured(oauthConfigured)
                        .build());
    }

    private boolean isOAuthConfigured() {
        return clientId != null && !clientId.isBlank()
                && clientSecret != null && !clientSecret.isBlank()
                && redirectUri != null && !redirectUri.isBlank();
    }

    private String exchangeCodeForToken(String code) {
        Map<?, ?> response = webClientBuilder.build().post()
                .uri("https://github.com/login/oauth/access_token")
                .header("Accept", "application/json")
                .bodyValue(Map.of("client_id", clientId, "client_secret", clientSecret, "code", code))
                .retrieve().bodyToMono(Map.class).block();
        if (response == null || !response.containsKey("access_token")) {
            throw new ApiException("GitHub OAuth failed", HttpStatus.BAD_REQUEST);
        }
        return String.valueOf(response.get("access_token"));
    }

    private JsonNode fetchGitHubUser(String token) {
        return webClientBuilder.build().get()
                .uri("https://api.github.com/user")
                .header("Authorization", "Bearer " + token)
                .retrieve().bodyToMono(JsonNode.class).block();
    }

    private GitHubDtos.AnalysisResponse toResponse(GitHubAnalysis a) {
        Map<String, Object> languageStats = Map.of();
        Map<String, Object> repoStats = Map.of();
        List<String> recommendations = List.of();
        List<String> summaryTips = List.of();
        String summaryText = null;
        String reportSummary = null;
        List<GitHubDtos.RecommendationItem> recommendationItems = List.of();
        BigDecimal roleAlignmentScore = null;
        String roleAlignmentSummary = null;
        String targetRoleTitle = null;
        try {
            if (a.getLanguageStats() != null) {
                languageStats = jsonUtil.fromJson(a.getLanguageStats(), new TypeReference<>() {});
            }
            if (a.getRepoStats() != null) {
                repoStats = jsonUtil.fromJson(a.getRepoStats(), new TypeReference<>() {});
                if (repoStats.get("roleAlignmentScore") != null) {
                    roleAlignmentScore = new BigDecimal(String.valueOf(repoStats.get("roleAlignmentScore")));
                }
                if (repoStats.get("roleAlignmentSummary") != null) {
                    roleAlignmentSummary = String.valueOf(repoStats.get("roleAlignmentSummary"));
                }
                if (repoStats.get("targetRoleTitle") != null) {
                    targetRoleTitle = String.valueOf(repoStats.get("targetRoleTitle"));
                }
            }
            if (a.getRecommendations() != null) {
                RecommendationPayload payload = parseRecommendationPayload(a.getRecommendations());
                summaryTips = payload.summaryTips();
                summaryText = payload.summaryText();
                reportSummary = payload.reportSummary();
                recommendationItems = payload.recommendations();
                recommendations = summaryText != null && !summaryText.isBlank()
                        ? List.of(summaryText)
                        : summaryTips.isEmpty()
                                ? recommendationItems.stream().map(GitHubDtos.RecommendationItem::getText).toList()
                                : summaryTips;
            }
        } catch (Exception ignored) {}

        return GitHubDtos.AnalysisResponse.builder()
                .id(a.getId())
                .overallScore(a.getOverallScore())
                .activityScore(a.getActivityScore())
                .readmeScore(a.getReadmeScore())
                .diversityScore(a.getDiversityScore())
                .roleAlignmentScore(roleAlignmentScore)
                .roleAlignmentSummary(roleAlignmentSummary)
                .targetRoleTitle(targetRoleTitle)
                .languageStats(languageStats)
                .repoStats(repoStats)
                .summaryTips(summaryTips)
                .summaryText(summaryText)
                .reportSummary(reportSummary)
                .recommendations(recommendations)
                .recommendationItems(recommendationItems)
                .analyzedAt(a.getAnalyzedAt())
                .build();
    }

    private record RecommendationPayload(
            List<String> summaryTips,
            String summaryText,
            String reportSummary,
            List<GitHubDtos.RecommendationItem> recommendations) {}

    private RecommendationPayload parseRecommendationPayload(String json) {
        try {
            Object raw = jsonUtil.fromJson(json, Object.class);
            if (raw instanceof Map<?, ?> map) {
                List<String> tips = parseSummaryTips(map.get("summaryTips"));
                String text = map.get("summaryText") != null ? String.valueOf(map.get("summaryText")).trim() : "";
                String report = map.get("reportSummary") != null ? String.valueOf(map.get("reportSummary")).trim() : "";
                List<GitHubDtos.RecommendationItem> items = parseRecommendationEntries(map.get("recommendations"));
                if (items.isEmpty()) {
                    items = parseRecommendationEntries(raw);
                }
                if (text.isBlank() && !tips.isEmpty()) {
                    text = String.join(" ", tips);
                }
                if (text.isBlank() && !items.isEmpty()) {
                    text = items.stream()
                            .map(GitHubDtos.RecommendationItem::getText)
                            .limit(3)
                            .reduce((a, b) -> a + " " + b)
                            .orElse("");
                }
                if (report.isBlank() && !text.isBlank()) {
                    report = text;
                }
                if (report.isBlank() && !items.isEmpty()) {
                    report = items.stream()
                            .map(GitHubDtos.RecommendationItem::getText)
                            .limit(4)
                            .reduce((a, b) -> a + "; " + b)
                            .map(s -> "Priority improvements include: " + s + ".")
                            .orElse("");
                }
                return new RecommendationPayload(tips, text, report, items);
            }
            return new RecommendationPayload(List.of(), "", "", parseRecommendationEntries(raw));
        } catch (Exception e) {
            return new RecommendationPayload(List.of(), "", "", List.of());
        }
    }

    private List<String> parseSummaryTips(Object raw) {
        if (!(raw instanceof List<?> list)) {
            return List.of();
        }
        List<String> tips = new ArrayList<>();
        for (Object entry : list) {
            if (entry == null) continue;
            String text = String.valueOf(entry).trim();
            if (!text.isBlank()) {
                tips.add(text);
            }
        }
        return tips.size() > 4 ? tips.subList(0, 4) : tips;
    }

    private List<GitHubDtos.RecommendationItem> parseRecommendationEntries(Object raw) {
        if (!(raw instanceof List<?> entries)) {
            return List.of();
        }
        List<GitHubDtos.RecommendationItem> items = new ArrayList<>();
        for (Object entry : entries) {
            if (entry instanceof String text) {
                items.add(GitHubDtos.RecommendationItem.builder().text(text).priority("medium").build());
            } else if (entry instanceof Map<?, ?> map) {
                items.add(GitHubDtos.RecommendationItem.builder()
                        .text(map.get("text") != null ? String.valueOf(map.get("text")) : "")
                        .justification(map.get("justification") != null ? String.valueOf(map.get("justification")) : null)
                        .evidence(map.get("evidence") != null ? String.valueOf(map.get("evidence")) : null)
                        .priority(map.get("priority") != null ? String.valueOf(map.get("priority")) : "medium")
                        .build());
            }
        }
        return items.stream().filter(i -> i.getText() != null && !i.getText().isBlank()).toList();
    }

    private List<GitHubDtos.RecommendationItem> parseRecommendations(String json) {
        return parseRecommendationPayload(json).recommendations();
    }
}
