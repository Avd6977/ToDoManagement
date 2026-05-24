namespace ToDoManagement.Api.Dtos;

public sealed class CreateTaskRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public Guid? AssignedToId { get; set; }
}

public sealed class UpdateTaskRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public bool IsCompleted { get; set; }
    public Guid? AssignedToId { get; set; }
}

public sealed class TaskResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public bool IsCompleted { get; set; }
    public Guid OwnerId { get; set; }
    public Guid? AssignedToId { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTime CreatedDateUtc { get; set; }
    public Guid UpdatedBy { get; set; }
    public DateTime UpdatedDateUtc { get; set; }
}
