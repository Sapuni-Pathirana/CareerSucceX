package com.careersuccex.interview.entity;

import com.careersuccex.auth.entity.User;
import com.careersuccex.common.enums.Difficulty;
import com.careersuccex.common.enums.InterviewType;
import com.careersuccex.common.enums.SessionStatus;
import com.careersuccex.skills.entity.TargetRole;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "mock_interview_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MockInterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_role_id", nullable = false)
    private TargetRole targetRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InterviewType interviewType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Difficulty difficulty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SessionStatus status = SessionStatus.IN_PROGRESS;

    @Column(precision = 5, scale = 2)
    private BigDecimal overallScore;

    @Column(columnDefinition = "TEXT")
    private String summaryFeedback;

    @Column(nullable = false)
    @Builder.Default
    private Instant startedAt = Instant.now();

    private Instant completedAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InterviewQuestion> questions = new ArrayList<>();
}
