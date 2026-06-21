package com.careersuccex.interview.service;

import com.careersuccex.auth.repository.UserRepository;
import com.careersuccex.common.enums.Difficulty;
import com.careersuccex.common.enums.InterviewType;
import com.careersuccex.common.enums.SessionStatus;
import com.careersuccex.common.exception.ApiException;
import com.careersuccex.common.util.JsonUtil;
import com.careersuccex.integration.ai.AiDtos;
import com.careersuccex.integration.ai.AiServiceClient;
import com.careersuccex.interview.dto.InterviewDtos;
import com.careersuccex.interview.entity.*;
import com.careersuccex.interview.repository.InterviewQuestionRepository;
import com.careersuccex.interview.repository.MockInterviewSessionRepository;
import com.careersuccex.profile.repository.UserProfileRepository;
import com.careersuccex.readiness.service.ReadinessRecalculationService;
import com.careersuccex.skills.entity.TargetRole;
import com.careersuccex.skills.repository.TargetRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class InterviewService {

    private final MockInterviewSessionRepository sessionRepository;
    private final InterviewQuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final TargetRoleRepository targetRoleRepository;
    private final UserProfileRepository profileRepository;
    private final AiServiceClient aiServiceClient;
    private final JsonUtil jsonUtil;
    private final ReadinessRecalculationService readinessRecalculationService;

    @Transactional
    public InterviewDtos.SessionResponse startSession(UUID userId, InterviewDtos.StartSessionRequest request) {
        TargetRole role = targetRoleRepository.findById(request.getTargetRoleId())
                .orElseThrow(() -> new ApiException("Target role not found", HttpStatus.NOT_FOUND));
        var user = userRepository.findById(userId).orElseThrow();

        MockInterviewSession session = MockInterviewSession.builder()
                .user(user)
                .targetRole(role)
                .interviewType(InterviewType.valueOf(request.getType()))
                .difficulty(Difficulty.valueOf(request.getDifficulty()))
                .status(SessionStatus.IN_PROGRESS)
                .build();

        String profileSummary = profileRepository.findByUserId(userId)
                .map(p -> p.getFullName() + " - " + p.getUniversity())
                .orElse("Student");

        AiDtos.GenerateQuestionsRequest genReq = new AiDtos.GenerateQuestionsRequest();
        genReq.setTargetRole(role.getTitle());
        genReq.setInterviewType(request.getType());
        genReq.setDifficulty(request.getDifficulty());
        genReq.setProfileSummary(profileSummary);
        genReq.setCount(5);
        AiDtos.GenerateQuestionsResponse genResp = aiServiceClient.generateQuestions(genReq);

        int order = 1;
        for (AiDtos.QuestionItem q : genResp.getQuestions()) {
            InterviewQuestion question = InterviewQuestion.builder()
                    .session(session)
                    .questionOrder(order++)
                    .questionText(q.getText())
                    .questionType(q.getType())
                    .build();
            session.getQuestions().add(question);
        }
        session = sessionRepository.save(session);
        return toResponse(session);
    }

    @Transactional(readOnly = true)
    public InterviewDtos.SessionResponse getSession(UUID userId, UUID sessionId) {
        MockInterviewSession session = sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ApiException("Session not found", HttpStatus.NOT_FOUND));
        return toResponse(session);
    }

    @Transactional
    public InterviewDtos.SessionResponse submitAnswer(UUID userId, UUID sessionId, InterviewDtos.SubmitAnswerRequest request) {
        MockInterviewSession session = sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ApiException("Session not found", HttpStatus.NOT_FOUND));
        InterviewQuestion question = questionRepository.findByIdAndSessionUserId(request.getQuestionId(), userId)
                .orElseThrow(() -> new ApiException("Question not found", HttpStatus.NOT_FOUND));

        AiDtos.EvaluateAnswerRequest evalReq = new AiDtos.EvaluateAnswerRequest();
        evalReq.setQuestion(question.getQuestionText());
        evalReq.setAnswer(request.getAnswerText());
        evalReq.setTargetRole(session.getTargetRole().getTitle());
        evalReq.setQuestionType(question.getQuestionType());
        AiDtos.EvaluateAnswerResponse eval = aiServiceClient.evaluateAnswer(evalReq);

        InterviewAnswer answer = question.getAnswer();
        if (answer == null) {
            answer = InterviewAnswer.builder().question(question).build();
            question.setAnswer(answer);
        }
        answer.setAnswerText(request.getAnswerText());
        answer.setScore(eval.getScore());
        answer.setFeedback(jsonUtil.toJson(eval.getFeedback()));
        answer.setAnsweredAt(Instant.now());
        sessionRepository.save(session);
        return toResponse(session);
    }

    @Transactional
    public InterviewDtos.SessionResponse completeSession(UUID userId, UUID sessionId) {
        MockInterviewSession session = sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ApiException("Session not found", HttpStatus.NOT_FOUND));

        List<Map<String, Object>> qaPairs = new ArrayList<>();
        for (InterviewQuestion q : session.getQuestions()) {
            Map<String, Object> pair = new HashMap<>();
            pair.put("question", q.getQuestionText());
            pair.put("answer", q.getAnswer() != null ? q.getAnswer().getAnswerText() : "");
            pair.put("score", q.getAnswer() != null ? q.getAnswer().getScore() : 0);
            qaPairs.add(pair);
        }

        AiDtos.SummarizeInterviewRequest sumReq = new AiDtos.SummarizeInterviewRequest();
        sumReq.setQaPairs(qaPairs);
        sumReq.setTargetRole(session.getTargetRole().getTitle());
        AiDtos.SummarizeInterviewResponse summary = aiServiceClient.summarizeInterview(sumReq);

        session.setStatus(SessionStatus.COMPLETED);
        session.setOverallScore(summary.getOverallScore());
        session.setSummaryFeedback(summary.getSummary());
        session.setCompletedAt(Instant.now());
        sessionRepository.save(session);
        try {
            readinessRecalculationService.recalculate(userId);
        } catch (Exception ignored) {
            // readiness update is best-effort after interview completion
        }
        return toResponse(session);
    }

    @Transactional(readOnly = true)
    public List<InterviewDtos.SessionResponse> listSessions(UUID userId) {
        return sessionRepository.findByUserIdOrderByStartedAtDesc(userId).stream()
                .map(this::toResponse).toList();
    }

    private InterviewDtos.SessionResponse toResponse(MockInterviewSession session) {
        List<InterviewDtos.QuestionResponse> questions = session.getQuestions().stream()
                .sorted(Comparator.comparing(InterviewQuestion::getQuestionOrder))
                .map(q -> {
                    InterviewDtos.AnswerResponse answer = null;
                    if (q.getAnswer() != null) {
                        Map<String, Object> feedback = Map.of();
                        try {
                            if (q.getAnswer().getFeedback() != null) {
                                feedback = jsonUtil.fromJson(q.getAnswer().getFeedback(), Map.class);
                            }
                        } catch (Exception ignored) {}
                        answer = InterviewDtos.AnswerResponse.builder()
                                .answerText(q.getAnswer().getAnswerText())
                                .score(q.getAnswer().getScore())
                                .feedback(feedback)
                                .build();
                    }
                    return InterviewDtos.QuestionResponse.builder()
                            .id(q.getId())
                            .questionOrder(q.getQuestionOrder())
                            .questionText(q.getQuestionText())
                            .questionType(q.getQuestionType())
                            .answer(answer)
                            .build();
                }).toList();

        return InterviewDtos.SessionResponse.builder()
                .id(session.getId())
                .status(session.getStatus().name())
                .interviewType(session.getInterviewType().name())
                .difficulty(session.getDifficulty().name())
                .overallScore(session.getOverallScore())
                .summaryFeedback(session.getSummaryFeedback())
                .questions(questions)
                .startedAt(session.getStartedAt())
                .completedAt(session.getCompletedAt())
                .build();
    }
}
