package com.careersuccex.auth.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID id;
    private String email;
    private String role;
    private ProfileSummary profile;

    @Data
    @Builder
    public static class ProfileSummary {
        private String fullName;
        private String university;
        private String degree;
        private Integer graduationYear;
        private UUID targetRoleId;
        private String targetRoleTitle;
    }
}
