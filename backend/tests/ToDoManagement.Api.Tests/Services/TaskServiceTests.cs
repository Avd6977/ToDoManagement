using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using ToDoManagement.Api.Data;
using ToDoManagement.Api.Models;
using ToDoManagement.Api.Services;
using ToDoManagement.Api.Services.Interfaces;
using Xunit;

namespace ToDoManagement.Api.Tests.Services;

public sealed class TaskServiceTests
{
    private static readonly DateTime FixedNowUtc = new(2026, 5, 26, 12, 0, 0, DateTimeKind.Utc);
    private readonly Mock<IDateTimeService> _dateTimeServiceMock;

    public TaskServiceTests()
    {
        _dateTimeServiceMock = new Mock<IDateTimeService>();
        _dateTimeServiceMock.SetupGet(x => x.UtcNow).Returns(FixedNowUtc);
    }

    [Fact]
    public async Task GetTasksAsync_Should_ReturnBadRequest_WhenStatusFilterInvalid()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var service = new TaskService(dbContext, _dateTimeServiceMock.Object);

        // ACT
        var result = await service.GetTasksAsync(Guid.NewGuid(), null, "invalid", null, null, null, null, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(400);
        result.Message.Should().Be("Invalid status filter. Use open, completed, overdue, or all.");
    }

    [Fact]
    public async Task GetTasksAsync_Should_ReturnBadRequest_WhenSortIsInvalid()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var service = new TaskService(dbContext, _dateTimeServiceMock.Object);

        // ACT
        var result = await service.GetTasksAsync(Guid.NewGuid(), null, "all", "priority", null, null, null, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(400);
        result.Message.Should().Be("Invalid sort option. Use alphabetical, dueDate, or recentlyAdded.");
    }

    [Fact]
    public async Task GetTasksAsync_Should_ReturnBadRequest_WhenSortDirectionIsInvalid()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var service = new TaskService(dbContext, _dateTimeServiceMock.Object);

        // ACT
        var result = await service.GetTasksAsync(Guid.NewGuid(), null, "all", "alphabetical", "sideways", null, null, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(400);
        result.Message.Should().Be("Invalid sortDirection. Use asc or desc.");
    }

    [Fact]
    public async Task GetTasksAsync_Should_ReturnBadRequest_WhenPageIsLessThanOne()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var service = new TaskService(dbContext, _dateTimeServiceMock.Object);

        // ACT
        var result = await service.GetTasksAsync(Guid.NewGuid(), null, "all", null, null, 0, null, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(400);
        result.Message.Should().Be("Page must be greater than or equal to 1.");
    }

    [Fact]
    public async Task GetTasksAsync_Should_ReturnBadRequest_WhenPageSizeIsNotAllowed()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var service = new TaskService(dbContext, _dateTimeServiceMock.Object);

        // ACT
        var result = await service.GetTasksAsync(Guid.NewGuid(), null, "all", null, null, 1, 10, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(400);
        result.Message.Should().Be("Invalid page size. Allowed values are 25, 50, or 100.");
    }

    [Fact]
    public async Task DeleteTaskAsync_Should_RemoveTask_AndWriteDeleteHistory()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var userId = Guid.NewGuid();
        var taskId = Guid.NewGuid();

        dbContext.Users.Add(new User
        {
            Id = userId,
            FullName = "Delete User",
            Username = "delete-user",
            PasswordHash = "hash"
        });

        dbContext.Tasks.Add(new TaskItem
        {
            Id = taskId,
            Description = "To delete",
            OwnerId = userId,
            IsCompleted = false,
            CreatedDateUtc = FixedNowUtc.AddDays(-2),
            UpdatedDateUtc = FixedNowUtc.AddDays(-1)
        });

        await dbContext.SaveChangesAsync();

        var service = new TaskService(dbContext, _dateTimeServiceMock.Object);

