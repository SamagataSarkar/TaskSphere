package com.Tasksphere.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public class TaskDTO {

    private Long id;

    @NotBlank(message = "Task title cannot be blank")
    private String title;
    private String priority;
    private String status;
    private Long projectId;
    private Long assignedToUserId;
    private LocalDate deadline;

    public TaskDTO() {}

    public TaskDTO(Long id, String title, String status, Long projectId) {
        this.id = id;
        this.title = title;
        this.status = status;
        this.projectId = projectId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public Long getAssignedToUserId() { return assignedToUserId; }
    public void setAssignedToUserId(Long assignedToUserId) { this.assignedToUserId = assignedToUserId; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    // Added Missing Methods
    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }
}