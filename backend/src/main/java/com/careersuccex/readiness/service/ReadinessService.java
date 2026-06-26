package com.careersuccex.readiness.service;

import com.careersuccex.common.enums.SessionStatus;
import com.careersuccex.cv.repository.CvAnalysisRepository;
import com.careersuccex.github.repository.GitHubAnalysisRepository;
import com.careersuccex.interview.repository.MockInterviewSessionRepository;
import com.careersuccex.readiness.dto.ReadinessDtos;
import com.careersuccex.readiness.entity.ReadinessScore;
import com.careersuccex.readiness.repository.ReadinessScoreRepository;
import com.careersuccex.skills.repository.UserSkillRepository;
import com.careersuccex.verification.repository.SkillVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReadinessService {

    private final ReadinessScoreRepository readinessScoreRepository;
    private final ReadinessRecalculationService recalculationService;
    private final CvAnalysisRepository cvAnalysisRepository;
    private final GitHubAnalysisRepository githubAnalysisRepository;
    private final MockInterviewSessionRepository interviewSessionRepository;
    private final SkillVerificationRepository verificationRepository;
    private final UserSkillRepository userSkillRepository;

    public ReadinessDtos.ScoreResponse getLatest(UUID userId) {
        ReadinessScore score = readinessScoreRepository.findFirstByUserIdOrderByCalculatedAtDesc(userId)
                .filter(existing -> !isStale(userId, existing.getCalculatedAt(), existing))
                .orElseGet(() -> recalculationService.recalculate(userId));
        return toResponse(score);
    }

    public List<ReadinessDtos.HistoryPoint> getHistory(UUID userId) {
        return readinessScoreRepository.findByUserIdOrderByCalculatedAtDesc(userId).stream()
                .map(s -> ReadinessDtos.HistoryPoint.builder()
                        .overallScore(s.getOverallScore())
                        .calculatedAt(s.getCalculatedAt())
                        .build())
                .toList();
    }

    public List<String> getRecommendations(UUID userId) {
        ReadinessScore score = readinessScoreRepository.findFirstByUserIdOrderByCalculatedAtDesc(userId)
                .filter(existing -> !isStale(userId, existing.getCalculatedAt(), existing))
                .orElseGet(() -> recalculationService.recalculate(userId));
        List<String> tips = new ArrayList<>();
        if (score.getCvScore().compareTo(score.getGithubScore()) < 0 && score.getCvScore().compareTo(BigDecimal.valueOf(70)) < 0) {
            tips.add("Upload and optimize your CV to improve ATS score");
        }
        if (score.getGithubScore().compareTo(BigDecimal.valueOf(50)) < 0) {
            tips.add("Connect GitHub and add projects with README files");
        }
        if (score.getInterviewScore().compareTo(BigDecimal.valueOf(60)) < 0) {
            tips.add("Complete a mock interview session");
        }
        if (score.getSkillsScore().compareTo(BigDecimal.valueOf(60)) < 0) {
            tips.add("Review skill gaps and complete self-assessment");
        }
        if (score.getVerificationScore().compareTo(BigDecimal.valueOf(40)) < 0) {
            tips.add("Verify key skills with quizzes");
        }
        if (tips.isEmpty()) tips.add("Great progress! Keep building projects and practicing interviews");
        return tips;
    }

    private boolean isStale(UUID userId, Instant calculatedAt, ReadinessScore existing) {
        var latestCv = cvAnalysisRepository.findByCvDocumentUserIdOrderByAnalyzedAtDesc(userId)
                .stream().findFirst().orElse(null);
        if (latestCv != null && latestCv.getAnalyzedAt().isAfter(calculatedAt)) {
            return true;
        }

        var latestGh = githubAnalysisRepository.findFirstByConnectionUserIdOrderByAnalyzedAtDesc(userId).orElse(null);
        if (latestGh != null && latestGh.getAnalyzedAt().isAfter(calculatedAt)) {
            return true;
        }

        var latestInterview = interviewSessionRepository
                .findByUserIdAndStatusOrderByCompletedAtDesc(userId, SessionStatus.COMPLETED)
                .stream().findFirst().orElse(null);
        if (latestInterview != null && latestInterview.getCompletedAt() != null
                && latestInterview.getCompletedAt().isAfter(calculatedAt)) {
            return true;
        }

        var latestVerification = verificationRepository.findByUserIdOrderByVerifiedAtDesc(userId)
                .stream().findFirst().orElse(null);
        if (latestVerification != null && latestVerification.getVerifiedAt().isAfter(calculatedAt)) {
            return true;
        }

        if (userSkillRepository.findByUserId(userId).stream()
                .anyMatch(skill -> skill.getUpdatedAt() != null && skill.getUpdatedAt().isAfter(calculatedAt))) {
            return true;
        }

        BigDecimal freshVerification = recalculationService.computeVerificationScore(userId);
        if (existing.getVerificationScore().compareTo(freshVerification) != 0) {
            return true;
        }

        BigDecimal freshSkills = recalculationService.computeSkillsScore(userId);
        return existing.getSkillsScore().compareTo(freshSkills) != 0;
    }

    private ReadinessDtos.ScoreResponse toResponse(ReadinessScore s) {
        Map<String, BigDecimal> breakdown = Map.of(
                "cv", s.getCvScore(), "github", s.getGithubScore(),
                "skills", s.getSkillsScore(), "interview", s.getInterviewScore(),
                "verification", s.getVerificationScore()
        );
        return ReadinessDtos.ScoreResponse.builder()
                .overallScore(s.getOverallScore())
                .breakdown(breakdown)
                .calculatedAt(s.getCalculatedAt())
                .build();
    }
}
