package com.careersuccex.skills.controller;

import com.careersuccex.skills.dto.SkillDtos;
import com.careersuccex.skills.service.TargetRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class TargetRoleController {

    private final TargetRoleService targetRoleService;

    @GetMapping
    public List<SkillDtos.TargetRoleResponse> list() {
        return targetRoleService.listRoles();
    }

    @GetMapping("/{id}")
    public SkillDtos.TargetRoleResponse get(@PathVariable UUID id) {
        return targetRoleService.getRole(id);
    }
}
