package com.careersuccex.skills.service;

import com.careersuccex.auth.repository.UserRepository;
import com.careersuccex.common.enums.GapPriority;
import com.careersuccex.common.exception.ApiException;
import com.careersuccex.common.util.JsonUtil;
import com.careersuccex.profile.repository.UserProfileRepository;
import com.careersuccex.skills.dto.SkillDtos;
import com.careersuccex.skills.entity.Skill;
import com.careersuccex.skills.entity.SkillGap;
import com.careersuccex.skills.entity.TargetRole;
import com.careersuccex.skills.entity.UserSkill;
import com.careersuccex.skills.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SkillGapService {

    private final SkillGapRepository skillGapRepository;
    private final UserSkillRepository userSkillRepository;
    private final TargetRoleRepository targetRoleRepository;
    private final SkillRepository skillRepository;
    private final UserProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final JsonUtil jsonUtil;

    @Transactional
    public List<SkillDtos.SkillGapResponse> recalculate(UUID userId, UUID targetRoleId) {
        TargetRole role = targetRoleRepository.findById(targetRoleId)
                .orElseThrow(() -> new ApiException("Target role not found", HttpStatus.NOT_FOUND));
        skillGapRepository.deleteByUserIdAndTargetRoleId(userId, targetRoleId);

        Map<UUID, Integer> userLevels = userSkillRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(us -> us.getSkill().getId(), UserSkill::getLevel, Math::max));

        var user = userRepository.findById(userId).orElseThrow();
        List<SkillDtos.RequiredSkillEntry> required = parseRequiredSkills(role.getRequiredSkills());
        List<SkillDtos.SkillGapResponse> gaps = new ArrayList<>();

        for (SkillDtos.RequiredSkillEntry req : required) {
            Skill skill = skillRepository.findById(req.getSkillId()).orElse(null);
            if (skill == null) continue;
            int current = userLevels.getOrDefault(skill.getId(), 0);
            if (current < req.getMinLevel()) {
                GapPriority priority = current == 0 ? GapPriority.CRITICAL
                        : (req.getMinLevel() - current >= 2 ? GapPriority.CRITICAL : GapPriority.RECOMMENDED);
                skillGapRepository.save(SkillGap.builder()
                        .user(user)
                        .targetRole(role)
                        .skill(skill)
                        .priority(priority)
                        .currentLevel(current)
                        .requiredLevel(req.getMinLevel())
                        .detectedAt(Instant.now())
                        .build());
                gaps.add(SkillDtos.SkillGapResponse.builder()
                        .skillId(skill.getId())
                        .skillName(skill.getName())
                        .priority(priority.name())
                        .currentLevel(current)
                        .requiredLevel(req.getMinLevel())
                        .build());
            }
        }
        return gaps;
    }

    @Transactional
    public List<SkillDtos.SkillGapResponse> getGaps(UUID userId, UUID targetRoleId) {
        UUID roleId = targetRoleId;
        if (roleId == null) {
            roleId = profileRepository.findByUserId(userId)
                    .filter(p -> p.getTargetRole() != null)
                    .map(p -> p.getTargetRole().getId())
                    .orElseThrow(() -> new ApiException("No target role set", HttpStatus.BAD_REQUEST));
        }
        var existing = skillGapRepository.findByUserIdAndTargetRoleId(userId, roleId);
        if (existing.isEmpty()) {
            return recalculate(userId, roleId);
        }
        return existing.stream().map(g -> SkillDtos.SkillGapResponse.builder()
                .skillId(g.getSkill().getId())
                .skillName(g.getSkill().getName())
                .priority(g.getPriority().name())
                .currentLevel(g.getCurrentLevel())
                .requiredLevel(g.getRequiredLevel())
                .build()).toList();
    }

    private List<SkillDtos.RequiredSkillEntry> parseRequiredSkills(String json) {
        if (json == null) return List.of();
        try {
            return jsonUtil.fromJson(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
