package com.careersuccex.roadmap.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class RoadmapDtos {

    @Data
    public static class GenerateRequest {
        private UUID targetRoleId;
    }

    @Data
    @Builder
    public static class RoadmapResponse {
        private UUID id;
        private String title;
        private String status;
        private Instant generatedAt;
        private List<ItemResponse> items;
    }

    @Data
    @Builder
    public static class ItemResponse {
        private UUID id;
        private String itemType;
        private String title;
        private String description;
        private Object resources;
        private String status;
        private Integer sortOrder;
    }

    @Data
    public static class UpdateItemRequest {
        private String status;
    }
}
