package com.careersuccex.readiness.entity;

import com.careersuccex.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "readiness_scores", indexes = {
        @Index(name = "idx_readiness_user_calculated", columnList = "user_id, calculated_at DESC")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadinessScore {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(precision = 5, scale = 2)
    private BigDecimal overallScore;

    @Column(precision = 5, scale = 2)
    private BigDecimal cvScore;

    @Column(precision = 5, scale = 2)
    private BigDecimal githubScore;

    @Column(precision = 5, scale = 2)
    private BigDecimal skillsScore;

    @Column(precision = 5, scale = 2)
    private BigDecimal interviewScore;

    @Column(precision = 5, scale = 2)
    private BigDecimal verificationScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String breakdownJson;

    @Column(nullable = false)
    @Builder.Default
    private Instant calculatedAt = Instant.now();
}
