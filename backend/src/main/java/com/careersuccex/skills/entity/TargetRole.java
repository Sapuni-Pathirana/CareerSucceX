package com.careersuccex.skills.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "target_roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TargetRole {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 100)
    private String industry;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String requiredSkills;

    @Column(columnDefinition = "TEXT")
    private String description;
}
