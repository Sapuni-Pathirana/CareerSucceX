package com.careersuccex.github.entity;

import com.careersuccex.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "github_connections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GitHubConnection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private Long githubUserId;

    @Column(length = 100)
    private String githubUsername;

    @Column(columnDefinition = "TEXT")
    private String accessTokenEnc;

    @Column(nullable = false)
    @Builder.Default
    private Instant connectedAt = Instant.now();

    private Instant lastSyncedAt;
}
