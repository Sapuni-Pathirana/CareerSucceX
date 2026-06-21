package com.careersuccex.common.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RateLimitService {

    private final StringRedisTemplate redis;

    @Value("${app.rate-limit.requests-per-minute:100}")
    private int requestsPerMinute;

    @Value("${app.rate-limit.cv-uploads-per-day:5}")
    private int cvUploadsPerDay;

    @Value("${app.rate-limit.github-refreshes-per-day:3}")
    private int githubRefreshesPerDay;

    public boolean allowRequest(UUID userId) {
        String key = "rate:req:" + userId + ":" + (System.currentTimeMillis() / 60000);
        Long count = redis.opsForValue().increment(key);
        if (count != null && count == 1) {
            redis.expire(key, Duration.ofMinutes(2));
        }
        return count == null || count <= requestsPerMinute;
    }

    public boolean allowCvUpload(UUID userId) {
        return allowDaily(userId, "cv", cvUploadsPerDay);
    }

    public boolean allowGithubRefresh(UUID userId) {
        return allowDaily(userId, "github", githubRefreshesPerDay);
    }

    private boolean allowDaily(UUID userId, String type, int limit) {
        String key = "rate:" + type + ":" + userId + ":" + LocalDate.now();
        Long count = redis.opsForValue().increment(key);
        if (count != null && count == 1) {
            redis.expire(key, Duration.ofDays(2));
        }
        return count == null || count <= limit;
    }
}
