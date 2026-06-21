package com.careersuccex.roadmap.controller;

import com.careersuccex.auth.security.SecurityUtils;
import com.careersuccex.roadmap.dto.RoadmapDtos;
import com.careersuccex.roadmap.service.RoadmapService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/roadmaps")
@RequiredArgsConstructor
public class RoadmapController {

    private final RoadmapService roadmapService;
    private final SecurityUtils securityUtils;

    @PostMapping("/generate")
    public RoadmapDtos.RoadmapResponse generate(@RequestBody RoadmapDtos.GenerateRequest request) {
        return roadmapService.generate(securityUtils.getCurrentUserId(), request);
    }

    @GetMapping("/active")
    public RoadmapDtos.RoadmapResponse getActive() {
        return roadmapService.getActive(securityUtils.getCurrentUserId());
    }

    @PatchMapping("/items/{id}")
    public RoadmapDtos.ItemResponse updateItem(@PathVariable UUID id, @RequestBody RoadmapDtos.UpdateItemRequest request) {
        return roadmapService.updateItem(securityUtils.getCurrentUserId(), id, request);
    }

    @GetMapping("/history")
    public List<RoadmapDtos.RoadmapResponse> history() {
        return roadmapService.getHistory(securityUtils.getCurrentUserId());
    }
}
