package com.Tasksphere.service;

import com.Tasksphere.dto.TaskDTO;
import com.Tasksphere.dto.TaskMetricsDTO;
import com.Tasksphere.model.*;
import com.Tasksphere.repository.ProjectMembershipRepository;
import com.Tasksphere.repository.ProjectRepository;
import com.Tasksphere.repository.TaskRepository;
import com.Tasksphere.repository.UserRepository;
import com.Tasksphere.util.Sanitizer;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Locale;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMembershipRepository membershipRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository,
                       ProjectRepository projectRepository,
                       ProjectMembershipRepository membershipRepository,
                       UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public TaskDTO createTask(TaskDTO taskDTO) {
        Project project = projectRepository.findById(taskDTO.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        validateProjectMembership(project.getId());

        String cleanTitle = Sanitizer.sanitize(taskDTO.getTitle());
        String validatedStatus = validateStatus(taskDTO.getStatus());
        Task task = new Task(cleanTitle, validatedStatus);
        task.setProject(project);
        task.setDeadline(taskDTO.getDeadline());

        assignTaskIfApplicable(task, taskDTO.getAssignedToUserId());
        if (taskDTO.getPriority() != null) {
            task.setPriority(TaskPriority.valueOf(taskDTO.getPriority().toUpperCase()));
        }

        Task savedTask = taskRepository.save(task);
        return mapToDTO(savedTask);
    }

    public List<TaskDTO> getAllTasks() {
        String currentUserEmail = getAuthenticatedUserEmail();

        return taskRepository.findAll().stream()
                .filter(task -> task.getProject() != null &&
                        membershipRepository.existsByProjectIdAndUserEmail(task.getProject().getId(), currentUserEmail))
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ADDED: Calculates metrics for the Dashboard view
    public TaskMetricsDTO getUserTaskMetrics() {
        List<TaskDTO> allTasks = getAllTasks();
        LocalDate today = LocalDate.now();

        long active = 0;
        long completed = 0;
        long overdue = 0;

        for (TaskDTO task : allTasks) {
            if ("DONE".equalsIgnoreCase(task.getStatus())) {
                completed++;
            } else {
                active++;
                if (task.getDeadline() != null && task.getDeadline().isBefore(today)) {
                    overdue++;
                }
            }
        }
        return new TaskMetricsDTO(active, completed, overdue);
    }

    // --- ADD THESE NEW METHODS ---
    public List<TaskDTO> getCompletedTasks() {
        return getAllTasks().stream()
                .filter(t -> "DONE".equalsIgnoreCase(t.getStatus()))
                .collect(Collectors.toList());
    }

    public List<TaskDTO> getOverdueTasks() {
        LocalDate today = LocalDate.now();
        return getAllTasks().stream()
                .filter(t -> !"DONE".equalsIgnoreCase(t.getStatus()) &&
                        t.getDeadline() != null && t.getDeadline().isBefore(today))
                .collect(Collectors.toList());
    }

    public List<TaskDTO> getActiveTasks() {
        return getAllTasks().stream()
                .filter(t -> !"DONE".equalsIgnoreCase(t.getStatus()))
                .collect(Collectors.toList());
    }

    public List<TaskDTO> getUpcomingTasks(Long projectId) {
        LocalDate today = LocalDate.now();
        LocalDate threeDaysAhead = today.plusDays(3);
        return taskRepository.findUpcomingDeadlines(projectId, today, threeDaysAhead).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<TaskDTO> getTasksByProjectId(Long projectId) {
        validateProjectMembership(projectId);

        return taskRepository.findAll().stream()
                .filter(task -> task.getProject() != null && projectId.equals(task.getProject().getId()))
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public TaskDTO getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        validateProjectMembership(task.getProject().getId());
        return mapToDTO(task);
    }

    @Transactional
    public TaskDTO updateTask(Long id, TaskDTO taskDTO) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        ProjectMembership membership = getProjectMembership(task.getProject().getId());

        // --- ENHANCED RBAC CHECKS ---
        if (membership.getRole() == ProjectRole.MEMBER) {

            // 1. Prevent members from touching tasks that are already completed (The "Archive" lock)
            if ("DONE".equalsIgnoreCase(task.getStatus())) {
                throw new AccessDeniedException("Completed tasks are locked. Only project owners can reopen or modify them.");
            }

            // 2. Prevent members from changing an active task to completed
            if ("DONE".equalsIgnoreCase(taskDTO.getStatus())) {
                throw new AccessDeniedException("Members can only transition tasks to IN_REVIEW. Only owners can approve as DONE.");
            }
        }

        // Apply updates
        if (taskDTO.getTitle() != null && !taskDTO.getTitle().isBlank()) {
            task.setTitle(Sanitizer.sanitize(taskDTO.getTitle()));
        }

        if (taskDTO.getStatus() != null) {
            task.setStatus(validateStatus(taskDTO.getStatus()));
        }

        if (taskDTO.getDeadline() != null) {
            task.setDeadline(taskDTO.getDeadline());
        }

        if (taskDTO.getPriority() != null) {
            task.setPriority(TaskPriority.valueOf(taskDTO.getPriority().toUpperCase()));
        }

        if (taskDTO.getProjectId() != null && !taskDTO.getProjectId().equals(task.getProject().getId())) {
            validateProjectMembership(taskDTO.getProjectId());
            Project newProject = projectRepository.findById(taskDTO.getProjectId())
                    .orElseThrow(() -> new IllegalArgumentException("Target project not found"));
            task.setProject(newProject);
        }

        assignTaskIfApplicable(task, taskDTO.getAssignedToUserId());

        Task updatedTask = taskRepository.save(task);
        return mapToDTO(updatedTask);
    }

    @Transactional
    public void deleteTask(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        ProjectMembership membership = getProjectMembership(task.getProject().getId());

        // Prevent members from deleting tasks
        if (membership.getRole() == ProjectRole.MEMBER) {
            throw new AccessDeniedException("Only project owners have permission to delete tasks.");
        }

        taskRepository.delete(task);
    }

    private ProjectMembership getProjectMembership(Long projectId) {
        String email = getAuthenticatedUserEmail();
        return membershipRepository.findByProjectIdAndUserEmail(projectId, email)
                .orElseThrow(() -> new AccessDeniedException("Access denied: You are not a member of this project."));
    }

    private String validateStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Task status is required.");
        }

        try {
            return TaskStatus.valueOf(status.trim().toUpperCase(Locale.ROOT)).name();
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid task status: " + status);
        }
    }

    private void validateProjectMembership(Long projectId) {
        String email = getAuthenticatedUserEmail();
        if (!membershipRepository.existsByProjectIdAndUserEmail(projectId, email)) {
            throw new AccessDeniedException("Access denied: You are not a member of this project.");
        }
    }

    private void assignTaskIfApplicable(Task task, Long assignedToUserId) {
        if (assignedToUserId != null) {
            User assignee = userRepository.findById(assignedToUserId)
                    .orElseThrow(() -> new IllegalArgumentException("Assignee not found"));

            if (!membershipRepository.existsByProjectIdAndUserEmail(task.getProject().getId(), assignee.getEmail())) {
                throw new IllegalArgumentException("Assignee is not a member of this project.");
            }
            task.setAssignedTo(assignee);
        }
    }

    private String getAuthenticatedUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Unauthorized: No active session found.");
        }
        return authentication.getName();
    }

    private TaskDTO mapToDTO(Task task) {
        TaskDTO dto = new TaskDTO(
                task.getId(),
                task.getTitle(),
                task.getStatus(),
                task.getProject() != null ? task.getProject().getId() : null
        );

        dto.setDeadline(task.getDeadline());

        if (task.getAssignedTo() != null) {
            dto.setAssignedToUserId(task.getAssignedTo().getId());
        }
        if (task.getPriority() != null) {
            dto.setPriority(task.getPriority().name());
        }

        return dto;
    }
}
