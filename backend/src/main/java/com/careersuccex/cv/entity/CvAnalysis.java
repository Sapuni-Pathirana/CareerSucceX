package com.careersuccex.cv.entity;

import com.careersuccex.skills.entity.TargetRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "cv_analyses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CvAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cv_document_id", nullable = false)
    private CvDocument cvDocument;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_role_id")
    private TargetRole targetRole;

    @Column(precision = 5, scale = 2)
    private BigDecimal atsScore;

    @Column(precision = 5, scale = 2)
    private BigDecimal keywordScore;

    @Column(precision = 5, scale = 2)
    private BigDecimal formatScore;

    @Column(precision = 5, scale = 2)
    private BigDecimal completenessScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String parsedJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String keywordReport;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String suggestions;

    @Column(nullable = false)
    @Builder.Default
    private Instant analyzedAt = Instant.now();

    @PrePersist
    void onCreate() {
        if (analyzedAt == null) {
            analyzedAt = Instant.now();
        }
    }
}
