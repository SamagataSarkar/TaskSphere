package com.Tasksphere.repository;

import com.Tasksphere.model.ProjectMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ProjectMembershipRepository extends JpaRepository<ProjectMembership, Long> {
    boolean existsByProjectIdAndUserEmail(Long projectId, String email);
    Optional<ProjectMembership> findByProjectIdAndUserEmail(Long projectId, String email);
}