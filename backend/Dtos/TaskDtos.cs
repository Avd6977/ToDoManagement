namespace ToDoManagement.Api.Dtos;

public sealed class CreateTaskRequest
{
    public string Description { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
}

public sealed class UpdateTaskRequest
{
    public string Description { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public bool IsCompleted { get; set; }
}

public sealed class TaskResponse
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public bool IsCompleted { get; set; }
    public Guid OwnerId { get; set; }
    public DateTime CreatedDateUtc { get; set; }
    public DateTime UpdatedDateUtc { get; set; }
}

public sealed class PagedResponse<T>
{
    public IReadOnlyCollection<T> Items { get; set; } = Array.Empty<T>();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
}
