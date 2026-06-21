package com.careersuccex.skills.repository;

import com.careersuccex.common.enums.SkillCategory;
import com.careersuccex.skills.entity.Skill;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SkillRepository extends JpaRepository<Skill, UUID> {
    Optional<Skill> findByNameIgnoreCase(String name);
    Page<Skill> findByCategory(SkillCategory category, Pageable pageable);
}
