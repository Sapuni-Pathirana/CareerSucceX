package com.careersuccex.interview.repository;

import com.careersuccex.common.enums.SessionStatus;
import com.careersuccex.interview.entity.MockInterviewSession;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MockInterviewSessionRepository extends JpaRepository<MockInterviewSession, UUID> {
    @EntityGraph(attributePaths = {"questions", "questions.answer"})
    List<MockInterviewSession> findByUserIdOrderByStartedAtDesc(UUID userId);

    List<MockInterviewSession> findByUserIdAndStatusOrderByCompletedAtDesc(UUID userId, SessionStatus status);

    @EntityGraph(attributePaths = {"questions", "questions.answer"})
    Optional<MockInterviewSession> findByIdAndUserId(UUID id, UUID userId);
}
