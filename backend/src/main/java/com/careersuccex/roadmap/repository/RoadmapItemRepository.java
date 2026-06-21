package com.careersuccex.roadmap.repository;

import com.careersuccex.roadmap.entity.RoadmapItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RoadmapItemRepository extends JpaRepository<RoadmapItem, UUID> {
    Optional<RoadmapItem> findByIdAndRoadmapUserId(UUID id, UUID userId);
}
