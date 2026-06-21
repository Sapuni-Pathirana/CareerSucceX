package com.careersuccex.github.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "github_analyses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GitHubAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "connection_id", nullable = false)
    private GitHubConnection connection;

    @Column(precision = 5, scale = 2)
    private BigDecimal overallScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String languageStats;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String repoStats;

    @Column(precision = 5, scale = 2)
    private BigDecimal activityScore;

    @Column(precision = 5, scale = 2)
    private BigDecimal readmeScore;

    @Column(precision = 5, scale = 2)
    private BigDecimal diversityScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String recommendations;

    @Column(nullable = false)
    @Builder.Default
    private Instant analyzedAt = Instant.now();
}
