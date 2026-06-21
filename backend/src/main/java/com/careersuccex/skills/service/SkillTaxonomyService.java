package com.careersuccex.skills.service;

import com.careersuccex.common.enums.SkillCategory;
import com.careersuccex.skills.dto.SkillDtos;
import com.careersuccex.skills.entity.Skill;
import com.careersuccex.skills.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SkillTaxonomyService {

    private final SkillRepository skillRepository;

    public Page<SkillDtos.SkillResponse> getTaxonomy(String category, int page, int size) {
        PageRequest pr = PageRequest.of(page, size);
        Page<Skill> skills = category != null
                ? skillRepository.findByCategory(SkillCategory.valueOf(category), pr)
                : skillRepository.findAll(pr);
        return skills.map(s -> SkillDtos.SkillResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .category(s.getCategory().name())
                .description(s.getDescription())
                .build());
    }
}
