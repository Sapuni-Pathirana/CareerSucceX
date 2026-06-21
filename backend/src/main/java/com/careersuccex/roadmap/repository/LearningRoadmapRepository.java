package com.careersuccex.roadmap.repository;

import com.careersuccex.common.enums.RoadmapStatus;
import com.careersuccex.roadmap.entity.LearningRoadmap;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LearningRoadmapRepository extends JpaRepository<LearningRoadmap, UUID> {
    Optional<LearningRoadmap> findByUserIdAndStatus(UUID userId, RoadmapStatus status);
    List<LearningRoadmap> findByUserIdOrderByGeneratedAtDesc(UUID userId);
}
