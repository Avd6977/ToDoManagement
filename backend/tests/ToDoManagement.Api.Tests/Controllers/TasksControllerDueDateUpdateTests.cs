using System.Security.Claims;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using ToDoManagement.Api.Controllers;
using ToDoManagement.Api.Data;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Models;
using ToDoManagement.Api.Services;
using ToDoManagement.Api.Services.Interfaces;
using Xunit;

namespace ToDoManagement.Api.Tests.Controllers;

public sealed class TasksControllerDueDateUpdateTests
{
    private static readonly DateTime FixedNowUtc = new(2026, 5, 25, 12, 0, 0, DateTimeKind.Utc);
    private readonly Mock<IDateTimeService> _dateTimeServiceMock;

    public TasksControllerDueDateUpdateTests()
    {
        _dateTimeServiceMock = new Mock<IDateTimeService>();
        _dateTimeServiceMock.SetupGet(x => x.UtcNow).Returns(FixedNowUtc);
    }

    [Fact]
    public async Task UpdateTask_Should_AllowUpdate_WhenPastDueDateIsUnchanged()
    {
        // ARRANGE
        using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var dbContext = new AppDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();

        var ownerId = Guid.NewGuid();
        var taskId = Guid.NewGuid();
        var originalPastDueDate = DateOnly.FromDateTime(FixedNowUtc).AddDays(-2);

        dbContext.Users.Add(new User
        {
            Id = ownerId,
            FullName = "Test User",
            Username = "test-user-1",
            PasswordHash = "hash"
        });
        await dbContext.SaveChangesAsync();

        dbContext.Tasks.Add(new TaskItem
        {
            Id = taskId,
            Description = "Original description",
            DueDate = originalPastDueDate,
            IsCompleted = false,
            OwnerId = ownerId,
            CreatedDateUtc = FixedNowUtc.AddDays(-5),
            UpdatedDateUtc = FixedNowUtc.AddDays(-1)
        });
        await dbContext.SaveChangesAsync();

        var controller = CreateController(dbContext, ownerId);
        var request = new UpdateTaskRequest
        {
            Description = "Updated description",
            DueDate = originalPastDueDate,
            IsCompleted = false
        };

        // ACT
        var result = await controller.UpdateTask(taskId, request, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.Result.Should().BeOfType<OkObjectResult>();

        var updatedTask = await dbContext.Tasks.SingleAsync(t => t.Id == taskId);
        updatedTask.Description.Should().Be("Updated description");
        updatedTask.DueDate.Should().Be(originalPastDueDate);
    }

    [Fact]
    public async Task UpdateTask_Should_RejectUpdate_WhenDueDateIsChangedToPast()
    {
        // ARRANGE
        using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var dbContext = new AppDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();

        var ownerId = Guid.NewGuid();
        var taskId = Guid.NewGuid();

        dbContext.Users.Add(new User
        {
            Id = ownerId,
            FullName = "Test User",
            Username = "test-user-2",
            PasswordHash = "hash"
        });
        await dbContext.SaveChangesAsync();

        dbContext.Tasks.Add(new TaskItem
        {
            Id = taskId,
            Description = "Original description",
            DueDate = null,
            IsCompleted = false,
            OwnerId = ownerId,
            CreatedDateUtc = FixedNowUtc.AddDays(-5),
            UpdatedDateUtc = FixedNowUtc.AddDays(-1)
        });
        await dbContext.SaveChangesAsync();

        var controller = CreateController(dbContext, ownerId);
        var request = new UpdateTaskRequest
        {
            Description = "Updated description",
            DueDate = DateOnly.FromDateTime(FixedNowUtc).AddDays(-1),
            IsCompleted = false
        };

        // ACT
        var result = await controller.UpdateTask(taskId, request, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.Result.Should().BeOfType<BadRequestObjectResult>();

        var unchangedTask = await dbContext.Tasks.SingleAsync(t => t.Id == taskId);
        unchangedTask.DueDate.Should().BeNull();
    }

    [Fact]
    public async Task UpdateTask_Should_AllowUpdate_WhenDueDateIsChangedToFuture()
    {
        // ARRANGE
        using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var dbContext = new AppDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();

        var ownerId = Guid.NewGuid();
        var taskId = Guid.NewGuid();
        var futureDueDate = DateOnly.FromDateTime(FixedNowUtc).AddDays(2);

        dbContext.Users.Add(new User
        {
            Id = ownerId,
            FullName = "Test User",
            Username = "test-user-3",
            PasswordHash = "hash"
        });
        await dbContext.SaveChangesAsync();

        dbContext.Tasks.Add(new TaskItem
        {
            Id = taskId,
            Description = "Original description",
            DueDate = null,
            IsCompleted = false,
            OwnerId = ownerId,
            CreatedDateUtc = FixedNowUtc.AddDays(-5),
            UpdatedDateUtc = FixedNowUtc.AddDays(-1)
        });
        await dbContext.SaveChangesAsync();

        var controller = CreateController(dbContext, ownerId);
        var request = new UpdateTaskRequest
        {
            Description = "Updated description",
            DueDate = futureDueDate,
            IsCompleted = false
        };

        // ACT
        var result = await controller.UpdateTask(taskId, request, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.Result.Should().BeOfType<OkObjectResult>();

        var updatedTask = await dbContext.Tasks.SingleAsync(t => t.Id == taskId);
        updatedTask.DueDate.Should().Be(futureDueDate);
    }

    private TasksController CreateController(AppDbContext dbContext, Guid userId)
    {
        var taskService = new TaskService(dbContext, _dateTimeServiceMock.Object);
        var controller = new TasksController(taskService);
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }, "TestAuth");

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(identity)
            }
        };

        return controller;
    }
}