        // ACT
        var result = await service.DeleteTaskAsync(userId, taskId, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.StatusCode.Should().Be(204);
        (await dbContext.Tasks.AnyAsync(t => t.Id == taskId)).Should().BeFalse();

        var history = await dbContext.TaskHistory.SingleAsync(h => h.TaskId == taskId);
        history.Operation.Should().Be("DELETE");
        history.ValidToUtc.Should().Be(FixedNowUtc);
    }

    [Fact]
    public async Task UpdateTaskAsync_Should_ReturnForbidden_WhenUserDoesNotOwnTask()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var ownerId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var taskId = Guid.NewGuid();

        dbContext.Users.AddRange(
            new User
            {
                Id = ownerId,
                FullName = "Owner User",
                Username = "owner-user-update",
                PasswordHash = "hash"
            },
            new User
            {
                Id = otherUserId,
                FullName = "Other User",
                Username = "other-user-update",
                PasswordHash = "hash"
            });

        dbContext.Tasks.Add(new TaskItem
        {
            Id = taskId,
            Description = "Existing task",
            OwnerId = ownerId,
            IsCompleted = false,
            CreatedDateUtc = FixedNowUtc.AddDays(-2),
            UpdatedDateUtc = FixedNowUtc.AddDays(-1)
        });

        await dbContext.SaveChangesAsync();
        var service = new TaskService(dbContext, _dateTimeServiceMock.Object);

        // ACT
        var result = await service.UpdateTaskAsync(otherUserId, taskId, new ToDoManagement.Api.Dtos.UpdateTaskRequest
        {
            Description = "Changed",
            DueDate = DateOnly.FromDateTime(FixedNowUtc).AddDays(1),
            IsCompleted = false
        }, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(403);
        result.Message.Should().Be("Only the owner can update this task.");
    }

    [Fact]
    public async Task UpdateTaskAsync_Should_RejectDescriptionChange_WhenTaskIsCompleted()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var userId = Guid.NewGuid();
        var taskId = Guid.NewGuid();
        var dueDate = DateOnly.FromDateTime(FixedNowUtc).AddDays(3);

        dbContext.Users.Add(new User
        {
            Id = userId,
            FullName = "Completed User",
            Username = "completed-user-description",
            PasswordHash = "hash"
        });

        dbContext.Tasks.Add(new TaskItem
        {
            Id = taskId,
            Description = "Completed task",
            DueDate = dueDate,
            OwnerId = userId,
            IsCompleted = true,
            CreatedDateUtc = FixedNowUtc.AddDays(-2),
            UpdatedDateUtc = FixedNowUtc.AddDays(-1)
        });

        await dbContext.SaveChangesAsync();
        var service = new TaskService(dbContext, _dateTimeServiceMock.Object);

        var request = new ToDoManagement.Api.Dtos.UpdateTaskRequest
        {
            Description = "Changed description",
            DueDate = dueDate,
            IsCompleted = true
        };

