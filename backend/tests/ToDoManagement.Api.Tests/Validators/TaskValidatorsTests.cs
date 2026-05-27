using FluentAssertions;
using FluentAssertions.Execution;
using Moq;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Services.Interfaces;
using ToDoManagement.Api.Validators;
using Xunit;

namespace ToDoManagement.Api.Tests.Validators;

public sealed class TaskValidatorsTests
{
    private static readonly DateTime FixedNowUtc = new(2026, 5, 25, 12, 0, 0, DateTimeKind.Utc);
    private const int MaxDescriptionLength = 2000;
    private readonly CreateTaskRequestValidator _createTaskRequestValidator;
    private readonly UpdateTaskRequestValidator _updateTaskRequestValidator;

    public TaskValidatorsTests()
    {
        var dateTimeServiceMock = new Mock<IDateTimeService>();
        dateTimeServiceMock.SetupGet(x => x.UtcNow).Returns(FixedNowUtc);
        _createTaskRequestValidator = new CreateTaskRequestValidator(dateTimeServiceMock.Object);
        _updateTaskRequestValidator = new UpdateTaskRequestValidator();
    }

    [Theory]
    [InlineData(-1, false)]
    [InlineData(0, true)]
    [InlineData(1, true)]
    public void CreateTaskRequestValidator_Should_RejectPastDueDates(int dueDateOffsetDays, bool isValid)
    {
        // ARRANGE
        var request = new CreateTaskRequest
        {
            Description = "Task description",
            DueDate = DateOnly.FromDateTime(FixedNowUtc).AddDays(dueDateOffsetDays)
        };

        // ACT
        var result = _createTaskRequestValidator.Validate(request);

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
        var request = new UpdateTaskRequest
        {
            Description = "Task description",
            DueDate = DateOnly.FromDateTime(FixedNowUtc).AddDays(dueDateOffsetDays),
            IsCompleted = false
        };

        // ACT
        var result = _updateTaskRequestValidator.Validate(request);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsValid.Should().Be(isValid);
    }

    [Theory]
    [InlineData(MaxDescriptionLength, true)]
    [InlineData(MaxDescriptionLength + 1, false)]
    public void CreateTaskRequestValidator_Should_EnforceDescriptionLength(int descriptionLength, bool isValid)
    {
        // ARRANGE
        var request = new CreateTaskRequest
        {
            Description = new string('a', descriptionLength),
            DueDate = DateOnly.FromDateTime(FixedNowUtc)
        };

        // ACT
        var result = _createTaskRequestValidator.Validate(request);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsValid.Should().Be(isValid);
        if (!isValid)
        {
            result.Errors.Select(e => e.ErrorMessage)
                .Should().Contain("Description must be 2000 characters or fewer.");
        }
    }

    [Theory]
    [InlineData(MaxDescriptionLength, true)]
    [InlineData(MaxDescriptionLength + 1, false)]
    public void UpdateTaskRequestValidator_Should_EnforceDescriptionLength(int descriptionLength, bool isValid)
    {
        // ARRANGE
        var request = new UpdateTaskRequest
        {
            Description = new string('a', descriptionLength),
            DueDate = DateOnly.FromDateTime(FixedNowUtc),
            IsCompleted = false
        };

        // ACT
        var result = _updateTaskRequestValidator.Validate(request);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsValid.Should().Be(isValid);
        if (!isValid)
        {
            result.Errors.Select(e => e.ErrorMessage)
                .Should().Contain("Description must be 2000 characters or fewer.");
        }
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void CreateTaskRequestValidator_Should_RequireDescription(string description)
    {
        // ARRANGE
        var request = new CreateTaskRequest
        {
            Description = description,
            DueDate = DateOnly.FromDateTime(FixedNowUtc)
        };

        // ACT
        var result = _createTaskRequestValidator.Validate(request);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsValid.Should().BeFalse();
        result.Errors.Select(e => e.ErrorMessage)
            .Should().Contain("Description is required.");
    }

}

