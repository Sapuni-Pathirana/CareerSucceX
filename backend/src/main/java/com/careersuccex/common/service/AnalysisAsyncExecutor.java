package com.careersuccex.common.service;

import com.careersuccex.cv.entity.CvDocument;
import com.careersuccex.cv.service.CvAnalysisRunner;
import com.careersuccex.github.entity.GitHubConnection;
import com.careersuccex.github.service.GitHubAnalysisRunner;
import com.careersuccex.skills.entity.TargetRole;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnalysisAsyncExecutor {

    private final CvAnalysisRunner cvAnalysisRunner;
    private final GitHubAnalysisRunner githubAnalysisRunner;

    @Async("taskExecutor")
    public void runCvAnalysis(UUID jobId, UUID analysisId, CvDocument doc, TargetRole targetRole, boolean includeJustifications) {
        cvAnalysisRunner.run(jobId, analysisId, doc, targetRole, includeJustifications);
    }

    @Async("taskExecutor")
    public void runGitHubAnalysis(UUID jobId, UUID analysisId, GitHubConnection connection, TargetRole targetRole, boolean includeJustifications) {
        githubAnalysisRunner.run(jobId, analysisId, connection, targetRole, includeJustifications);
    }
}
