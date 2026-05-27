using System.Security.Claims;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using ToDoManagement.Api.Controllers;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Services;
using ToDoManagement.Api.Services.Interfaces;
using Xunit;

namespace ToDoManagement.Api.Tests.Controllers;

public sealed class TasksControllerTests
{
    private readonly Mock<ITaskService> _taskServiceMock;

    public TasksControllerTests()
    {
        _taskServiceMock = new Mock<ITaskService>();
    }

    [Fact]
    public async Task GetTasks_Should_ReturnUnauthorized_WhenUserClaimIsMissing()
    {
        // ARRANGE
        var controller = CreateController();

        // ACT
        var result = await controller.GetTasks("task", "open", "alphabetical", "desc", 2, 25, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
        _taskServiceMock.Verify(
            x => x.GetTasksAsync(
                It.IsAny<Guid>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<int?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetTasks_Should_ForwardFilteringSortingAndPaging_WhenServiceSucceeds()
    {
        // ARRANGE
        var userId = Guid.NewGuid();
        var expectedResponse = new PagedResponse<TaskResponse>
        {
            Items =
            [
                new TaskResponse
                {
                    Id = Guid.NewGuid(),
                    Description = "Task",
                    IsCompleted = false,
                    OwnerId = userId,
                    CreatedDateUtc = DateTime.UtcNow,
                    UpdatedDateUtc = DateTime.UtcNow
                }
            ],
            Page = 2,
            PageSize = 25,
            TotalCount = 30,
            TotalPages = 2
        };

        _taskServiceMock
            .Setup(x => x.GetTasksAsync(
                userId,
                "alpha",
                "open",
                "alphabetical",
                "desc",
                2,
                25,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceResult<PagedResponse<TaskResponse>>.Success(expectedResponse));

        var controller = CreateController(userId);

        // ACT
        var result = await controller.GetTasks("alpha", "open", "alphabetical", "desc", 2, 25, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeEquivalentTo(expectedResponse);
    }

    [Fact]
    public async Task GetTasks_Should_ReturnBadRequest_WhenServiceReturns400()
    {
        // ARRANGE
        var userId = Guid.NewGuid();

        _taskServiceMock
            .Setup(x => x.GetTasksAsync(
                userId,
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<int?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceResult<PagedResponse<TaskResponse>>.Failure(400, "Invalid sortDirection. Use asc or desc."));

        var controller = CreateController(userId);

        // ACT
        var result = await controller.GetTasks(null, "all", "alphabetical", "sideways", 1, 25, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        var badRequest = result.Result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task CreateTask_Should_ReturnCreatedStatusCode_WithCreatedTaskPayload()
    {
        // ARRANGE
        var userId = Guid.NewGuid();
        var response = new TaskResponse
        {
            Id = Guid.NewGuid(),
            Description = "New task",
            IsCompleted = false,
            OwnerId = userId,
            CreatedDateUtc = DateTime.UtcNow,
            UpdatedDateUtc = DateTime.UtcNow
        };

        _taskServiceMock
            .Setup(x => x.CreateTaskAsync(
                userId,
                It.IsAny<CreateTaskRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceResult<TaskResponse>.Success(response, StatusCodes.Status201Created));

        var controller = CreateController(userId);

        // ACT
        var result = await controller.CreateTask(new CreateTaskRequest
        {
            Description = "New task"
        }, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        var createdResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        createdResult.StatusCode.Should().Be(StatusCodes.Status201Created);
        createdResult.Value.Should().BeEquivalentTo(response);
    }

    private TasksController CreateController(Guid? userId = null)
    {
        var controller = new TasksController(_taskServiceMock.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = userId.HasValue
                        ? new ClaimsPrincipal(new ClaimsIdentity(new[]
                        {
                            new Claim(ClaimTypes.NameIdentifier, userId.Value.ToString())
                        }, "TestAuth"))
                        : new ClaimsPrincipal(new ClaimsIdentity())
                }
            }
        };

        return controller;
    }
}
