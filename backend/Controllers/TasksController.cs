using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Services.Interfaces;

namespace ToDoManagement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/tasks")]
public sealed class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponse<TaskResponse>>> GetTasks(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? sort,
        [FromQuery] string? sortDirection,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "User context is missing from token." });
        }

        var result = await _taskService.GetTasksAsync(userId.Value, search, status, sort, sortDirection, page, pageSize, cancellationToken);
        if (!result.IsSuccess)
        {
            return ToErrorResult(result.StatusCode, result.Message);
        }

        return Ok(result.Value);
    }

    [HttpPost]
    public async Task<ActionResult<TaskResponse>> CreateTask(CreateTaskRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "User context is missing from token." });
        }

        var result = await _taskService.CreateTaskAsync(userId.Value, request, cancellationToken);
        if (!result.IsSuccess)
        {
            return ToErrorResult(result.StatusCode, result.Message);
        }

        return CreatedAtAction(nameof(GetTasks), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TaskResponse>> UpdateTask(Guid id, UpdateTaskRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "User context is missing from token." });
        }

        var result = await _taskService.UpdateTaskAsync(userId.Value, id, request, cancellationToken);
        if (!result.IsSuccess)
        {
            return ToErrorResult(result.StatusCode, result.Message);
        }

        return Ok(result.Value);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTask(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "User context is missing from token." });
        }

        var result = await _taskService.DeleteTaskAsync(userId.Value, id, cancellationToken);
        return result.StatusCode == StatusCodes.Status204NoContent
            ? NoContent()
            : ToErrorResult(result.StatusCode, result.Message);
    }

    private Guid? GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out var parsedId) ? parsedId : null;
    }

    private ActionResult ToErrorResult(int statusCode, string? message)
    {
        return statusCode switch
        {
            StatusCodes.Status400BadRequest => BadRequest(new { message }),
            StatusCodes.Status401Unauthorized => Unauthorized(new { message }),
            StatusCodes.Status404NotFound => NotFound(new { message }),
            _ => StatusCode(statusCode, new { message })
        };
    }
}
