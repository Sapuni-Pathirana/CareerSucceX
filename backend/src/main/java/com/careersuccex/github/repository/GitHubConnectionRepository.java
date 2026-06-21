package com.careersuccex.github.repository;

import com.careersuccex.github.entity.GitHubConnection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GitHubConnectionRepository extends JpaRepository<GitHubConnection, UUID> {
    Optional<GitHubConnection> findByUserId(UUID userId);
}
