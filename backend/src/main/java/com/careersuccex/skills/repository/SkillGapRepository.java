package com.careersuccex.skills.repository;

import com.careersuccex.skills.entity.SkillGap;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SkillGapRepository extends JpaRepository<SkillGap, UUID> {
    @EntityGraph(attributePaths = "skill")
    List<SkillGap> findByUserIdAndTargetRoleId(UUID userId, UUID targetRoleId);
    void deleteByUserIdAndTargetRoleId(UUID userId, UUID targetRoleId);
}
