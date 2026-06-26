package com.careersuccex.profile.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
public class DashboardResponse {
    private ReadinessSummary readiness;
    private BigDecimal cvScore;
    private BigDecimal githubScore;
    private BigDecimal skillsScore;
    private BigDecimal interviewScore;
    private BigDecimal verificationScore;
    private int skillGapCount;
    private int verifiedSkillsCount;
    private int verifiedRequiredCount;
    private int requiredSkillsCount;
    private List<ActivityItem> recentActivity;

    @Data
    @Builder
    public static class ReadinessSummary {
        private BigDecimal overallScore;
        private Instant calculatedAt;
    }

    @Data
    @Builder
    public static class ActivityItem {
        private String type;
        private String title;
        private Instant timestamp;
    }
}
