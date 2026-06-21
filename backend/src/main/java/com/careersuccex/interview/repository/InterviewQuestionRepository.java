package com.careersuccex.interview.repository;

import com.careersuccex.interview.entity.InterviewQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, UUID> {
    Optional<InterviewQuestion> findByIdAndSessionUserId(UUID id, UUID userId);
}
