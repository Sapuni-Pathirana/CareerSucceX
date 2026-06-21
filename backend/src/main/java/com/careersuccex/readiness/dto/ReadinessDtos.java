package com.careersuccex.readiness.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

public class ReadinessDtos {

    @Data
    @Builder
    public static class ScoreResponse {
        private BigDecimal overallScore;
        private Map<String, BigDecimal> breakdown;
        private Instant calculatedAt;
    }

    @Data
    @Builder
    public static class HistoryPoint {
        private BigDecimal overallScore;
        private Instant calculatedAt;
    }
}
