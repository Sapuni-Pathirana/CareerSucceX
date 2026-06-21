package com.careersuccex.skills.entity;

import com.careersuccex.auth.entity.User;
import com.careersuccex.common.enums.GapPriority;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "skill_gaps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillGap {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_role_id", nullable = false)
    private TargetRole targetRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GapPriority priority;

    private Integer currentLevel;

    private Integer requiredLevel;

    @Column(nullable = false)
    @Builder.Default
    private Instant detectedAt = Instant.now();
}
