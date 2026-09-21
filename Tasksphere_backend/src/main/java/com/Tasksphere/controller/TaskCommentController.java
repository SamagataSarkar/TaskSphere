package com.Tasksphere.controller;

import com.Tasksphere.dto.TaskCommentDTO;
import com.Tasksphere.service.TaskCommentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks/{taskId}/comments")
public class TaskCommentController {

    private final TaskCommentService commentService;

    public TaskCommentController(TaskCommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping
    public ResponseEntity<TaskCommentDTO> addComment(
            @PathVariable Long taskId,
            @Valid @RequestBody TaskCommentDTO commentDTO) {

        TaskCommentDTO createdComment = commentService.addComment(taskId, commentDTO.getContent());
        return new ResponseEntity<>(createdComment, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<TaskCommentDTO>> getCommentsForTask(@PathVariable Long taskId) {
        return ResponseEntity.ok(commentService.getCommentsForTask(taskId));
    }
}