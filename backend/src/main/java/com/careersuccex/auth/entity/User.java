package com.careersuccex.auth.entity;

import com.careersuccex.common.entity.BaseEntity;
import com.careersuccex.common.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserRole role = UserRole.STUDENT;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column
    private String refreshTokenHash;
}
