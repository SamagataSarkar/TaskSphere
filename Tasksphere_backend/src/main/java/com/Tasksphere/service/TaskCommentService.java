package com.Tasksphere.service;

import com.Tasksphere.dto.TaskCommentDTO;
import com.Tasksphere.model.Task;
import com.Tasksphere.model.TaskComment;
import com.Tasksphere.model.User;
import com.Tasksphere.repository.ProjectMembershipRepository;
import com.Tasksphere.repository.TaskCommentRepository;
import com.Tasksphere.repository.TaskRepository;
import com.Tasksphere.repository.UserRepository;
import com.Tasksphere.util.Sanitizer;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class TaskCommentService {

    private final TaskCommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectMembershipRepository membershipRepository;

    public TaskCommentService(TaskCommentRepository commentRepository,
                              TaskRepository taskRepository,
                              UserRepository userRepository,
                              ProjectMembershipRepository membershipRepository) {
        this.commentRepository = commentRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
    }

    @Transactional
    public TaskCommentDTO addComment(Long taskId, String content) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        // Ensure the user is actually a member of the project this task belongs to
        if (!membershipRepository.existsByProjectIdAndUserEmail(task.getProject().getId(), email)) {
            throw new AccessDeniedException("Access denied: You are not a member of this project.");
        }

        // Clean the input to prevent Cross-Site Scripting (XSS)
        String cleanContent = Sanitizer.sanitize(content);

        TaskComment comment = new TaskComment(cleanContent, task, user);
        TaskComment savedComment = commentRepository.save(comment);

        return mapToDTO(savedComment);
    }

    public List<TaskCommentDTO> getCommentsForTask(Long taskId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        // Ensure the user is allowed to read these comments
        if (!membershipRepository.existsByProjectIdAndUserEmail(task.getProject().getId(), email)) {
            throw new AccessDeniedException("Access denied: You are not a member of this project.");
        }

        // Fetch comments ordered by newest first
        return commentRepository.findByTaskIdOrderByCreatedAtDesc(taskId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private TaskCommentDTO mapToDTO(TaskComment comment) {
        return new TaskCommentDTO(
                comment.getId(),
                comment.getContent(),
                comment.getAuthor().getName(),
                comment.getAuthor().getEmail(),
                comment.getCreatedAt(),
                comment.getTask().getId()
        );
    }
}