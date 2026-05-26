using FluentAssertions;
using FluentAssertions.Execution;
using ToDoManagement.Api.Models;
using Xunit;

namespace ToDoManagement.Api.Tests.Models;

public sealed class PasswordResetTokenTests
{
    [Fact]
    public void IsActive_Should_ReturnTrue_WhenTokenNotUsedAndNotExpired()
    {
        // ARRANGE
        var nowUtc = DateTime.UtcNow;
        var token = new PasswordResetToken
        {
            ExpiresAtUtc = nowUtc.AddMinutes(10),
            UsedAtUtc = null
        };

        // ACT
        var result = token.IsActive(nowUtc);

        // ASSERT
        using var scope = new AssertionScope();
        result.Should().BeTrue();
    }

    [Fact]
    public void IsActive_Should_ReturnFalse_WhenTokenUsed()
    {
        // ARRANGE
        var nowUtc = DateTime.UtcNow;
        var token = new PasswordResetToken
        {
            ExpiresAtUtc = nowUtc.AddMinutes(10),
            UsedAtUtc = nowUtc
        };

        // ACT
        var result = token.IsActive(nowUtc);

        // ASSERT
        using var scope = new AssertionScope();
        result.Should().BeFalse();
    }
}

