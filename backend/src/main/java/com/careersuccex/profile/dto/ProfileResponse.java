package com.careersuccex.profile.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ProfileResponse {
    private UUID id;
    private String fullName;
    private String university;
    private String degree;
    private Integer graduationYear;
    private UUID targetRoleId;
    private String targetRoleTitle;
    private String bio;
    private String avatarUrl;
}
