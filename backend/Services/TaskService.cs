using Microsoft.EntityFrameworkCore;
using ToDoManagement.Api.Data;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Models;
using ToDoManagement.Api.Services.Interfaces;
using TaskFilterStatus = ToDoManagement.Api.Enums.TaskStatus;
using TaskSortOption = ToDoManagement.Api.Enums.TaskSort;
using TaskSortDirection = ToDoManagement.Api.Enums.SortDirection;

namespace ToDoManagement.Api.Services;

public sealed class TaskService : ITaskService
{
    private const int DefaultPage = 1;
    private const int DefaultPageSize = 25;
    private static readonly HashSet<int> AllowedPageSizes = new([25, 50, 100]);

    private readonly AppDbContext _dbContext;
    private readonly IDateTimeService _dateTimeService;

    public TaskService(AppDbContext dbContext, IDateTimeService dateTimeService)
    {
        _dbContext = dbContext;
        _dateTimeService = dateTimeService;
    }

    public async Task<ServiceResult<PagedResponse<TaskResponse>>> GetTasksAsync(Guid userId, string? search, string? status, string? sort, string? sortDirection, int? page, int? pageSize, CancellationToken cancellationToken)
    {
        var normalizedStatus = ParseStatus(status);
        if (normalizedStatus is null)
        {
            return ServiceResult<PagedResponse<TaskResponse>>.Failure(StatusCodes.Status400BadRequest, "Invalid status filter. Use open, completed, overdue, or all.");
        }

        var normalizedSort = ParseSort(sort);
        if (normalizedSort is null)
        {
            return ServiceResult<PagedResponse<TaskResponse>>.Failure(StatusCodes.Status400BadRequest, "Invalid sort option. Use alphabetical, dueDate, or recentlyAdded.");
        }

        var normalizedSortDirection = ParseSortDirection(sortDirection);
        if (normalizedSortDirection is null)
        {
            return ServiceResult<PagedResponse<TaskResponse>>.Failure(StatusCodes.Status400BadRequest, "Invalid sortDirection. Use asc or desc.");
        }

        var normalizedPage = page.GetValueOrDefault(DefaultPage);
        if (normalizedPage < 1)
        {
            return ServiceResult<PagedResponse<TaskResponse>>.Failure(StatusCodes.Status400BadRequest, "Page must be greater than or equal to 1.");
        }

        var normalizedPageSize = pageSize.GetValueOrDefault(DefaultPageSize);
        if (!AllowedPageSizes.Contains(normalizedPageSize))
        {
            return ServiceResult<PagedResponse<TaskResponse>>.Failure(StatusCodes.Status400BadRequest, "Invalid page size. Allowed values are 25, 50, or 100.");
        }

        var query = _dbContext.Tasks
            .AsNoTracking()
            .Where(t => t.OwnerId == userId);

        if (normalizedStatus == TaskFilterStatus.Open)
        {
            query = query.Where(t => !t.IsCompleted);
        }
        else if (normalizedStatus == TaskFilterStatus.Completed)
        {
            query = query.Where(t => t.IsCompleted);
        }
        else if (normalizedStatus == TaskFilterStatus.Overdue)
        {
            var today = DateOnly.FromDateTime(_dateTimeService.UtcNow);
            query = query.Where(t => !t.IsCompleted && t.DueDate.HasValue && t.DueDate.Value < today);
        }

        var normalizedSearch = (search ?? string.Empty).Trim();
        if (!string.IsNullOrWhiteSpace(normalizedSearch))
        {
            query = query.Where(t => EF.Functions.Like(EF.Functions.Collate(t.Description, "NOCASE"), $"%{normalizedSearch}%"));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var sortedQuery = normalizedSort switch
        {
            TaskSortOption.Alphabetical when normalizedSortDirection == TaskSortDirection.Desc
                => query.OrderByDescending(t => t.Description).ThenByDescending(t => t.CreatedDateUtc),
            TaskSortOption.Alphabetical
                => query.OrderBy(t => t.Description).ThenByDescending(t => t.CreatedDateUtc),
            TaskSortOption.DueDate when normalizedSortDirection == TaskSortDirection.Desc
                => query.OrderByDescending(t => t.DueDate.HasValue)
                    .ThenByDescending(t => t.DueDate)
                    .ThenByDescending(t => t.CreatedDateUtc),
            TaskSortOption.DueDate
                => query.OrderByDescending(t => t.DueDate.HasValue)
                    .ThenBy(t => t.DueDate)
                    .ThenByDescending(t => t.CreatedDateUtc),
            _ when normalizedSortDirection == TaskSortDirection.Desc
                => query.OrderByDescending(t => t.CreatedDateUtc).ThenBy(t => t.Description),
            _
                => query.OrderBy(t => t.CreatedDateUtc).ThenBy(t => t.Description)
        };

        var tasks = await sortedQuery
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .Select(t => new TaskResponse
            {
                Id = t.Id,
                Description = t.Description,
                DueDate = t.DueDate,
                IsCompleted = t.IsCompleted,
                OwnerId = t.OwnerId,
                CreatedDateUtc = t.CreatedDateUtc,
                UpdatedDateUtc = t.UpdatedDateUtc
            })
            .ToListAsync(cancellationToken);

        var totalPages = totalCount == 0
            ? 0
            : (int)Math.Ceiling(totalCount / (double)normalizedPageSize);

        return ServiceResult<PagedResponse<TaskResponse>>.Success(new PagedResponse<TaskResponse>
        {
            Items = tasks,
            Page = normalizedPage,
            PageSize = normalizedPageSize,
            TotalCount = totalCount,
            TotalPages = totalPages
        });
    }

    public async Task<ServiceResult<TaskResponse>> CreateTaskAsync(Guid userId, CreateTaskRequest request, CancellationToken cancellationToken)
    {
        var nowUtc = _dateTimeService.UtcNow;

        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
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
            && request.DueDate.Value < DateOnly.FromDateTime(nowUtc))
        {
            return ServiceResult<TaskResponse>.Failure(StatusCodes.Status400BadRequest, "Due date cannot be changed to a past date.");
        }

        // This is only needed for SQL Lite. SQL Server Temporal Tables would handle this automatically.
        AddHistory(task, nowUtc, "UPDATE");

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
        Description = task.Description,
        DueDate = task.DueDate,
        IsCompleted = task.IsCompleted,
        OwnerId = task.OwnerId,
        CreatedDateUtc = task.CreatedDateUtc,
        UpdatedDateUtc = task.UpdatedDateUtc
    };

