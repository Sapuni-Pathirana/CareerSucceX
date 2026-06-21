package com.careersuccex.github.repository;

import com.careersuccex.github.entity.GitHubAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GitHubAnalysisRepository extends JpaRepository<GitHubAnalysis, UUID> {
    Optional<GitHubAnalysis> findFirstByConnectionUserIdOrderByAnalyzedAtDesc(UUID userId);
}
