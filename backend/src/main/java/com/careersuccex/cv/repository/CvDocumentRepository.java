package com.careersuccex.cv.repository;

import com.careersuccex.cv.entity.CvDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CvDocumentRepository extends JpaRepository<CvDocument, UUID> {
    List<CvDocument> findByUserIdAndIsActiveTrueOrderByUploadedAtDesc(UUID userId);
    long countByUserIdAndUploadedAtAfter(UUID userId, java.time.Instant after);
}
