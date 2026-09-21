package com.Tasksphere.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public class TaskCommentDTO {

    private Long id;

    @NotBlank(message = "Comment cannot be empty")
    private String content;

    private String authorName;
    private String authorEmail;
    private LocalDateTime createdAt;
    private Long taskId;

    public TaskCommentDTO() {}

    public TaskCommentDTO(Long id, String content, String authorName, String authorEmail, LocalDateTime createdAt, Long taskId) {
        this.id = id;
        this.content = content;
        this.authorName = authorName;
        this.authorEmail = authorEmail;
        this.createdAt = createdAt;
        this.taskId = taskId;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }
    public String getAuthorEmail() { return authorEmail; }
    public void setAuthorEmail(String authorEmail) { this.authorEmail = authorEmail; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }
}