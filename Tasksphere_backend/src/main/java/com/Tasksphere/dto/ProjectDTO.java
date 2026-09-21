package com.Tasksphere.dto;

import jakarta.validation.constraints.NotBlank;

public class ProjectDTO {
    private Long id;

    @NotBlank(message = "Project name is required")
    private String name;

    private Boolean archived = false;

    public ProjectDTO() {}

    public ProjectDTO(Long id, String name, Boolean archived) {
        this.id = id;
        this.name = name;
        this.archived = archived;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Boolean getArchived() { return archived; }
    public void setArchived(Boolean archived) { this.archived = archived; }
}