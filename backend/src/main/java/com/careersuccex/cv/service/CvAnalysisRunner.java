package com.careersuccex.cv.service;

import com.careersuccex.common.service.AnalysisJobService;
import com.careersuccex.common.util.JsonUtil;
import com.careersuccex.cv.entity.CvAnalysis;
import com.careersuccex.cv.entity.CvDocument;
import com.careersuccex.cv.repository.CvAnalysisRepository;
import com.careersuccex.cv.repository.CvDocumentRepository;
import com.careersuccex.integration.ai.AiDtos;
import com.careersuccex.integration.ai.AiServiceClient;
import com.careersuccex.readiness.service.ReadinessRecalculationService;
import com.careersuccex.skills.entity.TargetRole;
import com.careersuccex.skills.service.SkillAggregationService;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CvAnalysisRunner {

    private final CvAnalysisRepository analysisRepository;
    private final CvDocumentRepository documentRepository;
    private final PdfExtractService pdfExtractService;
    private final AiServiceClient aiServiceClient;
    private final JsonUtil jsonUtil;
    private final AnalysisJobService jobService;
    private final SkillAggregationService skillAggregationService;
    private final ReadinessRecalculationService readinessRecalculationService;

    @Transactional
    public void run(UUID jobId, UUID analysisId, CvDocument doc, TargetRole targetRole) {
        jobService.markRunning(jobId);
        try {
            CvDocument document = documentRepository.findById(doc.getId()).orElseThrow();
            UUID userId = document.getUser().getId();
            String cvText = extractText(document);
            String roleTitle = targetRole != null ? targetRole.getTitle() : "Software Engineering Intern";

            AiDtos.CvEnrichRequest enrichReq = new AiDtos.CvEnrichRequest();
            enrichReq.setCvText(cvText);
            enrichReq.setTargetRole(roleTitle);
            AiDtos.CvEnrichResponse enrich = aiServiceClient.enrichCv(enrichReq);

            List<String> keywords = extractKeywordsFromRole(targetRole);
            AiDtos.AtsKeywordRequest kwReq = new AiDtos.AtsKeywordRequest();
            kwReq.setCvText(cvText);
            kwReq.setRequiredKeywords(keywords);
            kwReq.setJobDescription(roleTitle);
            AiDtos.AtsKeywordResponse kw = aiServiceClient.matchAtsKeywords(kwReq);

            BigDecimal formatScore = scoreFormat(cvText);
            BigDecimal completeness = enrich.getCompletenessScore() != null
                    ? enrich.getCompletenessScore() : BigDecimal.valueOf(70);
            BigDecimal keywordScore = kw.getKeywordScore() != null ? kw.getKeywordScore() : BigDecimal.valueOf(50);
            BigDecimal atsScore = keywordScore.multiply(BigDecimal.valueOf(0.5))
                    .add(formatScore.multiply(BigDecimal.valueOf(0.2)))
                    .add(completeness.multiply(BigDecimal.valueOf(0.3)))
                    .setScale(2, RoundingMode.HALF_UP);

            CvAnalysis analysis = analysisRepository.findById(analysisId).orElseThrow();
            analysis.setAtsScore(atsScore);
            analysis.setKeywordScore(keywordScore);
            analysis.setFormatScore(formatScore);
            analysis.setCompletenessScore(completeness);
            analysis.setParsedJson(jsonUtil.toJson(enrich.getParsedData()));
            analysis.setKeywordReport(jsonUtil.toJson(Map.of(
                    "matched", kw.getMatched() != null ? kw.getMatched() : List.of(),
                    "missing", kw.getMissing() != null ? kw.getMissing() : List.of()
            )));
            analysis.setSuggestions(jsonUtil.toJson(enrich.getSuggestions()));
            analysis.setAnalyzedAt(Instant.now());
            analysisRepository.save(analysis);

            jobService.markCompleted(jobId, analysisId);
            try {
                skillAggregationService.syncFromCv(userId, enrich.getParsedData(), analysisId);
            } catch (Exception e) {
                log.warn("Skill sync failed after CV analysis for user {}", userId, e);
            }
            try {
                readinessRecalculationService.recalculate(userId);
            } catch (Exception e) {
                log.warn("Readiness recalculation failed after CV analysis for user {}", userId, e);
            }
        } catch (Exception e) {
            log.error("CV analysis failed for job {}", jobId, e);
            jobService.markFailed(jobId, e.getMessage() != null ? e.getMessage() : "CV analysis failed");
        }
    }

    private String extractText(CvDocument doc) throws IOException {
        if ("PDF".equals(doc.getFileType())) {
            try (var is = Files.newInputStream(Paths.get(doc.getFilePath()))) {
                return pdfExtractService.extractText(is);
            }
        }
        return Files.readString(Paths.get(doc.getFilePath()));
    }

    private BigDecimal scoreFormat(String text) {
        int score = 60;
        if (text.length() > 500) score += 10;
        if (text.toLowerCase().contains("education")) score += 10;
        if (text.toLowerCase().contains("experience") || text.toLowerCase().contains("project")) score += 10;
        if (text.matches(".*\\d+%.*") || text.matches(".*\\d+\\+.*")) score += 10;
        return BigDecimal.valueOf(Math.min(score, 100));
    }

    private List<String> extractKeywordsFromRole(TargetRole role) {
        if (role == null || role.getRequiredSkills() == null) {
            return List.of("Java", "Python", "Git", "SQL", "REST", "Agile");
        }
        try {
            var items = jsonUtil.fromJson(role.getRequiredSkills(), new TypeReference<List<Map<String, Object>>>() {});
            return items.stream()
                    .map(m -> String.valueOf(m.getOrDefault("skillName", "")))
                    .filter(s -> !s.isBlank())
                    .toList();
        } catch (Exception e) {
            return List.of("Java", "Git", "SQL");
        }
    }
}
