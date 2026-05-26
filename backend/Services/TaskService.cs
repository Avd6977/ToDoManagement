using Microsoft.EntityFrameworkCore;
using ToDoManagement.Api.Data;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Models;
using ToDoManagement.Api.Services.Interfaces;

namespace ToDoManagement.Api.Services;

public sealed class TaskService : ITaskService
{
    private const string StatusOpen = "open";
    private const string StatusCompleted = "completed";
    private const string StatusAll = "all";

    private readonly AppDbContext _dbContext;
    private readonly IDateTimeService _dateTimeService;

    public TaskService(AppDbContext dbContext, IDateTimeService dateTimeService)
    {
        _dbContext = dbContext;
        _dateTimeService = dateTimeService;
    }

    public async Task<ServiceResult<IReadOnlyCollection<TaskResponse>>> GetTasksAsync(Guid userId, string? search, string? status, CancellationToken cancellationToken)
    {
        var normalizedStatus = (status ?? StatusAll).Trim().ToLowerInvariant();
        if (normalizedStatus is not StatusOpen and not StatusCompleted and not StatusAll)
        {
            return ServiceResult<IReadOnlyCollection<TaskResponse>>.Failure(StatusCodes.Status400BadRequest, "Invalid status filter. Use open, completed, or all.");
        }

        var query = _dbContext.Tasks.Where(t => t.OwnerId == userId);

        if (normalizedStatus == StatusOpen)
        {
            query = query.Where(t => !t.IsCompleted);
        }
        else if (normalizedStatus == StatusCompleted)
        {
            query = query.Where(t => t.IsCompleted);
        }

        var normalizedSearch = (search ?? string.Empty).Trim();
        if (!string.IsNullOrWhiteSpace(normalizedSearch))
        {
            var loweredSearch = normalizedSearch.ToLowerInvariant();
            query = query.Where(t =>
                t.Title.ToLower().Contains(loweredSearch)
                || t.Description.ToLower().Contains(loweredSearch));
        }

        var tasks = await query
            .OrderBy(t => t.IsCompleted)
            .ThenBy(t => t.DueDate)
            .Select(t => new TaskResponse
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                DueDate = t.DueDate,
                IsCompleted = t.IsCompleted,
                OwnerId = t.OwnerId,
                CreatedDateUtc = t.CreatedDateUtc,
                UpdatedDateUtc = t.UpdatedDateUtc
            })
            .ToListAsync(cancellationToken);

        return ServiceResult<IReadOnlyCollection<TaskResponse>>.Success(tasks);
    }

    public async Task<ServiceResult<TaskResponse>> CreateTaskAsync(Guid userId, CreateTaskRequest request, CancellationToken cancellationToken)
    {
        var nowUtc = _dateTimeService.UtcNow;

        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            DueDate = request.DueDate,
            IsCompleted = false,
            OwnerId = userId,
            CreatedDateUtc = nowUtc,
            UpdatedDateUtc = nowUtc
        };

        _dbContext.Tasks.Add(task);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return ServiceResult<TaskResponse>.Success(Map(task), StatusCodes.Status201Created);
    }

    public async Task<ServiceResult<TaskResponse>> UpdateTaskAsync(Guid userId, Guid taskId, UpdateTaskRequest request, CancellationToken cancellationToken)
    {
        var task = await _dbContext.Tasks.FirstOrDefaultAsync(t => t.Id == taskId, cancellationToken);
        if (task is null)
        {
            return ServiceResult<TaskResponse>.Failure(StatusCodes.Status404NotFound, "Task not found.");
        }

        if (task.OwnerId != userId)
        {
            return ServiceResult<TaskResponse>.Failure(StatusCodes.Status403Forbidden, "Only the owner can update this task.");
        }

        var nowUtc = _dateTimeService.UtcNow;
        if (IsDueDateChanged(task.DueDate, request.DueDate)
            && request.DueDate.HasValue
            && request.DueDate.Value.Date < nowUtc.Date)
        {
            return ServiceResult<TaskResponse>.Failure(StatusCodes.Status400BadRequest, "Due date cannot be changed to a past date.");
        }

        // This is only needed for SQL Lite. SQL Server Temporal Tables would handle this automatically.
        AddHistory(task, nowUtc, "UPDATE");

        task.Title = request.Title.Trim();
        task.Description = request.Description.Trim();
        task.DueDate = request.DueDate;
        task.IsCompleted = request.IsCompleted;
        task.UpdatedDateUtc = nowUtc;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return ServiceResult<TaskResponse>.Success(Map(task));
    }

    public async Task<ServiceResult> DeleteTaskAsync(Guid userId, Guid taskId, CancellationToken cancellationToken)
    {
        var task = await _dbContext.Tasks.FirstOrDefaultAsync(t => t.Id == taskId, cancellationToken);
        if (task is null)
        {
            return ServiceResult.Failure(StatusCodes.Status404NotFound, "Task not found.");
        }

        if (task.OwnerId != userId)
        {
            return ServiceResult.Failure(StatusCodes.Status403Forbidden, "Only the owner can delete this task.");
        }

        AddHistory(task, _dateTimeService.UtcNow, "DELETE");
        _dbContext.Tasks.Remove(task);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return ServiceResult.Success(StatusCodes.Status204NoContent);
    }

    private static TaskResponse Map(TaskItem task) => new()
    {
        Id = task.Id,
        Title = task.Title,
        Description = task.Description,
        DueDate = task.DueDate,
        IsCompleted = task.IsCompleted,
        OwnerId = task.OwnerId,
        CreatedDateUtc = task.CreatedDateUtc,
        UpdatedDateUtc = task.UpdatedDateUtc
    };

    private static bool IsDueDateChanged(DateTime? existingDueDate, DateTime? requestedDueDate)
    {
        if (!existingDueDate.HasValue && !requestedDueDate.HasValue)
        {
            return false;
        }

        if (!existingDueDate.HasValue || !requestedDueDate.HasValue)
        {
            return true;
        }

        return existingDueDate.Value.Date != requestedDueDate.Value.Date;
    }

    private void AddHistory(TaskItem task, DateTime validToUtc, string operation)
    {
        var validFromUtc = task.UpdatedDateUtc == default
            ? task.CreatedDateUtc
            : task.UpdatedDateUtc;

        _dbContext.TaskHistory.Add(new TaskItemHistory
        {
            Id = Guid.NewGuid(),
            TaskId = task.Id,
            Title = task.Title,
            Description = task.Description,
            DueDate = task.DueDate,
            IsCompleted = task.IsCompleted,
            OwnerId = task.OwnerId,
            CreatedDateUtc = task.CreatedDateUtc,
            UpdatedDateUtc = task.UpdatedDateUtc,
            ValidFromUtc = validFromUtc,
            ValidToUtc = validToUtc,
            Operation = operation
        });
    }
}
