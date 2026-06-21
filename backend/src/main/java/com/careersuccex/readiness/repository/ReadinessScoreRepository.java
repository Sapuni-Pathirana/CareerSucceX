package com.careersuccex.readiness.repository;

import com.careersuccex.readiness.entity.ReadinessScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReadinessScoreRepository extends JpaRepository<ReadinessScore, UUID> {
    Optional<ReadinessScore> findFirstByUserIdOrderByCalculatedAtDesc(UUID userId);
    List<ReadinessScore> findByUserIdOrderByCalculatedAtDesc(UUID userId);
}
