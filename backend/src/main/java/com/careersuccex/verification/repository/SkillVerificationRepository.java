package com.careersuccex.verification.repository;

import com.careersuccex.verification.entity.SkillVerification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SkillVerificationRepository extends JpaRepository<SkillVerification, UUID> {
    @EntityGraph(attributePaths = "skill")
    List<SkillVerification> findByUserIdOrderByVerifiedAtDesc(UUID userId);

    @EntityGraph(attributePaths = "skill")
    List<SkillVerification> findByUserIdAndPassedTrue(UUID userId);

    @EntityGraph(attributePaths = {"skill", "user"})
    Optional<SkillVerification> findByIdAndUserId(UUID id, UUID userId);

    long countByUserIdAndSkillId(UUID userId, UUID skillId);
}
