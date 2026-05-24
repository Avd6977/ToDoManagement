using FluentAssertions;
using FluentAssertions.Execution;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Validators;
using Xunit;

namespace ToDoManagement.Api.Tests;

public sealed class AuthValidatorsTests
{
    private readonly RegisterRequestValidator _validator = new();
    private readonly ResetPasswordRequestValidator _resetPasswordValidator = new();
    private readonly ForgotPasswordRequestValidator _forgotPasswordValidator = new();

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
            Username = "alice",
            Password = password
        };

        // ACT
        var result = _validator.Validate(request);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsValid.Should().Be(isValid);
    }

    [Fact]
    public void RegisterRequestValidator_Should_RequireUsername()
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
            .Should().Contain("Username is required.");
    }

    [Fact]
    public void RegisterRequestValidator_Should_RequireFullName()
    {
        // ARRANGE
        var request = new RegisterRequest
        {
            FullName = string.Empty,
            Username = "alice",
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

    [Theory]
    [InlineData("short1!", false)]
    [InlineData("NoNumber!", false)]
    [InlineData("NoSpecial1", false)]
    [InlineData("12345678!", false)]
    [InlineData("Strong1!", true)]
    public void ResetPasswordRequestValidator_Should_EnforcePasswordPolicy(string password, bool isValid)
    {
        // ARRANGE
        var request = new ResetPasswordRequest
        {
            ResetToken = "sample-token",
            NewPassword = password
        };

        // ACT
        var result = _resetPasswordValidator.Validate(request);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsValid.Should().Be(isValid);
    }

    [Fact]
    public void ForgotPasswordRequestValidator_Should_RequireUsername()
    {
        // ARRANGE
        var request = new ForgotPasswordRequest
        {
            Username = string.Empty
        };

        // ACT
        var result = _forgotPasswordValidator.Validate(request);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsValid.Should().BeFalse();
        result.Errors.Select(e => e.ErrorMessage)
            .Should().Contain("Username is required.");
    }

    [Fact]
    public void ResetPasswordRequestValidator_Should_RequireResetToken()
    {
        // ARRANGE
        var request = new ResetPasswordRequest
        {
            ResetToken = string.Empty,
            NewPassword = "Strong1!"
        };

        // ACT
        var result = _resetPasswordValidator.Validate(request);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsValid.Should().BeFalse();
        result.Errors.Select(e => e.ErrorMessage)
            .Should().Contain("Reset token is required.");
    }
}
