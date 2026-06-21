package com.careersuccex.interview.controller;

import com.careersuccex.auth.security.SecurityUtils;
import com.careersuccex.interview.dto.InterviewDtos;
import com.careersuccex.interview.service.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;
    private final SecurityUtils securityUtils;

    @PostMapping("/sessions")
    public InterviewDtos.SessionResponse start(@RequestBody InterviewDtos.StartSessionRequest request) {
        return interviewService.startSession(securityUtils.getCurrentUserId(), request);
    }

    @GetMapping("/sessions/{id}")
    public InterviewDtos.SessionResponse get(@PathVariable UUID id) {
        return interviewService.getSession(securityUtils.getCurrentUserId(), id);
    }

    @PostMapping("/sessions/{id}/answers")
    public InterviewDtos.SessionResponse submitAnswer(@PathVariable UUID id, @RequestBody InterviewDtos.SubmitAnswerRequest request) {
        return interviewService.submitAnswer(securityUtils.getCurrentUserId(), id, request);
    }

    @PostMapping("/sessions/{id}/complete")
    public InterviewDtos.SessionResponse complete(@PathVariable UUID id) {
        return interviewService.completeSession(securityUtils.getCurrentUserId(), id);
    }

    @GetMapping("/sessions")
    public List<InterviewDtos.SessionResponse> list() {
        return interviewService.listSessions(securityUtils.getCurrentUserId());
    }
}
