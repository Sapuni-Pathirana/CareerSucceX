package com.careersuccex.skills.service;

import com.careersuccex.common.exception.ApiException;
import com.careersuccex.common.util.JsonUtil;
import com.careersuccex.skills.dto.SkillDtos;
import com.careersuccex.skills.entity.TargetRole;
import com.careersuccex.skills.repository.TargetRoleRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TargetRoleService {

    private final TargetRoleRepository targetRoleRepository;
    private final JsonUtil jsonUtil;

    public List<SkillDtos.TargetRoleResponse> listRoles() {
        return targetRoleRepository.findAll().stream().map(this::toResponse).toList();
    }

    public SkillDtos.TargetRoleResponse getRole(UUID id) {
        return targetRoleRepository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new ApiException("Role not found", HttpStatus.NOT_FOUND));
    }

    private SkillDtos.TargetRoleResponse toResponse(TargetRole role) {
        List<SkillDtos.RequiredSkillEntry> skills = List.of();
        if (role.getRequiredSkills() != null) {
            try {
                skills = jsonUtil.fromJson(role.getRequiredSkills(), new TypeReference<>() {});
            } catch (Exception ignored) {}
        }
        return SkillDtos.TargetRoleResponse.builder()
                .id(role.getId())
                .title(role.getTitle())
                .industry(role.getIndustry())
                .description(role.getDescription())
                .requiredSkills(skills)
                .build();
    }
}
