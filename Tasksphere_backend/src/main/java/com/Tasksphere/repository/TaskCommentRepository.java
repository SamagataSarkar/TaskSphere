package com.Tasksphere.repository;

import com.Tasksphere.model.TaskComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskCommentRepository extends JpaRepository<TaskComment, Long> {

    // Automatically fetches all comments for a task, ordered from newest to oldest
    List<TaskComment> findByTaskIdOrderByCreatedAtDesc(Long taskId);

}