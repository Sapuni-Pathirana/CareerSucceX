package com.careersuccex.cv.controller;

import com.careersuccex.auth.security.SecurityUtils;
import com.careersuccex.cv.dto.CvDtos;
import com.careersuccex.cv.service.CvService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cv")
@RequiredArgsConstructor
public class CvController {

    private final CvService cvService;
    private final SecurityUtils securityUtils;

    @PostMapping("/upload")
    public Map<String, UUID> upload(@RequestParam("file") MultipartFile file) {
        var doc = cvService.upload(securityUtils.getCurrentUserId(), file);
        return Map.of("documentId", doc.getId());
    }

    @GetMapping("/documents")
    public List<CvDtos.CvDocumentResponse> listDocuments() {
        return cvService.listDocuments(securityUtils.getCurrentUserId());
    }

    @PostMapping("/analyze")
    public CvDtos.AnalyzeJobResponse analyze(@RequestBody CvDtos.AnalyzeCvRequest request) {
        return cvService.analyze(securityUtils.getCurrentUserId(), request);
    }

    @GetMapping("/analyses/{id}")
    public CvDtos.CvAnalysisResponse getAnalysis(@PathVariable UUID id) {
        return cvService.getAnalysis(securityUtils.getCurrentUserId(), id);
    }

    @GetMapping("/analyses")
    public List<CvDtos.CvAnalysisResponse> listAnalyses() {
        return cvService.listAnalyses(securityUtils.getCurrentUserId());
    }

    @DeleteMapping("/documents/{id}")
    public void deleteDocument(@PathVariable UUID id) {
        cvService.deleteDocument(securityUtils.getCurrentUserId(), id);
    }
}
