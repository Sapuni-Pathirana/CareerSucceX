package com.careersuccex.interview.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "interview_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private MockInterviewSession session;

    @Column(nullable = false)
    private Integer questionOrder;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(length = 20)
    private String questionType;

    @OneToOne(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private InterviewAnswer answer;
}
