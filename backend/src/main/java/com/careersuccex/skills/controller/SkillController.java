package com.careersuccex.skills.controller;

import com.careersuccex.auth.security.SecurityUtils;
import com.careersuccex.skills.dto.SkillDtos;
import com.careersuccex.skills.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class SkillController {

    private final SkillTaxonomyService taxonomyService;
    private final SkillAggregationService aggregationService;
    private final SkillGapService gapService;
    private final SecurityUtils securityUtils;

    @GetMapping("/api/v1/skills/taxonomy")
    public Page<SkillDtos.SkillResponse> taxonomy(
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return taxonomyService.getTaxonomy(category, page, size);
    }

    @GetMapping("/api/v1/skills/mine")
    public List<SkillDtos.UserSkillResponse> mySkills() {
        return aggregationService.getUserSkills(securityUtils.getCurrentUserId());
    }

    @PutMapping("/api/v1/skills/self-assessment")
    public void selfAssessment(@RequestBody List<SkillDtos.SelfAssessmentItem> items) {
        aggregationService.updateSelfAssessment(securityUtils.getCurrentUserId(), items);
    }

    @GetMapping("/api/v1/skills/gaps")
    public List<SkillDtos.SkillGapResponse> gaps(@RequestParam(required = false) UUID targetRoleId) {
        return gapService.getGaps(securityUtils.getCurrentUserId(), targetRoleId);
    }

    @PostMapping("/api/v1/skills/gaps/recalculate")
    public List<SkillDtos.SkillGapResponse> recalculate(@RequestParam UUID targetRoleId) {
        return gapService.recalculate(securityUtils.getCurrentUserId(), targetRoleId);
    }
}
