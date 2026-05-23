using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToDoManagement.Api.Data;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Models;

namespace ToDoManagement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/tasks")]
public sealed class TasksController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public TasksController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<TaskResponse>>> GetTasks(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "User context is missing from token." });
        }

        var tasks = await _dbContext.Tasks
            .Where(t => t.OwnerId == userId.Value || t.AssignedToId == userId.Value)
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
                AssignedToId = t.AssignedToId
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

        var assignedToId = request.AssignedToId ?? userId.Value;
        var assigneeExists = await _dbContext.Users.AnyAsync(u => u.Id == assignedToId, cancellationToken);
        if (!assigneeExists)
        {
            return BadRequest(new { message = "Assigned user does not exist." });
        }

        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            DueDate = request.DueDate,
            IsCompleted = false,
            OwnerId = userId.Value,
            AssignedToId = assignedToId
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

        if (request.AssignedToId.HasValue)
        {
            var assigneeExists = await _dbContext.Users.AnyAsync(u => u.Id == request.AssignedToId.Value, cancellationToken);
            if (!assigneeExists)
            {
                return BadRequest(new { message = "Assigned user does not exist." });
            }
        }

        task.Title = request.Title.Trim();
        task.Description = request.Description.Trim();
        task.DueDate = request.DueDate;
        task.IsCompleted = request.IsCompleted;
        task.AssignedToId = request.AssignedToId;

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
        AssignedToId = task.AssignedToId
    };
}
