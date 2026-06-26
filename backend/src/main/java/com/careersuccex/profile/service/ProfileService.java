package com.careersuccex.profile.service;

import com.careersuccex.common.exception.ApiException;
import com.careersuccex.cv.repository.CvAnalysisRepository;
import com.careersuccex.github.repository.GitHubAnalysisRepository;
import com.careersuccex.profile.dto.DashboardResponse;
import com.careersuccex.profile.dto.ProfileResponse;
import com.careersuccex.profile.dto.UpdateProfileRequest;
import com.careersuccex.profile.entity.UserProfile;
import com.careersuccex.profile.repository.UserProfileRepository;
import com.careersuccex.readiness.service.ReadinessRecalculationService;
import com.careersuccex.readiness.service.ReadinessService;
import com.careersuccex.skills.dto.SkillDtos;
import com.careersuccex.skills.entity.TargetRole;
import com.fasterxml.jackson.core.type.TypeReference;
import com.careersuccex.skills.repository.TargetRoleRepository;
import com.careersuccex.verification.repository.SkillVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.careersuccex.skills.repository.SkillGapRepository;
import com.careersuccex.common.util.JsonUtil;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserProfileRepository profileRepository;
    private final TargetRoleRepository targetRoleRepository;
    private final ReadinessRecalculationService readinessRecalculationService;
    private final ReadinessService readinessService;
    private final CvAnalysisRepository cvAnalysisRepository;
    private final GitHubAnalysisRepository githubAnalysisRepository;
    private final SkillGapRepository skillGapRepository;
    private final SkillVerificationRepository verificationRepository;
    private final JsonUtil jsonUtil;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(UUID userId) {
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException("Profile not found", HttpStatus.NOT_FOUND));
        return toResponse(profile);
    }

    @Transactional
    public ProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException("Profile not found", HttpStatus.NOT_FOUND));
        if (request.getFullName() != null) profile.setFullName(request.getFullName());
        if (request.getUniversity() != null) profile.setUniversity(request.getUniversity());
        if (request.getDegree() != null) profile.setDegree(request.getDegree());
        if (request.getGraduationYear() != null) profile.setGraduationYear(request.getGraduationYear());
        if (request.getBio() != null) profile.setBio(request.getBio());
        if (request.getAvatarUrl() != null) profile.setAvatarUrl(request.getAvatarUrl());
        if (request.getTargetRoleId() != null) {
            profile.setTargetRole(targetRoleRepository.findById(request.getTargetRoleId())
                    .orElseThrow(() -> new ApiException("Target role not found", HttpStatus.NOT_FOUND)));
        }
        ProfileResponse response = toResponse(profileRepository.save(profile));
        if (request.getTargetRoleId() != null) {
            readinessRecalculationService.recalculate(userId);
        }
        return response;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(UUID userId) {
        UserProfile profile = profileRepository.findByUserId(userId).orElse(null);

        var latestScore = readinessService.getLatest(userId);

        var readiness = DashboardResponse.ReadinessSummary.builder()
                .overallScore(latestScore.getOverallScore())
                .calculatedAt(latestScore.getCalculatedAt())
                .build();

        var latestCv = cvAnalysisRepository.findByCvDocumentUserIdOrderByAnalyzedAtDesc(userId)
                .stream().findFirst().orElse(null);
        var latestGh = githubAnalysisRepository.findFirstByConnectionUserIdOrderByAnalyzedAtDesc(userId).orElse(null);

        BigDecimal interviewScore = latestScore.getBreakdown().get("interview");

        int gapCount = 0;
        if (profile != null && profile.getTargetRole() != null) {
            gapCount = skillGapRepository.findByUserIdAndTargetRoleId(userId, profile.getTargetRole().getId()).size();
        }

        var activities = new ArrayList<DashboardResponse.ActivityItem>();
        if (latestCv != null) {
            activities.add(DashboardResponse.ActivityItem.builder()
                    .type("CV_ANALYSIS")
                    .title("CV analyzed — ATS score " + latestCv.getAtsScore())
                    .timestamp(latestCv.getAnalyzedAt())
                    .build());
        }
        if (latestGh != null) {
            activities.add(DashboardResponse.ActivityItem.builder()
                    .type("GITHUB_ANALYSIS")
                    .title("GitHub analyzed — score " + latestGh.getOverallScore())
                    .timestamp(latestGh.getAnalyzedAt())
                    .build());
        }

        int verifiedCount = verificationRepository.findByUserIdAndPassedTrue(userId).size();
        var verificationStats = computeVerificationStats(profile, userId);

        return DashboardResponse.builder()
                .readiness(readiness)
                .cvScore(latestScore.getBreakdown().get("cv"))
                .githubScore(latestScore.getBreakdown().get("github"))
                .skillsScore(latestScore.getBreakdown().get("skills"))
                .interviewScore(interviewScore)
                .verificationScore(latestScore.getBreakdown().get("verification"))
                .skillGapCount(gapCount)
                .verifiedSkillsCount(verifiedCount)
                .verifiedRequiredCount(verificationStats.verifiedRequired())
                .requiredSkillsCount(verificationStats.requiredTotal())
                .recentActivity(activities)
                .build();
    }

    private record VerificationStats(int verifiedRequired, int requiredTotal) {}

    private VerificationStats computeVerificationStats(UserProfile profile, UUID userId) {
        TargetRole role = profile != null ? profile.getTargetRole() : null;
        if (role == null || role.getRequiredSkills() == null) {
            return new VerificationStats(0, 0);
        }
        List<SkillDtos.RequiredSkillEntry> required = parseRequired(role.getRequiredSkills());
        if (required.isEmpty()) {
            return new VerificationStats(0, 0);
        }
        Set<UUID> verified = verificationRepository.findByUserIdAndPassedTrue(userId).stream()
                .map(v -> v.getSkill().getId())
                .collect(Collectors.toSet());
        int matched = (int) required.stream()
                .filter(r -> verified.contains(r.getSkillId()))
                .count();
        return new VerificationStats(matched, required.size());
    }

    private List<SkillDtos.RequiredSkillEntry> parseRequired(String json) {
        try {
            return jsonUtil.fromJson(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private ProfileResponse toResponse(UserProfile profile) {
        return ProfileResponse.builder()
                .id(profile.getId())
                .fullName(profile.getFullName())
                .university(profile.getUniversity())
                .degree(profile.getDegree())
                .graduationYear(profile.getGraduationYear())
                .targetRoleId(profile.getTargetRole() != null ? profile.getTargetRole().getId() : null)
                .targetRoleTitle(profile.getTargetRole() != null ? profile.getTargetRole().getTitle() : null)
                .bio(profile.getBio())
                .avatarUrl(profile.getAvatarUrl())
                .build();
    }
}
