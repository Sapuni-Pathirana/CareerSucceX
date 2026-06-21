package com.careersuccex.profile.entity;

import com.careersuccex.auth.entity.User;
import com.careersuccex.skills.entity.TargetRole;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 150)
    private String fullName;

    @Column(length = 200)
    private String university;

    @Column(length = 100)
    private String degree;

    private Integer graduationYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_role_id")
    private TargetRole targetRole;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 500)
    private String avatarUrl;
}
