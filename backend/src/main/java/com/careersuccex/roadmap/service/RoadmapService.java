package com.careersuccex.roadmap.service;

import com.careersuccex.auth.repository.UserRepository;
import com.careersuccex.common.enums.ItemStatus;
import com.careersuccex.common.enums.RoadmapItemType;
import com.careersuccex.common.enums.RoadmapStatus;
import com.careersuccex.common.exception.ApiException;
import com.careersuccex.common.util.JsonUtil;
import com.careersuccex.integration.ai.AiDtos;
import com.careersuccex.integration.ai.AiServiceClient;
import com.careersuccex.roadmap.dto.RoadmapDtos;
import com.careersuccex.roadmap.entity.LearningRoadmap;
import com.careersuccex.roadmap.entity.RoadmapItem;
import com.careersuccex.roadmap.repository.LearningRoadmapRepository;
import com.careersuccex.roadmap.repository.RoadmapItemRepository;
import com.careersuccex.skills.entity.TargetRole;
import com.careersuccex.skills.repository.TargetRoleRepository;
import com.careersuccex.skills.service.SkillGapService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoadmapService {

    private final LearningRoadmapRepository roadmapRepository;
    private final RoadmapItemRepository itemRepository;
    private final UserRepository userRepository;
    private final TargetRoleRepository targetRoleRepository;
    private final SkillGapService skillGapService;
    private final AiServiceClient aiServiceClient;
    private final JsonUtil jsonUtil;

    @Transactional
    public RoadmapDtos.RoadmapResponse generate(UUID userId, RoadmapDtos.GenerateRequest request) {
        TargetRole role = targetRoleRepository.findById(request.getTargetRoleId())
                .orElseThrow(() -> new ApiException("Target role not found", HttpStatus.NOT_FOUND));
        var user = userRepository.findById(userId).orElseThrow();

        roadmapRepository.findByUserIdAndStatus(userId, RoadmapStatus.ACTIVE)
                .ifPresent(r -> {
                    r.setStatus(RoadmapStatus.ARCHIVED);
                    roadmapRepository.save(r);
                });

        var gaps = skillGapService.getGaps(userId, role.getId());
        List<String> gapNames = gaps.stream().map(g -> g.getSkillName()).toList();

        AiDtos.GenerateRoadmapRequest aiReq = new AiDtos.GenerateRoadmapRequest();
        aiReq.setTargetRole(role.getTitle());
        aiReq.setSkillGaps(gapNames);
        aiReq.setWeakAreas(gapNames.isEmpty() ? "general readiness" : String.join(", ", gapNames));
        AiDtos.GenerateRoadmapResponse aiResp = aiServiceClient.generateRoadmap(aiReq);

        LearningRoadmap roadmap = LearningRoadmap.builder()
                .user(user)
                .targetRole(role)
                .title("Roadmap for " + role.getTitle())
                .status(RoadmapStatus.ACTIVE)
                .build();

        int order = 1;
        for (AiDtos.RoadmapItemDto item : aiResp.getItems()) {
            RoadmapItem ri = RoadmapItem.builder()
                    .roadmap(roadmap)
                    .itemType(parseItemType(item.getItemType()))
                    .title(item.getTitle())
                    .description(item.getDescription())
                    .resources(jsonUtil.toJson(item.getResources()))
                    .status(ItemStatus.NOT_STARTED)
                    .sortOrder(order++)
                    .build();
            roadmap.getItems().add(ri);
        }
        roadmap = roadmapRepository.save(roadmap);
        return toResponse(roadmap);
    }

    public RoadmapDtos.RoadmapResponse getActive(UUID userId) {
        LearningRoadmap roadmap = roadmapRepository.findByUserIdAndStatus(userId, RoadmapStatus.ACTIVE)
                .orElseThrow(() -> new ApiException("No active roadmap", HttpStatus.NOT_FOUND));
        return toResponse(roadmap);
    }

    public List<RoadmapDtos.RoadmapResponse> getHistory(UUID userId) {
        return roadmapRepository.findByUserIdOrderByGeneratedAtDesc(userId).stream()
                .map(this::toResponse).toList();
    }

    @Transactional
    public RoadmapDtos.ItemResponse updateItem(UUID userId, UUID itemId, RoadmapDtos.UpdateItemRequest request) {
        RoadmapItem item = itemRepository.findByIdAndRoadmapUserId(itemId, userId)
                .orElseThrow(() -> new ApiException("Item not found", HttpStatus.NOT_FOUND));
        item.setStatus(ItemStatus.valueOf(request.getStatus()));
        if (item.getStatus() == ItemStatus.COMPLETED) {
            item.setCompletedAt(Instant.now());
        }
        itemRepository.save(item);
        return toItemResponse(item);
    }

    private RoadmapDtos.RoadmapResponse toResponse(LearningRoadmap roadmap) {
        return RoadmapDtos.RoadmapResponse.builder()
                .id(roadmap.getId())
                .title(roadmap.getTitle())
                .status(roadmap.getStatus().name())
                .generatedAt(roadmap.getGeneratedAt())
                .items(roadmap.getItems().stream().map(this::toItemResponse).toList())
                .build();
    }

    private RoadmapDtos.ItemResponse toItemResponse(RoadmapItem item) {
        Object resources = null;
        try {
            if (item.getResources() != null) resources = jsonUtil.fromJson(item.getResources(), Object.class);
        } catch (Exception ignored) {}
        return RoadmapDtos.ItemResponse.builder()
                .id(item.getId())
                .itemType(item.getItemType().name())
                .title(item.getTitle())
                .description(item.getDescription())
                .resources(resources)
                .status(item.getStatus().name())
                .sortOrder(item.getSortOrder())
                .build();
    }

    private RoadmapItemType parseItemType(String type) {
        try {
            return RoadmapItemType.valueOf(type.toUpperCase());
        } catch (Exception e) {
            return RoadmapItemType.LEARN;
        }
    }
}
