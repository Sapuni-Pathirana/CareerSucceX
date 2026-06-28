package com.careersuccex.cv.service;

import com.careersuccex.common.service.AnalysisJobService;
import com.careersuccex.common.service.RoleContextBuilder;
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
import com.careersuccex.skills.service.SkillGapService;
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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private final RoleContextBuilder roleContextBuilder;
    private final SkillGapService skillGapService;

    @Transactional
    public void run(UUID jobId, UUID analysisId, CvDocument doc, TargetRole targetRole, boolean includeJustifications) {
        jobService.markRunning(jobId);
        try {
            CvDocument document = documentRepository.findById(doc.getId()).orElseThrow();
            UUID userId = document.getUser().getId();
            String cvText = extractText(document);
            AiDtos.RoleContext roleContext = roleContextBuilder.toRoleContext(targetRole);
            String roleTitle = roleContext.getTitle();

            AiDtos.CvEnrichRequest enrichReq = new AiDtos.CvEnrichRequest();
            enrichReq.setCvText(cvText);
            enrichReq.setTargetRole(roleTitle);
            enrichReq.setRoleContext(roleContext);
            enrichReq.setIncludeJustifications(includeJustifications);
            AiDtos.CvEnrichResponse enrich = aiServiceClient.enrichCv(enrichReq);
            assertAiCvResult(enrich);

            BigDecimal formatScore = scoreFormat(cvText);
            BigDecimal completeness = enrich.getCompletenessScore() != null
                    ? enrich.getCompletenessScore() : BigDecimal.valueOf(70);
            BigDecimal keywordScore = enrich.getKeywordScore() != null
                    ? enrich.getKeywordScore() : BigDecimal.valueOf(50);
            assertAiAtsResult(enrich, keywordScore);
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
            Map<String, Object> keywordReport = new LinkedHashMap<>();
            keywordReport.put("matched", enrich.getMatched() != null ? enrich.getMatched() : List.of());
            keywordReport.put("missing", enrich.getMissing() != null ? enrich.getMissing() : List.of());
            if (enrich.getRoleFitScore() != null) {
                keywordReport.put("roleFitScore", enrich.getRoleFitScore());
            }
            if (enrich.getRoleFitSummary() != null && !enrich.getRoleFitSummary().isBlank()) {
                keywordReport.put("roleFitSummary", enrich.getRoleFitSummary());
            }

            List<Map<String, Object>> storedRecommendations = mergeDetailedRecommendations(enrich);
            List<String> summaryTips = enrich.getSummaryTips() != null && !enrich.getSummaryTips().isEmpty()
                    ? enrich.getSummaryTips()
                    : List.of();
            String summaryText = enrich.getSummaryText() != null && !enrich.getSummaryText().isBlank()
                    ? enrich.getSummaryText()
                    : String.join(" ", summaryTips);
            if (summaryText.isBlank() && !storedRecommendations.isEmpty()) {
                summaryText = storedRecommendations.stream()
                        .map(m -> String.valueOf(m.get("text")))
                        .filter(t -> t != null && !t.isBlank())
                        .limit(3)
                        .reduce((a, b) -> a + " " + b)
                        .orElse("");
            }

            String reportSummary = enrich.getReportSummary() != null && !enrich.getReportSummary().isBlank()
                    ? enrich.getReportSummary()
                    : summaryText;

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("summaryText", summaryText);
            payload.put("reportSummary", reportSummary);
            payload.put("summaryTips", summaryTips);
            payload.put("recommendations", storedRecommendations);
            analysis.setKeywordReport(jsonUtil.toJson(keywordReport));
            analysis.setSuggestions(jsonUtil.toJson(payload));
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
            if (targetRole != null) {
                try {
                    skillGapService.recalculate(userId, targetRole.getId());
                } catch (Exception e) {
                    log.warn("Skill gap recalculation failed after CV analysis for user {}", userId, e);
                }
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

    private void assertAiCvResult(AiDtos.CvEnrichResponse enrich) {
        if (enrich.getRoleFitSummary() != null && enrich.getRoleFitSummary().contains("Rule-based")) {
            throw new IllegalStateException("CV analysis must use Grok AI — rule-based results are not allowed");
        }
        if (enrich.getSuggestions() != null) {
            for (String suggestion : enrich.getSuggestions()) {
                if (suggestion != null && suggestion.toLowerCase().contains("ai service unavailable")) {
                    throw new IllegalStateException("CV analysis must use Grok AI — fallback results are not allowed");
                }
            }
        }
        if (enrich.getRecommendations() == null && (enrich.getSuggestions() == null || enrich.getSuggestions().isEmpty())) {
            throw new IllegalStateException("CV analysis returned no AI recommendations");
        }
    }

    private void assertAiAtsResult(AiDtos.CvEnrichResponse enrich, BigDecimal keywordScore) {
        if (keywordScore == null) {
            throw new IllegalStateException("ATS keyword analysis must return an AI-generated score");
        }
    }

    private List<Map<String, Object>> mergeDetailedRecommendations(AiDtos.CvEnrichResponse enrich) {
        List<Map<String, Object>> items = new ArrayList<>();

        if (enrich.getRecommendations() != null) {
            for (AiDtos.RecommendationItem rec : enrich.getRecommendations()) {
                addIfDistinct(items, toMap(rec));
            }
        } else if (enrich.getSuggestions() != null) {
            for (String text : enrich.getSuggestions()) {
                if (text == null || text.isBlank()) continue;
                addIfDistinct(items, Map.of("text", text, "priority", "medium"));
            }
        }

        if (enrich.getKeywordNotes() != null) {
            for (AiDtos.RecommendationItem note : enrich.getKeywordNotes()) {
                addIfDistinct(items, toMap(note));
            }
        }
        return items.size() > 8 ? items.subList(0, 8) : items;
    }

    private void addIfDistinct(List<Map<String, Object>> items, Map<String, Object> candidate) {
        String text = candidate.get("text") != null ? String.valueOf(candidate.get("text")) : "";
        if (text.isBlank()) return;
        for (Map<String, Object> existing : items) {
            String existingText = existing.get("text") != null ? String.valueOf(existing.get("text")) : "";
            if (isSimilarText(text, existingText)) {
                return;
            }
        }
        items.add(candidate);
    }

    private boolean isSimilarText(String a, String b) {
        String left = a.toLowerCase().replaceAll("[^a-z0-9\\s]", " ").trim();
        String right = b.toLowerCase().replaceAll("[^a-z0-9\\s]", " ").trim();
        if (left.isBlank() || right.isBlank()) return false;
        if (left.equals(right) || left.contains(right) || right.contains(left)) return true;
        Set<String> leftWords = new HashSet<>(Arrays.asList(left.split("\\s+")));
        Set<String> rightWords = new HashSet<>(Arrays.asList(right.split("\\s+")));
        leftWords.retainAll(rightWords);
        int minWords = Math.min(left.split("\\s+").length, right.split("\\s+").length);
        return minWords > 0 && leftWords.size() >= minWords * 0.55;
    }

    private Map<String, Object> toMap(AiDtos.RecommendationItem rec) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("text", rec.getText());
        map.put("priority", rec.getPriority() != null ? rec.getPriority() : "medium");
        if (rec.getJustification() != null && !rec.getJustification().isBlank()) {
            map.put("justification", rec.getJustification());
        }
        if (rec.getEvidence() != null && !rec.getEvidence().isBlank()) {
            map.put("evidence", rec.getEvidence());
        }
        return map;
    }
}