        // ACT
        var result = await service.UpdateTaskAsync(userId, taskId, request, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(400);
        result.Message.Should().Be("Completed tasks can only update IsCompleted.");

        var unchangedTask = await dbContext.Tasks.SingleAsync(t => t.Id == taskId);
        unchangedTask.Description.Should().Be("Completed task");
        unchangedTask.DueDate.Should().Be(dueDate);
        unchangedTask.IsCompleted.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateTaskAsync_Should_RejectDueDateChange_WhenTaskIsCompleted()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var userId = Guid.NewGuid();
        var taskId = Guid.NewGuid();
        var dueDate = DateOnly.FromDateTime(FixedNowUtc).AddDays(3);
        var updatedDueDate = DateOnly.FromDateTime(FixedNowUtc).AddDays(5);

        dbContext.Users.Add(new User
        {
            Id = userId,
            FullName = "Completed User",
            Username = "completed-user-due-date",
            PasswordHash = "hash"
        });

        dbContext.Tasks.Add(new TaskItem
        {
            Id = taskId,
            Description = "Completed task",
            DueDate = dueDate,
            OwnerId = userId,
            IsCompleted = true,
            CreatedDateUtc = FixedNowUtc.AddDays(-2),
            UpdatedDateUtc = FixedNowUtc.AddDays(-1)
        });

        await dbContext.SaveChangesAsync();
        var service = new TaskService(dbContext, _dateTimeServiceMock.Object);

        var request = new ToDoManagement.Api.Dtos.UpdateTaskRequest
        {
            Description = "Completed task",
            DueDate = updatedDueDate,
            IsCompleted = true
        };

        // ACT
        var result = await service.UpdateTaskAsync(userId, taskId, request, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(400);
        result.Message.Should().Be("Completed tasks can only update IsCompleted.");

        var unchangedTask = await dbContext.Tasks.SingleAsync(t => t.Id == taskId);
        unchangedTask.Description.Should().Be("Completed task");
        unchangedTask.DueDate.Should().Be(dueDate);
        unchangedTask.IsCompleted.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateTaskAsync_Should_AllowIsCompletedToggle_WhenTaskIsCompleted_AndContentUnchanged()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var userId = Guid.NewGuid();
        var taskId = Guid.NewGuid();
        var dueDate = DateOnly.FromDateTime(FixedNowUtc).AddDays(3);

        dbContext.Users.Add(new User
        {
            Id = userId,
            FullName = "Completed User",
            Username = "completed-user-toggle",
            PasswordHash = "hash"
        });

        dbContext.Tasks.Add(new TaskItem
        {
            Id = taskId,
            Description = "Completed task",
            DueDate = dueDate,
            OwnerId = userId,
            IsCompleted = true,
            CreatedDateUtc = FixedNowUtc.AddDays(-2),
            UpdatedDateUtc = FixedNowUtc.AddDays(-1)
        });

        await dbContext.SaveChangesAsync();
        var service = new TaskService(dbContext, _dateTimeServiceMock.Object);

        var request = new ToDoManagement.Api.Dtos.UpdateTaskRequest
        {
            Description = "Completed task",
            DueDate = dueDate,
            IsCompleted = false
        };

        // ACT
        var result = await service.UpdateTaskAsync(userId, taskId, request, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeTrue();
        result.StatusCode.Should().Be(200);
        result.Value.Should().NotBeNull();
        result.Value!.IsCompleted.Should().BeFalse();
        result.Value.Description.Should().Be("Completed task");
        result.Value.DueDate.Should().Be(dueDate);
    }

    [Fact]
    public async Task DeleteTaskAsync_Should_ReturnForbidden_WhenUserDoesNotOwnTask()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var ownerId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var taskId = Guid.NewGuid();

        dbContext.Users.AddRange(
            new User
            {
                Id = ownerId,
                FullName = "Owner User",
                Username = "owner-user-delete",
                PasswordHash = "hash"
            },
            new User
            {
                Id = otherUserId,
                FullName = "Other User",
                Username = "other-user-delete",
                PasswordHash = "hash"
            });

        dbContext.Tasks.Add(new TaskItem
        {
            Id = taskId,
            Description = "Delete task",
            OwnerId = ownerId,
            IsCompleted = false,
            CreatedDateUtc = FixedNowUtc.AddDays(-2),
            UpdatedDateUtc = FixedNowUtc.AddDays(-1)
        });

        await dbContext.SaveChangesAsync();
        var service = new TaskService(dbContext, _dateTimeServiceMock.Object);

        // ACT
        var result = await service.DeleteTaskAsync(otherUserId, taskId, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(403);
        result.Message.Should().Be("Only the owner can delete this task.");
    }

    [Fact]
    public async Task GetTasksAsync_Should_NotReturnTasksOwnedByDifferentUser()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var ownTaskId = Guid.NewGuid();
        var otherUserTaskId = Guid.NewGuid();

        dbContext.Users.AddRange(
            new User
            {
                Id = userId,
                FullName = "Owner User",
                Username = "owner-user",
                PasswordHash = "hash"
            },
            new User
            {
                Id = otherUserId,
                FullName = "Other User",
                Username = "other-user",
                PasswordHash = "hash"
            });

        dbContext.Tasks.AddRange(
            new TaskItem
            {
                Id = ownTaskId,
                Description = "Visible to owner",
                OwnerId = userId,
                IsCompleted = false,
                CreatedDateUtc = FixedNowUtc.AddDays(-2),
                UpdatedDateUtc = FixedNowUtc.AddDays(-1)
            },
            new TaskItem
            {
                Id = otherUserTaskId,
                Description = "Must not be visible",
                OwnerId = otherUserId,
                IsCompleted = false,
                CreatedDateUtc = FixedNowUtc.AddDays(-2),
                UpdatedDateUtc = FixedNowUtc.AddDays(-1)
            });

        await dbContext.SaveChangesAsync();
        var service = new TaskService(dbContext, _dateTimeServiceMock.Object);

        // ACT
        var result = await service.GetTasksAsync(userId, null, "all", null, null, 1, 25, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeTrue();
        result.StatusCode.Should().Be(200);
        result.Value.Should().NotBeNull();
        result.Value!.Items.Should().HaveCount(1);
        result.Value.Items.Single().Id.Should().Be(ownTaskId);
        result.Value.Items.Should().NotContain(t => t.Id == otherUserTaskId);
        result.Value.Items.Should().NotContain(t => t.OwnerId == otherUserId);
        result.Value.Page.Should().Be(1);
        result.Value.PageSize.Should().Be(25);
        result.Value.TotalCount.Should().Be(1);
        result.Value.TotalPages.Should().Be(1);
    }

    [Fact]
    public async Task GetTasksAsync_Should_ReturnPaginationMetadata_AndRequestedPageItems()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var userId = Guid.NewGuid();

        dbContext.Users.Add(new User
        {
            Id = userId,
            FullName = "Paged User",
            Username = "paged-user",
            PasswordHash = "hash"
        });

        var now = FixedNowUtc;
        for (var index = 1; index <= 30; index++)
        {
            dbContext.Tasks.Add(new TaskItem
            {
                Id = Guid.NewGuid(),
                Description = $"Paged task {index}",
                OwnerId = userId,
                IsCompleted = false,
                CreatedDateUtc = now.AddMinutes(-index),
                UpdatedDateUtc = now.AddMinutes(-index),
                DueDate = DateOnly.FromDateTime(now).AddDays(index)
            });
        }

        await dbContext.SaveChangesAsync();
        var service = new TaskService(dbContext, _dateTimeServiceMock.Object);

        // ACT
        var result = await service.GetTasksAsync(userId, null, "open", null, null, 2, 25, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeTrue();
        result.StatusCode.Should().Be(200);
        result.Value.Should().NotBeNull();
        result.Value!.Page.Should().Be(2);
        result.Value.PageSize.Should().Be(25);
        result.Value.TotalCount.Should().Be(30);
        result.Value.TotalPages.Should().Be(2);
        result.Value.Items.Should().HaveCount(5);
    }

    [Fact]
    public async Task GetTasksAsync_Should_SortAlphabetically_WhenRequested()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var userId = Guid.NewGuid();

        dbContext.Users.Add(new User
        {
            Id = userId,
            FullName = "Sort User",
            Username = "sort-user",
            PasswordHash = "hash"
        });

        dbContext.Tasks.AddRange(
            new TaskItem
            {
                Id = Guid.NewGuid(),
                Description = "Zulu task",
                OwnerId = userId,
                IsCompleted = false,
                CreatedDateUtc = FixedNowUtc.AddMinutes(-1),
                UpdatedDateUtc = FixedNowUtc.AddMinutes(-1)
            },
            new TaskItem
            {
                Id = Guid.NewGuid(),
                Description = "Alpha task",
                OwnerId = userId,
                IsCompleted = false,
                CreatedDateUtc = FixedNowUtc.AddMinutes(-2),
                UpdatedDateUtc = FixedNowUtc.AddMinutes(-2)
            });

        await dbContext.SaveChangesAsync();
        var service = new TaskService(dbContext, _dateTimeServiceMock.Object);

        // ACT
        var result = await service.GetTasksAsync(userId, null, "open", "alphabetical", "asc", 1, 25, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Items.Select(x => x.Description).Should().ContainInOrder("Alpha task", "Zulu task");
    }

    [Fact]
    public async Task GetTasksAsync_Should_SortByRecentlyAddedDescending_WhenRequested()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var userId = Guid.NewGuid();

        dbContext.Users.Add(new User
        {
            Id = userId,
            FullName = "Sort User",
            Username = "sort-user-2",
            PasswordHash = "hash"
        });

        var olderTaskId = Guid.NewGuid();
        var newerTaskId = Guid.NewGuid();

        dbContext.Tasks.AddRange(
            new TaskItem
            {
                Id = olderTaskId,
                Description = "Older task",
                OwnerId = userId,
                IsCompleted = false,
                CreatedDateUtc = FixedNowUtc.AddDays(-2),
                UpdatedDateUtc = FixedNowUtc.AddDays(-2)
            },
            new TaskItem
            {
                Id = newerTaskId,
                Description = "Newer task",
                OwnerId = userId,
                IsCompleted = false,
                CreatedDateUtc = FixedNowUtc,
                UpdatedDateUtc = FixedNowUtc
            });

        await dbContext.SaveChangesAsync();
        var service = new TaskService(dbContext, _dateTimeServiceMock.Object);

        // ACT
        var result = await service.GetTasksAsync(userId, null, "open", "recentlyAdded", "desc", 1, 25, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Items.Select(x => x.Id).Should().ContainInOrder(newerTaskId, olderTaskId);
    }

    [Fact]
    public async Task GetTasksAsync_Should_SortAlphabeticallyDescending_WhenRequested()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var userId = Guid.NewGuid();

        dbContext.Users.Add(new User
        {
            Id = userId,
            FullName = "Sort Desc User",
            Username = "sort-desc-user",
            PasswordHash = "hash"
        });

        dbContext.Tasks.AddRange(
            new TaskItem
            {
                Id = Guid.NewGuid(),
                Description = "Alpha task",
                OwnerId = userId,
                IsCompleted = false,
                CreatedDateUtc = FixedNowUtc,
                UpdatedDateUtc = FixedNowUtc
            },
            new TaskItem
            {
                Id = Guid.NewGuid(),
                Description = "Zulu task",
                OwnerId = userId,
                IsCompleted = false,
                CreatedDateUtc = FixedNowUtc.AddMinutes(-1),
                UpdatedDateUtc = FixedNowUtc.AddMinutes(-1)
            });

        await dbContext.SaveChangesAsync();
        var service = new TaskService(dbContext, _dateTimeServiceMock.Object);

        // ACT
        var result = await service.GetTasksAsync(userId, null, "open", "alphabetical", "desc", 1, 25, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Items.Select(x => x.Description).Should().ContainInOrder("Zulu task", "Alpha task");
    }

    [Fact]
    public async Task GetTasksAsync_Should_FilterOnlyOverdueTasks_WhenRequested()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var userId = Guid.NewGuid();

        dbContext.Users.Add(new User
        {
            Id = userId,
            FullName = "Overdue User",
            Username = "overdue-user",
            PasswordHash = "hash"
        });

        dbContext.Tasks.AddRange(
            new TaskItem
            {
                Id = Guid.NewGuid(),
                Description = "Should be included",
                OwnerId = userId,
                IsCompleted = false,
                DueDate = DateOnly.FromDateTime(FixedNowUtc).AddDays(-1),
                CreatedDateUtc = FixedNowUtc.AddDays(-3),
                UpdatedDateUtc = FixedNowUtc.AddDays(-3)
            },
            new TaskItem
            {
                Id = Guid.NewGuid(),
                Description = "Should be excluded",
                OwnerId = userId,
                IsCompleted = false,
                DueDate = DateOnly.FromDateTime(FixedNowUtc).AddDays(2),
                CreatedDateUtc = FixedNowUtc.AddDays(-2),
                UpdatedDateUtc = FixedNowUtc.AddDays(-2)
            },
            new TaskItem
            {
                Id = Guid.NewGuid(),
                Description = "Should be excluded",
                OwnerId = userId,
                IsCompleted = true,
                DueDate = DateOnly.FromDateTime(FixedNowUtc).AddDays(-2),
                CreatedDateUtc = FixedNowUtc.AddDays(-1),
                UpdatedDateUtc = FixedNowUtc.AddDays(-1)
            });

        await dbContext.SaveChangesAsync();
        var service = new TaskService(dbContext, _dateTimeServiceMock.Object);

        // ACT
        var result = await service.GetTasksAsync(userId, null, "overdue", "recentlyAdded", "asc", 1, 25, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Items.Should().HaveCount(1);
        result.Value.Items.Single().Description.Should().Be("Should be included");
    }

    [Fact]
    public async Task GetTasksAsync_Should_SortByDueDateAscending_WhenRequested()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var userId = Guid.NewGuid();

        dbContext.Users.Add(new User
        {
            Id = userId,
            FullName = "Due Date Sort User",
            Username = "due-date-user",
            PasswordHash = "hash"
        });

        dbContext.Tasks.AddRange(
            new TaskItem
            {
                Id = Guid.NewGuid(),
                Description = "Task 1",
                OwnerId = userId,
                IsCompleted = false,
                DueDate = DateOnly.FromDateTime(FixedNowUtc).AddDays(3),
                CreatedDateUtc = FixedNowUtc.AddDays(-2),
                UpdatedDateUtc = FixedNowUtc.AddDays(-2)
            },
            new TaskItem
            {
                Id = Guid.NewGuid(),
                Description = "Task 2",
                OwnerId = userId,
                IsCompleted = false,
                DueDate = DateOnly.FromDateTime(FixedNowUtc).AddDays(1),
                CreatedDateUtc = FixedNowUtc.AddDays(-1),
                UpdatedDateUtc = FixedNowUtc.AddDays(-1)
            });

        await dbContext.SaveChangesAsync();
        var service = new TaskService(dbContext, _dateTimeServiceMock.Object);

        // ACT
        var result = await service.GetTasksAsync(userId, null, "open", "dueDate", "asc", 1, 25, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Items.Select(x => x.Description).Should().ContainInOrder("Task 2", "Task 1");

    }

    [Fact]
    public async Task GetTasksAsync_Should_UseRecentlyAddedAsTieBreaker_ForAlphabeticalSort()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var userId = Guid.NewGuid();
        var newerTaskId = Guid.NewGuid();
        var olderTaskId = Guid.NewGuid();

        dbContext.Users.Add(new User
        {
            Id = userId,
            FullName = "Tie Break User",
            Username = "tie-break-user",
            PasswordHash = "hash"
        });

        dbContext.Tasks.AddRange(
            new TaskItem
            {
                Id = olderTaskId,
                Description = "Same description",
                OwnerId = userId,
                IsCompleted = false,
                CreatedDateUtc = FixedNowUtc.AddMinutes(-2),
                UpdatedDateUtc = FixedNowUtc.AddMinutes(-2)
            },
            new TaskItem
            {
                Id = newerTaskId,
                Description = "Same description",
                OwnerId = userId,
                IsCompleted = false,
                CreatedDateUtc = FixedNowUtc.AddMinutes(-1),
                UpdatedDateUtc = FixedNowUtc.AddMinutes(-1)
            });

        await dbContext.SaveChangesAsync();
        var service = new TaskService(dbContext, _dateTimeServiceMock.Object);

        // ACT
        var result = await service.GetTasksAsync(userId, null, "open", "alphabetical", "asc", 1, 25, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Items.Select(x => x.Id).Should().ContainInOrder(newerTaskId, olderTaskId);
    }

    private static async Task<AppDbContext> CreateDbContextAsync()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        var context = new AppDbContext(options);
        await context.Database.EnsureCreatedAsync();
        return context;
    }
}

