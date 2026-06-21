package com.careersuccex.skills.repository;

import com.careersuccex.skills.entity.TargetRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TargetRoleRepository extends JpaRepository<TargetRole, UUID> {
}
