package com.careersuccex.profile.repository;

import com.careersuccex.profile.entity.UserProfile;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
    @EntityGraph(attributePaths = "targetRole")
    Optional<UserProfile> findByUserId(UUID userId);
}
