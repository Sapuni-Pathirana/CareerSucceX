package com.careersuccex.cv.repository;

import com.careersuccex.cv.entity.CvAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CvAnalysisRepository extends JpaRepository<CvAnalysis, UUID> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "cvDocument")
    List<CvAnalysis> findByCvDocumentUserIdOrderByAnalyzedAtDesc(UUID userId);

    List<CvAnalysis> findByCvDocumentIdOrderByAnalyzedAtDesc(UUID documentId);

    @Query("SELECT a FROM CvAnalysis a JOIN FETCH a.cvDocument d JOIN FETCH d.user u WHERE a.id = :id AND u.id = :userId")
    Optional<CvAnalysis> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);
}
