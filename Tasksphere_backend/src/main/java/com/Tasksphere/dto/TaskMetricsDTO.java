package com.Tasksphere.dto;

public class TaskMetricsDTO {
    private long activeTasks;
    private long completedTasks;
    private long overdueTasks;

    public TaskMetricsDTO(long activeTasks, long completedTasks, long overdueTasks) {
        this.activeTasks = activeTasks;
        this.completedTasks = completedTasks;
        this.overdueTasks = overdueTasks;
    }

    public long getActiveTasks() { return activeTasks; }
    public void setActiveTasks(long activeTasks) { this.activeTasks = activeTasks; }
    public long getCompletedTasks() { return completedTasks; }
    public void setCompletedTasks(long completedTasks) { this.completedTasks = completedTasks; }
    public long getOverdueTasks() { return overdueTasks; }
    public void setOverdueTasks(long overdueTasks) { this.overdueTasks = overdueTasks; }
}