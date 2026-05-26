using ToDoManagement.Api.Dtos;

namespace ToDoManagement.Api.Services.Interfaces;

public interface ITaskService
{
    Task<ServiceResult<IReadOnlyCollection<TaskResponse>>> GetTasksAsync(Guid userId, string? search, string? status, CancellationToken cancellationToken);

    Task<ServiceResult<TaskResponse>> CreateTaskAsync(Guid userId, CreateTaskRequest request, CancellationToken cancellationToken);

    Task<ServiceResult<TaskResponse>> UpdateTaskAsync(Guid userId, Guid taskId, UpdateTaskRequest request, CancellationToken cancellationToken);

    Task<ServiceResult> DeleteTaskAsync(Guid userId, Guid taskId, CancellationToken cancellationToken);
}