    private static bool IsDueDateChanged(DateOnly? existingDueDate, DateOnly? requestedDueDate)
    {
        if (!existingDueDate.HasValue && !requestedDueDate.HasValue)
        {
            return false;
        }

        if (!existingDueDate.HasValue || !requestedDueDate.HasValue)
        {
            return true;
        }

        return existingDueDate.Value != requestedDueDate.Value;
    }

    private static TaskFilterStatus? ParseStatus(string? value)
    {
        var normalized = NormalizeKey(value);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return TaskFilterStatus.All;
        }

        return normalized switch
        {
            "open" => TaskFilterStatus.Open,
            "completed" => TaskFilterStatus.Completed,
            "overdue" => TaskFilterStatus.Overdue,
            "all" => TaskFilterStatus.All,
            _ => null
        };
    }

    private static TaskSortOption? ParseSort(string? value)
    {
        var normalized = NormalizeKey(value);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return TaskSortOption.RecentlyAdded;
        }

        return normalized switch
        {
            "alphabetical" => TaskSortOption.Alphabetical,
            "duedate" => TaskSortOption.DueDate,
            "recentlyadded" => TaskSortOption.RecentlyAdded,
            _ => null
        };
    }

    private static TaskSortDirection? ParseSortDirection(string? value)
    {
        var normalized = NormalizeKey(value);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return TaskSortDirection.Asc;
        }

        return normalized switch
        {
            "asc" => TaskSortDirection.Asc,
            "desc" => TaskSortDirection.Desc,
            _ => null
        };
    }

    private static string NormalizeKey(string? value) => (value ?? string.Empty)
        .Trim()
        .Replace("_", string.Empty)
        .Replace("-", string.Empty)
        .ToLowerInvariant();

    private void AddHistory(TaskItem task, DateTime validToUtc, string operation)
    {
        var validFromUtc = task.UpdatedDateUtc == default
            ? task.CreatedDateUtc
            : task.UpdatedDateUtc;

        _dbContext.TaskHistory.Add(new TaskItemHistory
        {
            Id = Guid.NewGuid(),
            TaskId = task.Id,
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
