package com.careersuccex.readiness.service;

import com.careersuccex.auth.repository.UserRepository;
import com.careersuccex.common.util.JsonUtil;
import com.careersuccex.cv.repository.CvAnalysisRepository;
import com.careersuccex.github.repository.GitHubAnalysisRepository;
import com.careersuccex.interview.repository.MockInterviewSessionRepository;
import com.careersuccex.common.enums.SessionStatus;
import com.careersuccex.profile.repository.UserProfileRepository;
import com.careersuccex.readiness.entity.ReadinessScore;
import com.careersuccex.readiness.repository.ReadinessScoreRepository;
import com.careersuccex.skills.dto.SkillDtos;
import com.careersuccex.skills.entity.TargetRole;
import com.careersuccex.skills.entity.UserSkill;
import com.careersuccex.skills.repository.UserSkillRepository;
import com.careersuccex.verification.repository.SkillVerificationRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReadinessRecalculationService {

    private final ReadinessScoreRepository readinessScoreRepository;
    private final CvAnalysisRepository cvAnalysisRepository;
    private final GitHubAnalysisRepository githubAnalysisRepository;
    private final MockInterviewSessionRepository interviewSessionRepository;
    private final UserSkillRepository userSkillRepository;
    private final UserRepository userRepository;
    private final SkillVerificationRepository verificationRepository;
    private final UserProfileRepository profileRepository;
    private final JsonUtil jsonUtil;
    private final StringRedisTemplate redis;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ReadinessScore recalculate(UUID userId) {
        BigDecimal cvScore = cvAnalysisRepository.findByCvDocumentUserIdOrderByAnalyzedAtDesc(userId)
                .stream().findFirst().map(a -> a.getAtsScore()).orElse(BigDecimal.ZERO);
        BigDecimal githubScore = githubAnalysisRepository.findFirstByConnectionUserIdOrderByAnalyzedAtDesc(userId)
                .map(a -> a.getOverallScore()).orElse(BigDecimal.ZERO);
        BigDecimal interviewScore = computeInterviewScore(userId);
        BigDecimal skillsScore = computeSkillsScore(userId);
        BigDecimal verificationScore = computeVerificationScore(userId);

        BigDecimal overall = cvScore.multiply(BigDecimal.valueOf(0.25))
                .add(githubScore.multiply(BigDecimal.valueOf(0.20)))
                .add(skillsScore.multiply(BigDecimal.valueOf(0.25)))
                .add(interviewScore.multiply(BigDecimal.valueOf(0.20)))
                .add(verificationScore.multiply(BigDecimal.valueOf(0.10)))
                .setScale(2, RoundingMode.HALF_UP);

        Map<String, Object> breakdown = Map.of(
                "cv", cvScore, "github", githubScore, "skills", skillsScore,
                "interview", interviewScore, "verification", verificationScore
        );

        var user = userRepository.findById(userId).orElseThrow();

        ReadinessScore score = ReadinessScore.builder()
                .user(user)
                .overallScore(overall)
                .cvScore(cvScore)
                .githubScore(githubScore)
                .skillsScore(skillsScore)
                .interviewScore(interviewScore)
                .verificationScore(verificationScore)
                .breakdownJson(jsonUtil.toJson(breakdown))
                .calculatedAt(Instant.now())
                .build();

        score = readinessScoreRepository.save(score);

        Map<String, Object> cachePayload = Map.of(
                "id", score.getId().toString(),
                "overallScore", overall,
                "cvScore", cvScore,
                "githubScore", githubScore,
                "skillsScore", skillsScore,
                "interviewScore", interviewScore,
                "verificationScore", verificationScore,
                "breakdown", breakdown,
                "calculatedAt", score.getCalculatedAt().toString()
        );
        redis.opsForValue().set("readiness:" + userId, jsonUtil.toJson(cachePayload), Duration.ofHours(24));
        return score;
    }

    private BigDecimal computeInterviewScore(UUID userId) {
        var sessions = interviewSessionRepository.findByUserIdAndStatusOrderByCompletedAtDesc(userId, SessionStatus.COMPLETED);
        if (sessions.isEmpty()) return BigDecimal.ZERO;
        return sessions.stream().limit(3)
                .map(s -> s.getOverallScore() != null ? s.getOverallScore() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(Math.min(3, sessions.size())), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal computeSkillsScore(UUID userId) {
        TargetRole role = profileRepository.findByUserId(userId)
                .map(p -> p.getTargetRole()).orElse(null);
        if (role == null || role.getRequiredSkills() == null) return BigDecimal.ZERO;
        List<SkillDtos.RequiredSkillEntry> required = parseRequired(role.getRequiredSkills());
        if (required.isEmpty()) return BigDecimal.ZERO;
        Map<UUID, Integer> levels = userSkillRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(us -> us.getSkill().getId(), UserSkill::getLevel, Math::max));
        long matched = required.stream()
                .filter(r -> levels.getOrDefault(r.getSkillId(), 0) >= r.getMinLevel())
                .count();
        return BigDecimal.valueOf(matched * 100.0 / required.size()).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal computeVerificationScore(UUID userId) {
        TargetRole role = profileRepository.findByUserId(userId)
                .map(p -> p.getTargetRole()).orElse(null);
        if (role == null || role.getRequiredSkills() == null) return BigDecimal.ZERO;
        List<SkillDtos.RequiredSkillEntry> required = parseRequired(role.getRequiredSkills());
        if (required.isEmpty()) return BigDecimal.ZERO;
        var verified = verificationRepository.findByUserIdAndPassedTrue(userId).stream()
                .map(v -> v.getSkill().getId()).collect(Collectors.toSet());
        long matched = required.stream().filter(r -> verified.contains(r.getSkillId())).count();
        return BigDecimal.valueOf(matched * 100.0 / required.size()).setScale(2, RoundingMode.HALF_UP);
    }

    private List<SkillDtos.RequiredSkillEntry> parseRequired(String json) {
        try {
            return jsonUtil.fromJson(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
