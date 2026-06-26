package com.careersuccex.verification.service;

import com.careersuccex.auth.repository.UserRepository;
import com.careersuccex.common.exception.ApiException;
import com.careersuccex.common.util.JsonUtil;
import com.careersuccex.integration.ai.AiDtos;
import com.careersuccex.integration.ai.AiServiceClient;
import com.careersuccex.readiness.service.ReadinessRecalculationService;
import com.careersuccex.skills.entity.Skill;
import com.careersuccex.skills.repository.SkillRepository;
import com.careersuccex.skills.service.SkillAggregationService;
import com.careersuccex.skills.service.SkillGapService;
import com.careersuccex.verification.dto.VerificationDtos;
import com.careersuccex.verification.entity.SkillVerification;
import com.careersuccex.verification.repository.SkillVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class VerificationService {

    private final SkillVerificationRepository verificationRepository;
    private final SkillRepository skillRepository;
    private final UserRepository userRepository;
    private final AiServiceClient aiServiceClient;
    private final JsonUtil jsonUtil;
    private final SkillAggregationService skillAggregationService;
    private final ReadinessRecalculationService readinessRecalculationService;

    private final Map<UUID, List<AiDtos.QuizQuestion>> pendingQuizzes = new ConcurrentHashMap<>();

    @Transactional
    public VerificationDtos.StartResponse start(UUID userId, VerificationDtos.StartRequest request) {
        Skill skill = skillRepository.findById(request.getSkillId())
                .orElseThrow(() -> new ApiException("Skill not found", HttpStatus.NOT_FOUND));
        var user = userRepository.findById(userId).orElseThrow();

        AiDtos.GenerateQuizRequest genReq = new AiDtos.GenerateQuizRequest();
        genReq.setSkillName(skill.getName());
        genReq.setQuestionCount(5);
        AiDtos.GenerateQuizResponse genResp = aiServiceClient.generateQuiz(genReq);

        long attempt = verificationRepository.countByUserIdAndSkillId(userId, skill.getId()) + 1;
        SkillVerification verification = SkillVerification.builder()
                .user(user)
                .skill(skill)
                .attemptNumber((int) attempt)
                .answersJson(jsonUtil.toJson(genResp.getQuestions()))
                .build();
        verification = verificationRepository.save(verification);
        pendingQuizzes.put(verification.getId(), genResp.getQuestions());

        List<VerificationDtos.QuestionDto> questions = genResp.getQuestions().stream()
                .map(q -> VerificationDtos.QuestionDto.builder()
                        .id(q.getId())
                        .type(q.getType())
                        .question(q.getQuestion())
                        .options(q.getOptions())
                        .build())
                .toList();

        return VerificationDtos.StartResponse.builder()
                .verificationId(verification.getId())
                .questions(questions)
                .build();
    }

    @Transactional
    public VerificationDtos.SubmitResponse submit(UUID userId, UUID verificationId, VerificationDtos.SubmitRequest request) {
        SkillVerification verification = verificationRepository.findByIdAndUserId(verificationId, userId)
                .orElseThrow(() -> new ApiException("Verification not found", HttpStatus.NOT_FOUND));

        List<AiDtos.QuizQuestion> questions = pendingQuizzes.getOrDefault(verificationId, List.of());
        if (questions.isEmpty() && verification.getAnswersJson() != null) {
            try {
                questions = jsonUtil.fromJson(verification.getAnswersJson(), List.class);
            } catch (Exception ignored) {}
        }

        AiDtos.GradeQuizRequest gradeReq = new AiDtos.GradeQuizRequest();
        gradeReq.setSkillName(verification.getSkill().getName());
        gradeReq.setQuestions(questions.stream().map(q -> Map.<String, Object>of(
                "id", q.getId(), "type", q.getType(), "question", q.getQuestion(), "options", q.getOptions()
        )).toList());
        gradeReq.setAnswers(request.getAnswers());
        AiDtos.GradeQuizResponse grade = aiServiceClient.gradeQuiz(gradeReq);

        verification.setScore(grade.getScore());
        verification.setPassed(grade.isPassed());
        verification.setVerifiedAt(java.time.Instant.now());
        verification.setAnswersJson(jsonUtil.toJson(Map.of("answers", request.getAnswers(), "feedback", grade.getFeedback())));
        verificationRepository.save(verification);
        pendingQuizzes.remove(verificationId);

        if (grade.isPassed()) {
            skillAggregationService.syncFromVerification(userId, verification.getSkill().getId(), verificationId);
            readinessRecalculationService.recalculate(userId);
        }

        return VerificationDtos.SubmitResponse.builder()
                .score(grade.getScore())
                .passed(grade.isPassed())
                .feedback(grade.getFeedback())
                .build();
    }

    @Transactional(readOnly = true)
    public List<VerificationDtos.HistoryItem> history(UUID userId) {
        return verificationRepository.findByUserIdOrderByVerifiedAtDesc(userId).stream()
                .map(v -> VerificationDtos.HistoryItem.builder()
                        .id(v.getId())
                        .skillName(v.getSkill().getName())
                        .score(v.getScore())
                        .passed(Boolean.TRUE.equals(v.getPassed()))
                        .verifiedAt(v.getVerifiedAt())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VerificationDtos.Badge> badges(UUID userId) {
        return verificationRepository.findByUserIdAndPassedTrue(userId).stream()
                .map(v -> VerificationDtos.Badge.builder()
                        .skillId(v.getSkill().getId())
                        .skillName(v.getSkill().getName())
                        .verifiedAt(v.getVerifiedAt())
                        .build())
                .toList();
    }
}
