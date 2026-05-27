namespace ToDoManagement.Api.Models;

public sealed class TaskItem
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateOnly? DueDate { get; set; }
    public bool IsCompleted { get; set; }
    public Guid OwnerId { get; set; }
    public DateTime CreatedDateUtc { get; set; }
    public DateTime UpdatedDateUtc { get; set; }
}
