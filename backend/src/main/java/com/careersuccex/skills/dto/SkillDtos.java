package com.careersuccex.skills.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class SkillDtos {

    @Data
    @Builder
    public static class SkillResponse {
        private UUID id;
        private String name;
        private String category;
        private String description;
    }

    @Data
    @Builder
    public static class UserSkillResponse {
        private UUID skillId;
        private String skillName;
        private String category;
        private Integer level;
        private BigDecimal confidence;
        private String source;
    }

    @Data
    public static class SelfAssessmentItem {
        private UUID skillId;
        private Integer level;
    }

    @Data
    @Builder
    public static class SkillGapResponse {
        private UUID skillId;
        private String skillName;
        private String priority;
        private Integer currentLevel;
        private Integer requiredLevel;
    }

    @Data
    @Builder
    public static class TargetRoleResponse {
        private UUID id;
        private String title;
        private String industry;
        private String description;
        private List<RequiredSkillEntry> requiredSkills;
    }

    @Data
    public static class RequiredSkillEntry {
        private UUID skillId;
        private String skillName;
        private Integer weight;
        private Integer minLevel;
    }
}
