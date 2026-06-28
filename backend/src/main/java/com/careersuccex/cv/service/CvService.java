package com.careersuccex.cv.service;

import com.careersuccex.auth.entity.User;
import com.careersuccex.auth.repository.UserRepository;
import com.careersuccex.common.enums.JobType;
import com.careersuccex.common.exception.ApiException;
import com.careersuccex.common.service.AnalysisAsyncExecutor;
import com.careersuccex.common.service.AnalysisJobService;
import com.careersuccex.common.service.RateLimitService;
import com.careersuccex.common.service.RoleContextBuilder;
import com.careersuccex.common.util.JsonUtil;
import com.careersuccex.cv.dto.CvDtos;
import com.careersuccex.cv.entity.CvAnalysis;
import com.careersuccex.cv.entity.CvDocument;
import com.careersuccex.cv.repository.CvAnalysisRepository;
import com.careersuccex.cv.repository.CvDocumentRepository;
import com.careersuccex.skills.entity.TargetRole;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CvService {

    private final CvDocumentRepository documentRepository;
    private final CvAnalysisRepository analysisRepository;
    private final UserRepository userRepository;
    private final JsonUtil jsonUtil;
    private final AnalysisJobService jobService;
    private final RateLimitService rateLimitService;
    private final AnalysisAsyncExecutor analysisAsyncExecutor;
    private final RoleContextBuilder roleContextBuilder;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @Transactional
    public CvDtos.CvDocumentResponse upload(UUID userId, MultipartFile file) {
        if (!rateLimitService.allowCvUpload(userId)) {
            throw new ApiException("Daily CV upload limit reached", HttpStatus.TOO_MANY_REQUESTS);
        }
        String contentType = file.getContentType();
        String fileType = contentType != null && contentType.contains("pdf") ? "PDF" : "DOCX";
        if (!List.of("PDF", "DOCX").contains(fileType)) {
            throw new ApiException("Only PDF and DOCX files are supported", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        try {
            Path dir = Paths.get(uploadDir, userId.toString());
            Files.createDirectories(dir);
            String fileName = UUID.randomUUID() + "_" + Objects.requireNonNull(file.getOriginalFilename());
            Path filePath = dir.resolve(fileName);
            Files.write(filePath, file.getBytes());

            CvDocument doc = CvDocument.builder()
                    .user(user)
                    .fileName(file.getOriginalFilename())
                    .filePath(filePath.toString())
                    .fileType(fileType)
                    .fileSizeBytes((int) file.getSize())
                    .build();
            doc = documentRepository.save(doc);
            return toDocumentResponse(doc);
        } catch (IOException e) {
            throw new ApiException("Failed to store file", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public List<CvDtos.CvDocumentResponse> listDocuments(UUID userId) {
        return documentRepository.findByUserIdAndIsActiveTrueOrderByUploadedAtDesc(userId)
                .stream().map(this::toDocumentResponse).toList();
    }

    @Transactional
    public CvDtos.AnalyzeJobResponse analyze(UUID userId, CvDtos.AnalyzeCvRequest request) {
        CvDocument doc = documentRepository.findById(request.getDocumentId())
                .filter(d -> d.getUser().getId().equals(userId))
                .orElseThrow(() -> new ApiException("Document not found", HttpStatus.NOT_FOUND));

        TargetRole targetRole = roleContextBuilder.resolveTargetRole(userId, request.getTargetRoleId());
        boolean includeJustifications = true;

        var job = jobService.createJob(doc.getUser(), JobType.CV_ANALYSIS);
        CvAnalysis analysis = CvAnalysis.builder()
                .cvDocument(doc)
                .targetRole(targetRole)
                .analyzedAt(Instant.now())
                .build();
        analysis = analysisRepository.save(analysis);

        analysisAsyncExecutor.runCvAnalysis(job.getId(), analysis.getId(), doc, targetRole, includeJustifications);
        return CvDtos.AnalyzeJobResponse.builder()
                .analysisId(analysis.getId())
                .jobId(job.getId())
                .status("PENDING")
                .build();
    }

    @Transactional(readOnly = true)
    public CvDtos.CvAnalysisResponse getAnalysis(UUID userId, UUID analysisId) {
        CvAnalysis analysis = analysisRepository.findByIdAndUserId(analysisId, userId)
                .orElseThrow(() -> new ApiException("Analysis not found", HttpStatus.NOT_FOUND));
        return toAnalysisResponse(analysis);
    }

    @Transactional(readOnly = true)
    public List<CvDtos.CvAnalysisResponse> listAnalyses(UUID userId) {
        return analysisRepository.findByCvDocumentUserIdOrderByAnalyzedAtDesc(userId)
                .stream()
                .filter(a -> a.getCvDocument() != null && Boolean.TRUE.equals(a.getCvDocument().getIsActive()))
                .filter(a -> a.getAtsScore() != null && a.getAnalyzedAt() != null)
                .map(this::toAnalysisResponse)
                .toList();
    }

    @Transactional
    public void deleteDocument(UUID userId, UUID documentId) {
        CvDocument doc = documentRepository.findById(documentId)
                .filter(d -> d.getUser().getId().equals(userId))
                .orElseThrow(() -> new ApiException("Document not found", HttpStatus.NOT_FOUND));
        doc.setIsActive(false);
        documentRepository.save(doc);
    }

    @Transactional(readOnly = true)
    public CvDocumentDownload downloadDocument(UUID userId, UUID documentId) {
        CvDocument doc = documentRepository.findById(documentId)
                .filter(d -> d.getUser().getId().equals(userId))
                .filter(d -> Boolean.TRUE.equals(d.getIsActive()))
                .orElseThrow(() -> new ApiException("Document not found", HttpStatus.NOT_FOUND));
        Path path = Paths.get(doc.getFilePath());
        if (!Files.exists(path)) {
            throw new ApiException("File not found on server", HttpStatus.NOT_FOUND);
        }
        String contentType = "PDF".equalsIgnoreCase(doc.getFileType())
                ? MediaType.APPLICATION_PDF_VALUE
                : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        return new CvDocumentDownload(new FileSystemResource(path), doc.getFileName(), contentType);
    }

    public record CvDocumentDownload(Resource resource, String fileName, String contentType) {}

    private CvDtos.CvDocumentResponse toDocumentResponse(CvDocument doc) {
        return CvDtos.CvDocumentResponse.builder()
                .id(doc.getId())
                .fileName(doc.getFileName())
                .fileType(doc.getFileType())
                .fileSizeBytes(doc.getFileSizeBytes())
                .uploadedAt(doc.getUploadedAt())
                .build();
    }

    private CvDtos.CvAnalysisResponse toAnalysisResponse(CvAnalysis a) {
        Map<String, List<String>> keywordReport = Map.of();
        List<String> suggestions = List.of();
        List<String> summaryTips = List.of();
        String summaryText = null;
        String reportSummary = null;
        List<CvDtos.RecommendationItem> recommendations = List.of();
        Map<String, Object> parsed = Map.of();
        BigDecimal roleFitScore = null;
        String roleFitSummary = null;
        try {
            if (a.getKeywordReport() != null) {
                Map<String, Object> rawReport = jsonUtil.fromJson(a.getKeywordReport(), new TypeReference<>() {});
                keywordReport = new LinkedHashMap<>();
                for (Map.Entry<String, Object> entry : rawReport.entrySet()) {
                    if (entry.getValue() instanceof List<?> list) {
                        keywordReport.put(entry.getKey(), list.stream().map(String::valueOf).toList());
                    } else if ("roleFitScore".equals(entry.getKey()) && entry.getValue() != null) {
                        roleFitScore = new BigDecimal(String.valueOf(entry.getValue()));
                    } else if ("roleFitSummary".equals(entry.getKey()) && entry.getValue() != null) {
                        roleFitSummary = String.valueOf(entry.getValue());
                    }
                }
            }
            if (a.getSuggestions() != null) {
                RecommendationPayload payload = parseRecommendationPayload(a.getSuggestions());
                summaryTips = payload.summaryTips();
                summaryText = payload.summaryText();
                reportSummary = payload.reportSummary();
                recommendations = payload.recommendations();
                suggestions = summaryText != null && !summaryText.isBlank()
                        ? List.of(summaryText)
                        : summaryTips.isEmpty()
                                ? recommendations.stream().map(CvDtos.RecommendationItem::getText).toList()
                                : summaryTips;
            }
            if (a.getParsedJson() != null) {
                parsed = jsonUtil.fromJson(a.getParsedJson(), new TypeReference<>() {});
            }
        } catch (Exception ignored) {}

        TargetRole role = a.getTargetRole();
        return CvDtos.CvAnalysisResponse.builder()
                .id(a.getId())
                .documentId(a.getCvDocument().getId())
                .fileName(a.getCvDocument().getFileName())
                .targetRoleId(role != null ? role.getId() : null)
                .targetRoleTitle(role != null ? role.getTitle() : null)
                .atsScore(a.getAtsScore())
                .roleFitScore(roleFitScore)
                .roleFitSummary(roleFitSummary)
                .breakdown(CvDtos.ScoreBreakdown.builder()
                        .keywordScore(a.getKeywordScore())
                        .formatScore(a.getFormatScore())
                        .completenessScore(a.getCompletenessScore())
                        .build())
                .keywordReport(keywordReport)
                .summaryTips(summaryTips)
                .summaryText(summaryText)
                .reportSummary(reportSummary)
                .suggestions(suggestions)
                .recommendations(recommendations)
                .parsedData(parsed)
                .analyzedAt(a.getAnalyzedAt())
                .build();
    }

    private record RecommendationPayload(
            List<String> summaryTips,
            String summaryText,
            String reportSummary,
            List<CvDtos.RecommendationItem> recommendations) {}

    private RecommendationPayload parseRecommendationPayload(String json) {
        try {
            Object raw = jsonUtil.fromJson(json, Object.class);
            if (raw instanceof Map<?, ?> map) {
                List<String> tips = parseSummaryTips(map.get("summaryTips"));
                String text = map.get("summaryText") != null ? String.valueOf(map.get("summaryText")).trim() : "";
                String report = map.get("reportSummary") != null ? String.valueOf(map.get("reportSummary")).trim() : "";
                List<CvDtos.RecommendationItem> items = parseRecommendationEntries(map.get("recommendations"));
                if (items.isEmpty()) {
                    items = parseRecommendationEntries(raw);
                }
                if (text.isBlank() && !tips.isEmpty()) {
                    text = String.join(" ", tips);
                }
                if (text.isBlank() && !items.isEmpty()) {
                    text = items.stream()
                            .map(CvDtos.RecommendationItem::getText)
                            .limit(3)
                            .reduce((a, b) -> a + " " + b)
                            .orElse("");
                }
                if (report.isBlank() && !text.isBlank()) {
                    report = text;
                }
                if (report.isBlank() && !items.isEmpty()) {
                    report = items.stream()
                            .map(CvDtos.RecommendationItem::getText)
                            .limit(4)
                            .reduce((a, b) -> a + "; " + b)
                            .map(s -> "Priority improvements include: " + s + ".")
                            .orElse("");
                }
                return new RecommendationPayload(tips, text, report, items);
            }
            return new RecommendationPayload(List.of(), "", "", parseRecommendationEntries(raw));
        } catch (Exception e) {
            return new RecommendationPayload(List.of(), "", "", List.of());
        }
    }

    private List<String> parseSummaryTips(Object raw) {
        if (!(raw instanceof List<?> list)) {
            return List.of();
        }
        List<String> tips = new ArrayList<>();
        for (Object entry : list) {
            if (entry == null) continue;
            String text = String.valueOf(entry).trim();
            if (!text.isBlank()) {
                tips.add(text);
            }
        }
        return tips.size() > 4 ? tips.subList(0, 4) : tips;
    }

    private List<CvDtos.RecommendationItem> parseRecommendationEntries(Object raw) {
        if (!(raw instanceof List<?> entries)) {
            return List.of();
        }
        List<CvDtos.RecommendationItem> items = new ArrayList<>();
        for (Object entry : entries) {
            if (entry instanceof String text) {
                items.add(CvDtos.RecommendationItem.builder().text(text).priority("medium").build());
            } else if (entry instanceof Map<?, ?> map) {
                items.add(CvDtos.RecommendationItem.builder()
                        .text(map.get("text") != null ? String.valueOf(map.get("text")) : "")
                        .justification(map.get("justification") != null ? String.valueOf(map.get("justification")) : null)
                        .evidence(map.get("evidence") != null ? String.valueOf(map.get("evidence")) : null)
                        .priority(map.get("priority") != null ? String.valueOf(map.get("priority")) : "medium")
                        .build());
            }
        }
        return items.stream().filter(i -> i.getText() != null && !i.getText().isBlank()).toList();
    }

    private List<CvDtos.RecommendationItem> parseRecommendations(String json) {
        return parseRecommendationPayload(json).recommendations();
    }
}
