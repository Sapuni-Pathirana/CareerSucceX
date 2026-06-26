package com.careersuccex.github.service;

import com.careersuccex.auth.entity.User;
import com.careersuccex.auth.repository.UserRepository;
import com.careersuccex.common.enums.JobType;
import com.careersuccex.common.exception.ApiException;
import com.careersuccex.common.service.AnalysisAsyncExecutor;
import com.careersuccex.common.service.AnalysisJobService;
import com.careersuccex.common.service.RateLimitService;
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

import java.time.Instant;
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
    public GitHubDtos.AnalyzeResponse analyze(UUID userId) {
        if (!rateLimitService.allowGithubRefresh(userId)) {
            throw new ApiException("Daily GitHub refresh limit reached", HttpStatus.TOO_MANY_REQUESTS);
        }
        GitHubConnection conn = connectionRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException("GitHub not connected", HttpStatus.BAD_REQUEST));
        var job = jobService.createJob(conn.getUser(), JobType.GITHUB_SYNC);
        GitHubAnalysis analysis = GitHubAnalysis.builder().connection(conn).build();
        analysis = analysisRepository.save(analysis);
        analysisAsyncExecutor.runGitHubAnalysis(job.getId(), analysis.getId(), conn);
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
        try {
            if (a.getLanguageStats() != null) {
                languageStats = jsonUtil.fromJson(a.getLanguageStats(), new TypeReference<>() {});
            }
            if (a.getRepoStats() != null) {
                repoStats = jsonUtil.fromJson(a.getRepoStats(), new TypeReference<>() {});
            }
            if (a.getRecommendations() != null) {
                recommendations = jsonUtil.fromJson(a.getRecommendations(), new TypeReference<>() {});
            }
        } catch (Exception ignored) {}

        return GitHubDtos.AnalysisResponse.builder()
                .id(a.getId())
                .overallScore(a.getOverallScore())
                .activityScore(a.getActivityScore())
                .readmeScore(a.getReadmeScore())
                .diversityScore(a.getDiversityScore())
                .languageStats(languageStats)
                .repoStats(repoStats)
                .recommendations(recommendations)
                .analyzedAt(a.getAnalyzedAt())
                .build();
    }
}
