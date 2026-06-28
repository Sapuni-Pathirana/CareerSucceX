package com.careersuccex.common.service;

import com.careersuccex.common.util.JsonUtil;
import com.careersuccex.integration.ai.AiDtos;
import com.careersuccex.profile.entity.UserProfile;
import com.careersuccex.profile.repository.UserProfileRepository;
import com.careersuccex.skills.dto.SkillDtos;
import com.careersuccex.skills.entity.TargetRole;
import com.careersuccex.skills.repository.TargetRoleRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class RoleContextBuilder {

    private final UserProfileRepository profileRepository;
    private final TargetRoleRepository targetRoleRepository;
    private final JsonUtil jsonUtil;

    public TargetRole resolveTargetRole(UUID userId, UUID targetRoleId) {
        if (targetRoleId != null) {
            return targetRoleRepository.findById(targetRoleId).orElse(null);
        }
        return profileRepository.findByUserId(userId)
                .map(UserProfile::getTargetRole)
                .orElse(null);
    }

    public AiDtos.RoleContext toRoleContext(TargetRole role) {
        if (role == null) {
            AiDtos.RoleContext ctx = new AiDtos.RoleContext();
            ctx.setTitle("Software Engineering Intern");
            ctx.setIndustry("Technology");
            ctx.setDescription("Entry-level software engineering internship role.");
            return ctx;
        }

        AiDtos.RoleContext ctx = new AiDtos.RoleContext();
        ctx.setTitle(role.getTitle());
        ctx.setIndustry(role.getIndustry() != null ? role.getIndustry() : "");
        ctx.setDescription(role.getDescription() != null ? role.getDescription() : "");
        ctx.setRequiredSkills(parseRequiredSkills(role.getRequiredSkills()));
        return ctx;
    }

    public String buildJobDescription(TargetRole role) {
        if (role == null) {
            return "Software Engineering Intern";
        }
        StringBuilder sb = new StringBuilder(role.getTitle());
        if (role.getDescription() != null && !role.getDescription().isBlank()) {
            sb.append(". ").append(role.getDescription());
        }
        List<AiDtos.RoleSkillRequirement> skills = parseRequiredSkills(role.getRequiredSkills());
        if (!skills.isEmpty()) {
            sb.append(" Required skills: ");
            sb.append(String.join(", ", skills.stream().map(AiDtos.RoleSkillRequirement::getSkillName).toList()));
        }
        return sb.toString();
    }

    private List<AiDtos.RoleSkillRequirement> parseRequiredSkills(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            List<SkillDtos.RequiredSkillEntry> entries = jsonUtil.fromJson(json, new TypeReference<>() {});
            List<AiDtos.RoleSkillRequirement> result = new ArrayList<>();
            for (SkillDtos.RequiredSkillEntry entry : entries) {
                AiDtos.RoleSkillRequirement req = new AiDtos.RoleSkillRequirement();
                req.setSkillName(entry.getSkillName());
                req.setMinLevel(entry.getMinLevel() != null ? entry.getMinLevel() : 1);
                req.setWeight(entry.getWeight() != null ? entry.getWeight() : 1.0);
                result.add(req);
            }
            return result;
        } catch (Exception e) {
            return List.of();
        }
    }
}
