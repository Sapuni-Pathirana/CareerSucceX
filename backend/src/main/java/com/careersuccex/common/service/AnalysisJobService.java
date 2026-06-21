package com.careersuccex.common.service;

import com.careersuccex.common.enums.JobStatus;
import com.careersuccex.common.enums.JobType;
import com.careersuccex.common.entity.AnalysisJob;
import com.careersuccex.common.exception.ApiException;
import com.careersuccex.common.repository.AnalysisJobRepository;
import com.careersuccex.auth.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnalysisJobService {

    private final AnalysisJobRepository jobRepository;

    @Transactional
    public AnalysisJob createJob(User user, JobType type) {
        return jobRepository.save(AnalysisJob.builder()
                .user(user)
                .jobType(type)
                .status(JobStatus.PENDING)
                .build());
    }

    @Transactional
    public void markRunning(UUID jobId) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(JobStatus.RUNNING);
            jobRepository.save(job);
        });
    }

    @Transactional
    public void markCompleted(UUID jobId, UUID resultRefId) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(JobStatus.COMPLETED);
            job.setResultRefId(resultRefId);
            job.setCompletedAt(Instant.now());
            jobRepository.save(job);
        });
    }

    @Transactional
    public void markFailed(UUID jobId, String error) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(JobStatus.FAILED);
            job.setErrorMessage(error);
            job.setCompletedAt(Instant.now());
            jobRepository.save(job);
        });
    }

    public Map<String, Object> getJobStatus(UUID userId, UUID jobId) {
        AnalysisJob job = jobRepository.findByIdAndUserId(jobId, userId)
                .orElseThrow(() -> new ApiException("Job not found", HttpStatus.NOT_FOUND));
        Map<String, Object> response = new HashMap<>();
        response.put("id", job.getId());
        response.put("jobType", job.getJobType().name());
        response.put("status", job.getStatus().name());
        response.put("resultRefId", job.getResultRefId());
        response.put("errorMessage", job.getErrorMessage());
        return response;
    }
}
