package com.careersuccex.skills.service;

import com.careersuccex.auth.entity.User;
import com.careersuccex.auth.repository.UserRepository;
import com.careersuccex.common.enums.SkillSource;
import com.careersuccex.common.exception.ApiException;
import com.careersuccex.skills.dto.SkillDtos;
import com.careersuccex.skills.entity.Skill;
import com.careersuccex.skills.entity.UserSkill;
import com.careersuccex.skills.repository.SkillRepository;
import com.careersuccex.skills.repository.UserSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SkillAggregationService {

    private final UserSkillRepository userSkillRepository;
    private final SkillRepository skillRepository;
    private final UserRepository userRepository;

    @Transactional
    public void syncFromCv(UUID userId, Map<String, Object> parsedData, UUID sourceRefId) {
        if (parsedData == null) return;
        userSkillRepository.deleteByUserIdAndSource(userId, SkillSource.CV);
        User user = userRepository.findById(userId).orElseThrow();
        Object skillsObj = parsedData.get("skills");
        if (skillsObj instanceof List<?> skills) {
            Set<UUID> savedSkillIds = new HashSet<>();
            for (Object s : skills) {
                String name = String.valueOf(s);
                skillRepository.findByNameIgnoreCase(name).ifPresent(skill -> {
                    if (savedSkillIds.add(skill.getId())) {
                        saveSkill(user, skill, 3, SkillSource.CV, sourceRefId);
                    }
                });
            }
        }
    }

    @Transactional
    public void syncFromGitHub(UUID userId, Map<String, Object> languageStats, UUID sourceRefId) {
        userSkillRepository.deleteByUserIdAndSource(userId, SkillSource.GITHUB);
        User user = userRepository.findById(userId).orElseThrow();
        if (languageStats == null) return;
        languageStats.forEach((lang, pct) -> {
            skillRepository.findByNameIgnoreCase(lang).ifPresent(skill -> {
                int level = Math.min(5, Math.max(1, ((Number) pct).intValue() / 20 + 1));
                saveSkill(user, skill, level, SkillSource.GITHUB, sourceRefId);
            });
        });
    }

    @Transactional
    public void syncFromVerification(UUID userId, UUID skillId, UUID sourceRefId) {
        User user = userRepository.findById(userId).orElseThrow();
        Skill skill = skillRepository.findById(skillId).orElseThrow();
        saveSkill(user, skill, 4, SkillSource.VERIFIED, sourceRefId);
    }

    @Transactional
    public void updateSelfAssessment(UUID userId, List<SkillDtos.SelfAssessmentItem> items) {
        userSkillRepository.deleteByUserIdAndSource(userId, SkillSource.SELF);
        User user = userRepository.findById(userId).orElseThrow();
        for (SkillDtos.SelfAssessmentItem item : items) {
            Skill skill = skillRepository.findById(item.getSkillId())
                    .orElseThrow(() -> new ApiException("Skill not found", HttpStatus.NOT_FOUND));
            saveSkill(user, skill, item.getLevel(), SkillSource.SELF, null);
        }
    }

    @Transactional(readOnly = true)
    public List<SkillDtos.UserSkillResponse> getUserSkills(UUID userId) {
        Map<UUID, SkillDtos.UserSkillResponse> merged = new HashMap<>();
        for (UserSkill us : userSkillRepository.findByUserId(userId)) {
            UUID skillId = us.getSkill().getId();
            SkillDtos.UserSkillResponse existing = merged.get(skillId);
            if (existing == null || us.getLevel() > existing.getLevel()) {
                merged.put(skillId, SkillDtos.UserSkillResponse.builder()
                        .skillId(skillId)
                        .skillName(us.getSkill().getName())
                        .category(us.getSkill().getCategory().name())
                        .level(us.getLevel())
                        .confidence(us.getConfidence())
                        .source(us.getSource().name())
                        .build());
            }
        }
        return new ArrayList<>(merged.values());
    }

    private void saveSkill(User user, Skill skill, int level, SkillSource source, UUID sourceRefId) {
        BigDecimal confidence = BigDecimal.valueOf(source == SkillSource.VERIFIED ? 0.95 : 0.7);
        userSkillRepository.findByUserIdAndSkillIdAndSource(user.getId(), skill.getId(), source)
                .ifPresentOrElse(existing -> {
                    existing.setLevel(level);
                    existing.setConfidence(confidence);
                    existing.setSourceRefId(sourceRefId);
                    existing.setUpdatedAt(Instant.now());
                    userSkillRepository.save(existing);
                }, () -> userSkillRepository.save(UserSkill.builder()
                        .user(user)
                        .skill(skill)
                        .level(level)
                        .confidence(confidence)
                        .source(source)
                        .sourceRefId(sourceRefId)
                        .updatedAt(Instant.now())
                        .build()));
    }
}
