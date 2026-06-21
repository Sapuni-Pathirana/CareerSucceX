package com.careersuccex.skills.entity;

import com.careersuccex.auth.entity.User;
import com.careersuccex.common.enums.SkillSource;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_skills", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "skill_id", "source"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    private Integer level;

    @Column(precision = 3, scale = 2)
    private BigDecimal confidence;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SkillSource source;

    private UUID sourceRefId;

    @Column(nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
