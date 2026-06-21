package com.careersuccex.cv.entity;

import com.careersuccex.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "cv_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CvDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String filePath;

    @Column(nullable = false, length = 10)
    private String fileType;

    private Integer fileSizeBytes;

    @Column(nullable = false)
    @Builder.Default
    private Instant uploadedAt = Instant.now();

    @Builder.Default
    private Boolean isActive = true;
}
