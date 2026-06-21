package com.careersuccex.profile.service;

import com.careersuccex.auth.entity.User;
import com.careersuccex.auth.repository.UserRepository;
import com.careersuccex.common.exception.ApiException;
import com.careersuccex.cv.repository.CvAnalysisRepository;
import com.careersuccex.github.repository.GitHubAnalysisRepository;
import com.careersuccex.interview.repository.MockInterviewSessionRepository;
import com.careersuccex.profile.dto.DashboardResponse;
import com.careersuccex.profile.dto.ProfileResponse;
import com.careersuccex.profile.dto.UpdateProfileRequest;
import com.careersuccex.profile.entity.UserProfile;
import com.careersuccex.profile.repository.UserProfileRepository;
import com.careersuccex.readiness.repository.ReadinessScoreRepository;
import com.careersuccex.skills.repository.SkillGapRepository;
import com.careersuccex.skills.repository.TargetRoleRepository;
import com.careersuccex.verification.repository.SkillVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final TargetRoleRepository targetRoleRepository;
    private final ReadinessScoreRepository readinessScoreRepository;
    private final CvAnalysisRepository cvAnalysisRepository;
    private final GitHubAnalysisRepository githubAnalysisRepository;
    private final MockInterviewSessionRepository interviewSessionRepository;
    private final SkillGapRepository skillGapRepository;
    private final SkillVerificationRepository verificationRepository;

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
        return toResponse(profileRepository.save(profile));
    }

    public DashboardResponse getDashboard(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
        UserProfile profile = profileRepository.findByUserId(userId).orElse(null);

        var readiness = readinessScoreRepository.findFirstByUserIdOrderByCalculatedAtDesc(userId)
                .map(r -> DashboardResponse.ReadinessSummary.builder()
                        .overallScore(r.getOverallScore())
                        .calculatedAt(r.getCalculatedAt())
                        .build())
                .orElse(null);

        var latestCv = cvAnalysisRepository.findByCvDocumentUserIdOrderByAnalyzedAtDesc(userId)
                .stream().findFirst().orElse(null);
        var latestGh = githubAnalysisRepository.findFirstByConnectionUserIdOrderByAnalyzedAtDesc(userId).orElse(null);
        var latestInterview = interviewSessionRepository.findByUserIdAndStatusOrderByCompletedAtDesc(
                userId, com.careersuccex.common.enums.SessionStatus.COMPLETED)
                .stream().findFirst().orElse(null);

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

        return DashboardResponse.builder()
                .readiness(readiness)
                .cvScore(latestCv != null ? latestCv.getAtsScore() : null)
                .githubScore(latestGh != null ? latestGh.getOverallScore() : null)
                .interviewScore(latestInterview != null ? latestInterview.getOverallScore() : null)
                .skillGapCount(gapCount)
                .verifiedSkillsCount(verificationRepository.findByUserIdAndPassedTrue(userId).size())
                .recentActivity(activities)
                .build();
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
