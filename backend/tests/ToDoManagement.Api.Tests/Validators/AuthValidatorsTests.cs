using FluentAssertions;
using FluentAssertions.Execution;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Validators;
using Xunit;

namespace ToDoManagement.Api.Tests.Validators;

public sealed class AuthValidatorsTests
{
    private readonly RegisterRequestValidator _validator = new();
    private readonly UpdateProfileRequestValidator _updateProfileValidator = new();

    [Theory]
    [InlineData("short1!", false)]
    [InlineData("NoNumber!", false)]
    [InlineData("NoSpecial1", false)]
    [InlineData("12345678!", false)]
    [InlineData("Strong1!", true)]
    public void RegisterRequestValidator_Should_EnforcePasswordPolicy(string password, bool isValid)
    {
        // ARRANGE
        var request = new RegisterRequest
        {
            FullName = "Alice Johnson",
            Username = "alice@todo.local",
            Password = password
        };

        // ACT
        var result = _validator.Validate(request);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsValid.Should().Be(isValid);
    }

    [Fact]
    public void RegisterRequestValidator_Should_RequireEmail()
    {
        // ARRANGE
        var request = new RegisterRequest
        {
            FullName = "Alice Johnson",
            Username = string.Empty,
            Password = "Strong1!"
        };

        // ACT
        var result = _validator.Validate(request);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsValid.Should().BeFalse();
        result.Errors.Select(e => e.ErrorMessage)
            .Should().Contain("Email is required.");
    }

    [Fact]
    public void RegisterRequestValidator_Should_RequireFullName()
    {
        // ARRANGE
        var request = new RegisterRequest
        {
            FullName = string.Empty,
            Username = "alice@todo.local",
            Password = "Strong1!"
        };

        // ACT
        var result = _validator.Validate(request);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsValid.Should().BeFalse();
        result.Errors.Select(e => e.ErrorMessage)
            .Should().Contain("Full name is required.");
    }

    [Fact]
    public void RegisterRequestValidator_Should_RequireValidEmailFormat()
    {
        // ARRANGE
        var request = new RegisterRequest
        {
            FullName = "Alice Johnson",
            Username = "alice",
            Password = "Strong1!"
        };

        // ACT
        var result = _validator.Validate(request);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsValid.Should().BeFalse();
        result.Errors.Select(e => e.ErrorMessage)
            .Should().Contain("Email format is invalid.");
    }

    [Fact]
    public void UpdateProfileRequestValidator_Should_RequireCurrentPassword_WhenSettingNewPassword()
    {
        // ARRANGE
        var request = new UpdateProfileRequest
        {
            FullName = "Alice Johnson",
            CurrentPassword = string.Empty,
            NewPassword = "NewStrong1!"
        };

        // ACT
        var result = _updateProfileValidator.Validate(request);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsValid.Should().BeFalse();
        result.Errors.Select(e => e.ErrorMessage)
            .Should().Contain("Current password is required to set a new password.");
    }

    [Fact]
    public void UpdateProfileRequestValidator_Should_AllowFullNameOnlyUpdates()
    {
        // ARRANGE
        var request = new UpdateProfileRequest
        {
            FullName = "Alice Johnson",
            CurrentPassword = string.Empty,
            NewPassword = string.Empty
        };

        // ACT
        var result = _updateProfileValidator.Validate(request);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsValid.Should().BeTrue();
    }
}

