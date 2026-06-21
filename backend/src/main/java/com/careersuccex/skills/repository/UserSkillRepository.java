package com.careersuccex.skills.repository;

import com.careersuccex.common.enums.SkillSource;
import com.careersuccex.skills.entity.UserSkill;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserSkillRepository extends JpaRepository<UserSkill, UUID> {
    @EntityGraph(attributePaths = "skill")
    List<UserSkill> findByUserId(UUID userId);

    @EntityGraph(attributePaths = "skill")
    List<UserSkill> findByUserIdAndSource(UUID userId, SkillSource source);

    Optional<UserSkill> findByUserIdAndSkillIdAndSource(UUID userId, UUID skillId, SkillSource source);
    void deleteByUserIdAndSource(UUID userId, SkillSource source);
}
