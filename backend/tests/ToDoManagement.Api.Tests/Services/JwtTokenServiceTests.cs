using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.Extensions.Options;
using Moq;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Models;
using ToDoManagement.Api.Services;
using ToDoManagement.Api.Services.Interfaces;
using Xunit;

namespace ToDoManagement.Api.Tests.Services;

public sealed class JwtTokenServiceTests
{
    private static readonly DateTime FixedNowUtc = new(2026, 5, 26, 12, 0, 0, DateTimeKind.Utc);
    private readonly Mock<IDateTimeService> _dateTimeServiceMock;

    public JwtTokenServiceTests()
    {
        _dateTimeServiceMock = new Mock<IDateTimeService>();
        _dateTimeServiceMock.SetupGet(x => x.UtcNow).Returns(FixedNowUtc);
    }

    [Fact]
    public void CreateToken_Should_CreateJwtWithExpectedClaimsAndExpiry()
    {
        // ARRANGE
        var options = Options.Create(new JwtTokenDto
        {
            Key = "0123456789ABCDEF0123456789ABCDEF",
            Issuer = "todo-api",
            Audience = "todo-client",
            ExpiresInMinutes = 30
        });

        var service = new JwtTokenService(options, _dateTimeServiceMock.Object);
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "alice",
            FullName = "Alice Johnson"
        };

        // ACT
        var token = service.CreateToken(user);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        // ASSERT
        using var scope = new AssertionScope();
        jwt.Issuer.Should().Be("todo-api");
        jwt.Audiences.Should().Contain("todo-client");
        jwt.Subject.Should().Be(user.Id.ToString());
        jwt.Claims.Should().Contain(c => c.Type == ClaimTypes.Name && c.Value == "alice");
        jwt.ValidTo.Should().BeCloseTo(FixedNowUtc.AddMinutes(30), TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void CreateToken_Should_Throw_WhenKeyMissing()
    {
        // ARRANGE
        var options = Options.Create(new JwtTokenDto
        {
            Key = string.Empty,
            Issuer = "todo-api",
            Audience = "todo-client",
            ExpiresInMinutes = 30
        });

        var service = new JwtTokenService(options, _dateTimeServiceMock.Object);

        // ACT
        var act = () => service.CreateToken(new User { Id = Guid.NewGuid(), Username = "alice", FullName = "Alice" });

        // ASSERT
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("JWT key is missing.");
    }
}
