using FluentAssertions;
using FluentAssertions.Execution;
using ToDoManagement.Api.Services;
using Xunit;

namespace ToDoManagement.Api.Tests;

public sealed class PasswordHasherServiceTests
{
    private readonly PasswordHasherService _service = new();

    [Fact]
    public void HashPassword_Should_NotReturnPlaintext_AndVerifySuccessfully()
    {
        // ARRANGE
        const string password = "Strong1!";

        // ACT
        var hash = _service.HashPassword(password);
        var isValid = _service.VerifyPassword(password, hash);

        // ASSERT
        using var scope = new AssertionScope();
        hash.Should().NotBe(password);
        hash.Should().Contain(":");
        isValid.Should().BeTrue();
    }

    [Fact]
    public void VerifyPassword_Should_ReturnFalse_ForWrongPassword()
    {
        // ARRANGE
        const string password = "Strong1!";
        var hash = _service.HashPassword(password);

        // ACT
        var isValid = _service.VerifyPassword("Wrong1!", hash);

        // ASSERT
        using var scope = new AssertionScope();
        isValid.Should().BeFalse();
    }
}
