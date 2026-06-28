package com.careersuccex.github.controller;

import com.careersuccex.auth.security.SecurityUtils;
import com.careersuccex.github.dto.GitHubDtos;
import com.careersuccex.github.service.GitHubService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/github")
@RequiredArgsConstructor
public class GitHubController {

    private final GitHubService gitHubService;
    private final SecurityUtils securityUtils;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @GetMapping("/connect")
    public Map<String, String> connect() {
        String url = gitHubService.getConnectUrl(securityUtils.getCurrentUserId());
        return Map.of("url", url);
    }

    @GetMapping("/callback")
    public ResponseEntity<Void> callback(@RequestParam String code, @RequestParam UUID state) {
        gitHubService.handleCallback(code, state);
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(frontendUrl + "/analyze?connected=true#github-analysis"));
        return ResponseEntity.status(302).headers(headers).build();
    }

    @GetMapping("/status")
    public GitHubDtos.ConnectionStatus status() {
        return gitHubService.getStatus(securityUtils.getCurrentUserId());
    }

    @PostMapping("/analyze")
    public GitHubDtos.AnalyzeResponse analyze(@RequestBody(required = false) GitHubDtos.AnalyzeRequest request) {
        return gitHubService.analyze(securityUtils.getCurrentUserId(), request);
    }

    @GetMapping("/analyses")
    public List<GitHubDtos.AnalysisResponse> listAnalyses() {
        return gitHubService.listAnalyses(securityUtils.getCurrentUserId());
    }

    @GetMapping("/analyses/latest")
    public GitHubDtos.AnalysisResponse latest() {
        return gitHubService.getLatest(securityUtils.getCurrentUserId());
    }

    @DeleteMapping("/disconnect")
    public void disconnect() {
        gitHubService.disconnect(securityUtils.getCurrentUserId());
    }
}
