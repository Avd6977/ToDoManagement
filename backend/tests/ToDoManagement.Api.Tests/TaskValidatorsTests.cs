using FluentAssertions;
using FluentAssertions.Execution;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Services;
using ToDoManagement.Api.Validators;
using Xunit;

namespace ToDoManagement.Api.Tests;

public sealed class TaskValidatorsTests
{
    private static readonly DateTime FixedNowUtc = new(2026, 5, 25, 12, 0, 0, DateTimeKind.Utc);

    [Theory]
    [InlineData(-1, false)]
    [InlineData(0, true)]
    [InlineData(1, true)]
    public void CreateTaskRequestValidator_Should_RejectPastDueDates(int dueDateOffsetDays, bool isValid)
    {
        // ARRANGE
        var dateTimeService = new FakeDateTimeService(FixedNowUtc);
        var validator = new CreateTaskRequestValidator(dateTimeService);
        var request = new CreateTaskRequest
        {
            Title = "Task title",
            Description = "Task description",
            DueDate = FixedNowUtc.Date.AddDays(dueDateOffsetDays)
        };

        // ACT
        var result = validator.Validate(request);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsValid.Should().Be(isValid);

        if (!isValid)
        {
            result.Errors.Select(e => e.ErrorMessage)
                .Should().Contain("Due date cannot be in the past.");
        }
    }

    [Theory]
    [InlineData(-1, true)]
    [InlineData(0, true)]
    [InlineData(1, true)]
    public void UpdateTaskRequestValidator_Should_AllowValidDateFormats(int dueDateOffsetDays, bool isValid)
    {
        // ARRANGE
        var validator = new UpdateTaskRequestValidator();
        var request = new UpdateTaskRequest
        {
            Title = "Task title",
            Description = "Task description",
            DueDate = FixedNowUtc.Date.AddDays(dueDateOffsetDays),
            IsCompleted = false
        };

        // ACT
        var result = validator.Validate(request);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsValid.Should().Be(isValid);
    }

    private sealed class FakeDateTimeService : IDateTimeService
    {
        public FakeDateTimeService(DateTime utcNow)
        {
            UtcNow = utcNow;
        }

        public DateTime UtcNow { get; }
    }
}
