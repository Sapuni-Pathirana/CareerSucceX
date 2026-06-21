package com.careersuccex.roadmap.entity;

import com.careersuccex.auth.entity.User;
import com.careersuccex.common.enums.RoadmapStatus;
import com.careersuccex.skills.entity.TargetRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "learning_roadmaps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningRoadmap {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_role_id", nullable = false)
    private TargetRole targetRole;

    @Column(length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private RoadmapStatus status = RoadmapStatus.ACTIVE;

    @Column(nullable = false)
    @Builder.Default
    private Instant generatedAt = Instant.now();

    @OneToMany(mappedBy = "roadmap", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RoadmapItem> items = new ArrayList<>();
}
