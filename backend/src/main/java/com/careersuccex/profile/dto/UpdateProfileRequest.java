package com.careersuccex.profile.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class UpdateProfileRequest {
    private String fullName;
    private String university;
    private String degree;
    private Integer graduationYear;
    private UUID targetRoleId;
    private String bio;
    private String avatarUrl;
}
