package com.careersuccex.cv.service;

import com.careersuccex.auth.entity.User;
import com.careersuccex.auth.repository.UserRepository;
import com.careersuccex.common.enums.JobType;
import com.careersuccex.common.exception.ApiException;
import com.careersuccex.common.service.AnalysisAsyncExecutor;
import com.careersuccex.common.service.AnalysisJobService;
import com.careersuccex.common.service.RateLimitService;
import com.careersuccex.common.util.JsonUtil;
import com.careersuccex.cv.dto.CvDtos;
import com.careersuccex.cv.entity.CvAnalysis;
import com.careersuccex.cv.entity.CvDocument;
import com.careersuccex.cv.repository.CvAnalysisRepository;
import com.careersuccex.cv.repository.CvDocumentRepository;
import com.careersuccex.skills.entity.TargetRole;
import com.careersuccex.skills.repository.TargetRoleRepository;
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
    private final TargetRoleRepository targetRoleRepository;
    private final JsonUtil jsonUtil;
    private final AnalysisJobService jobService;
    private final RateLimitService rateLimitService;
    private final AnalysisAsyncExecutor analysisAsyncExecutor;

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

        TargetRole targetRole = null;
        if (request.getTargetRoleId() != null) {
            targetRole = targetRoleRepository.findById(request.getTargetRoleId())
                    .orElseThrow(() -> new ApiException("Target role not found", HttpStatus.NOT_FOUND));
        }

        var job = jobService.createJob(doc.getUser(), JobType.CV_ANALYSIS);
        CvAnalysis analysis = CvAnalysis.builder()
                .cvDocument(doc)
                .targetRole(targetRole)
                .analyzedAt(Instant.now())
                .build();
        analysis = analysisRepository.save(analysis);

        analysisAsyncExecutor.runCvAnalysis(job.getId(), analysis.getId(), doc, targetRole);
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
        Map<String, Object> parsed = Map.of();
        try {
            if (a.getKeywordReport() != null) {
                keywordReport = jsonUtil.fromJson(a.getKeywordReport(), new TypeReference<>() {});
            }
            if (a.getSuggestions() != null) {
                suggestions = jsonUtil.fromJson(a.getSuggestions(), new TypeReference<>() {});
            }
            if (a.getParsedJson() != null) {
                parsed = jsonUtil.fromJson(a.getParsedJson(), new TypeReference<>() {});
            }
        } catch (Exception ignored) {}

        return CvDtos.CvAnalysisResponse.builder()
                .id(a.getId())
                .documentId(a.getCvDocument().getId())
                .fileName(a.getCvDocument().getFileName())
                .atsScore(a.getAtsScore())
                .breakdown(CvDtos.ScoreBreakdown.builder()
                        .keywordScore(a.getKeywordScore())
                        .formatScore(a.getFormatScore())
                        .completenessScore(a.getCompletenessScore())
                        .build())
                .keywordReport(keywordReport)
                .suggestions(suggestions)
                .parsedData(parsed)
                .analyzedAt(a.getAnalyzedAt())
                .build();
    }
}
