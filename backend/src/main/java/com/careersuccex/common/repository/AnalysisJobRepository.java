package com.careersuccex.common.repository;

import com.careersuccex.common.entity.AnalysisJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AnalysisJobRepository extends JpaRepository<AnalysisJob, UUID> {
    Optional<AnalysisJob> findByIdAndUserId(UUID id, UUID userId);
}
