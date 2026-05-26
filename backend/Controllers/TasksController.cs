using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToDoManagement.Api.Data;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Models;
using ToDoManagement.Api.Services;

namespace ToDoManagement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/tasks")]
public sealed class TasksController : ControllerBase
{
        private const string StatusOpen = "open";
        private const string StatusCompleted = "completed";
        private const string StatusAll = "all";

    private readonly AppDbContext _dbContext;
    private readonly IDateTimeService _dateTimeService;

    public TasksController(AppDbContext dbContext, IDateTimeService dateTimeService)
    {
        _dbContext = dbContext;
        _dateTimeService = dateTimeService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<TaskResponse>>> GetTasks(
        [FromQuery] string? search,
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "User context is missing from token." });
        }

        var normalizedStatus = (status ?? StatusAll).Trim().ToLowerInvariant();
        if (normalizedStatus is not StatusOpen and not StatusCompleted and not StatusAll)
        {
            return BadRequest(new { message = "Invalid status filter. Use open, completed, or all." });
        }

        var query = _dbContext.Tasks
            .Where(t => t.OwnerId == userId.Value);

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

        return Ok(tasks);
    }

    [HttpPost]
    public async Task<ActionResult<TaskResponse>> CreateTask(CreateTaskRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "User context is missing from token." });
        }

        var nowUtc = _dateTimeService.UtcNow;

        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            DueDate = request.DueDate,
            IsCompleted = false,
            OwnerId = userId.Value,
            CreatedDateUtc = nowUtc,
            UpdatedDateUtc = nowUtc
        };

        _dbContext.Tasks.Add(task);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var response = Map(task);
        return CreatedAtAction(nameof(GetTasks), new { id = task.Id }, response);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TaskResponse>> UpdateTask(Guid id, UpdateTaskRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "User context is missing from token." });
        }

        var task = await _dbContext.Tasks.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (task is null)
        {
            return NotFound(new { message = "Task not found." });
        }

        if (task.OwnerId != userId.Value)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only the owner can update this task." });
        }

        var nowUtc = _dateTimeService.UtcNow;
        if (IsDueDateChanged(task.DueDate, request.DueDate)
            && request.DueDate.HasValue
            && request.DueDate.Value.Date < nowUtc.Date)
        {
            return BadRequest(new { message = "Due date cannot be changed to a past date." });
        }

        AddHistory(task, nowUtc, "UPDATE");

        task.Title = request.Title.Trim();
        task.Description = request.Description.Trim();
        task.DueDate = request.DueDate;
        task.IsCompleted = request.IsCompleted;
        task.UpdatedDateUtc = nowUtc;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(Map(task));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTask(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "User context is missing from token." });
        }

        var task = await _dbContext.Tasks.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (task is null)
        {
            return NotFound(new { message = "Task not found." });
        }

        if (task.OwnerId != userId.Value)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only the owner can delete this task." });
        }

        AddHistory(task, _dateTimeService.UtcNow, "DELETE");
        _dbContext.Tasks.Remove(task);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private Guid? GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out var parsedId) ? parsedId : null;
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
