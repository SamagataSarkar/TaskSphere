package com.Tasksphere.repository;

import com.Tasksphere.model.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    Page<Task> findByStatus(String status, Pageable pageable);

    List<Task> findByProjectId(Long projectId);
    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId AND t.status != 'DONE' AND t.deadline BETWEEN :today AND :threeDaysAhead")
    List<Task> findUpcomingDeadlines(@Param("projectId") Long projectId,
                                     @Param("today") LocalDate today,
                                     @Param("threeDaysAhead") LocalDate threeDaysAhead);
}