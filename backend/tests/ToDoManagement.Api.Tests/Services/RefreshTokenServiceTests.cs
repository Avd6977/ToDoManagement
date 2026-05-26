using FluentAssertions;
using FluentAssertions.Execution;
using ToDoManagement.Api.Services;
using Xunit;

namespace ToDoManagement.Api.Tests.Services;

public sealed class RefreshTokenServiceTests
{
    private readonly RefreshTokenService _service = new();

    [Fact]
    public void GenerateToken_Should_ReturnBase64EncodedRandomValue()
    {
        // ARRANGE

        // ACT
        var token = _service.GenerateToken();

        // ASSERT
        using var scope = new AssertionScope();
        token.Should().NotBeNullOrWhiteSpace();
        token.Should().NotBe(_service.GenerateToken());
    }

    [Fact]
    public void HashToken_Should_BeDeterministic_ForSameToken()
    {
        // ARRANGE
        const string token = "refresh-token-value";

        // ACT
        var hash1 = _service.HashToken(token);
        var hash2 = _service.HashToken(token);

        // ASSERT
        using var scope = new AssertionScope();
        hash1.Should().Be(hash2);
        hash1.Should().NotBe(token);
    }
}

