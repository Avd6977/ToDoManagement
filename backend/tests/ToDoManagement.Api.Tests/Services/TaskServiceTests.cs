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
        var result = await service.GetTasksAsync(Guid.NewGuid(), null, "invalid", CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(400);
        result.Message.Should().Be("Invalid status filter. Use open, completed, or all.");
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
            Title = "Task",
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

