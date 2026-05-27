using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;
using ToDoManagement.Api.Data;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Models;
using ToDoManagement.Api.Services;
using ToDoManagement.Api.Services.Interfaces;
using Xunit;

namespace ToDoManagement.Api.Tests.Services;

public sealed class AuthServiceTests
{
    private static readonly DateTime FixedNowUtc = new(2026, 5, 26, 12, 0, 0, DateTimeKind.Utc);
    private readonly Mock<IPasswordHasherService> _passwordHasherMock;
    private readonly Mock<IJwtTokenService> _jwtTokenServiceMock;
    private readonly Mock<IRefreshTokenService> _refreshTokenServiceMock;
    private readonly Mock<IDateTimeService> _dateTimeServiceMock;
    private readonly IOptions<JwtTokenDto> _jwtOptions;

    public AuthServiceTests()
    {
        _passwordHasherMock = new Mock<IPasswordHasherService>();
        _jwtTokenServiceMock = new Mock<IJwtTokenService>();
        _refreshTokenServiceMock = new Mock<IRefreshTokenService>();
        _dateTimeServiceMock = new Mock<IDateTimeService>();
        _dateTimeServiceMock.SetupGet(x => x.UtcNow).Returns(FixedNowUtc);

        _jwtOptions = Options.Create(new JwtTokenDto
        {
            RefreshTokenExpiresInDays = 7,
            ExpiresInMinutes = 120,
            Key = "0123456789ABCDEF0123456789ABCDEF",
            Issuer = "todo-api",
            Audience = "todo-client"
        });

        _refreshTokenServiceMock.Setup(x => x.GenerateToken()).Returns("generated-refresh-token");
        _refreshTokenServiceMock.Setup(x => x.HashToken("generated-refresh-token")).Returns("generated-refresh-token-hash");
        _jwtTokenServiceMock.Setup(x => x.CreateToken(It.IsAny<User>())).Returns("jwt-token");
    }

    [Fact]
    public async Task RegisterAsync_Should_ReturnConflict_WhenEmailAlreadyExists()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();

        dbContext.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            FullName = "Existing User",
            Username = "existing@todo.local",
            PasswordHash = "stored-hash"
        });
        await dbContext.SaveChangesAsync();

        var service = CreateService(dbContext);

        // ACT
        var result = await service.RegisterAsync(new RegisterRequest
        {
            FullName = "New User",
            Username = "EXISTING@TODO.LOCAL",
            Password = "Strong1!"
        }, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(409);
        result.Message.Should().Be("Email is already taken.");
    }

    [Fact]
    public async Task LoginAsync_Should_ReturnUnauthorized_WhenPasswordIsInvalid()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Test User",
            Username = "user@todo.local",
            PasswordHash = "stored-hash"
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        _passwordHasherMock
            .Setup(x => x.VerifyPassword("Wrong1!", "stored-hash"))
            .Returns(false);

        var service = CreateService(dbContext);

        // ACT
        var result = await service.LoginAsync(new LoginRequest
        {
            Username = "user@todo.local",
            Password = "Wrong1!"
        }, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(401);
        result.Message.Should().Be("Invalid email or password.");
    }

    [Fact]
    public async Task RefreshAsync_ShouldRotateRefreshTokenAndRevokePreviousToken()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Alice Johnson",
            Username = "alice@todo.local",
            PasswordHash = "stored-hash"
        };

        dbContext.Users.Add(user);
        dbContext.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = "old-token-hash",
            CreatedAtUtc = FixedNowUtc.AddMinutes(-5),
            ExpiresAtUtc = FixedNowUtc.AddDays(1)
        });
        await dbContext.SaveChangesAsync();

        _refreshTokenServiceMock.Setup(x => x.HashToken("old-token")).Returns("old-token-hash");
        _refreshTokenServiceMock.Setup(x => x.GenerateToken()).Returns("next-refresh-token");
        _refreshTokenServiceMock.Setup(x => x.HashToken("next-refresh-token")).Returns("next-refresh-token-hash");

        var service = CreateService(dbContext);

        // ACT
        var result = await service.RefreshAsync(new RefreshTokenRequest
        {
            RefreshToken = "old-token"
        }, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeTrue();
        result.Value!.RefreshToken.Should().Be("next-refresh-token");

        var rotatedTokens = await dbContext.RefreshTokens
            .AsNoTracking()
            .Where(t => t.UserId == user.Id)
            .OrderBy(t => t.CreatedAtUtc)
            .ToListAsync();

        rotatedTokens.Should().HaveCount(2);
        rotatedTokens[0].RevokedAtUtc.Should().Be(FixedNowUtc);
        rotatedTokens[0].ReplacedByTokenHash.Should().Be("next-refresh-token-hash");
        rotatedTokens[1].TokenHash.Should().Be("next-refresh-token-hash");
        rotatedTokens[1].RevokedAtUtc.Should().BeNull();
    }

    [Fact]
    public async Task RevokeAsync_ShouldBeIdempotentAcrossRepeatedCalls()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Revoke User",
            Username = "revoke@todo.local",
            PasswordHash = "stored-hash"
        };

        dbContext.Users.Add(user);
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = "revoke-token-hash",
            CreatedAtUtc = FixedNowUtc.AddMinutes(-10),
            ExpiresAtUtc = FixedNowUtc.AddDays(1)
        };

        dbContext.RefreshTokens.Add(refreshToken);
        await dbContext.SaveChangesAsync();

        _refreshTokenServiceMock.Setup(x => x.HashToken("revoke-token")).Returns("revoke-token-hash");
        var service = CreateService(dbContext);

        // ACT
        var firstResult = await service.RevokeAsync(new RevokeTokenRequest
        {
            RefreshToken = "revoke-token"
        }, CancellationToken.None);

        var secondResult = await service.RevokeAsync(new RevokeTokenRequest
        {
            RefreshToken = "revoke-token"
        }, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        firstResult.StatusCode.Should().Be(200);
        firstResult.Message.Should().Be("Refresh token revoked successfully.");
        secondResult.StatusCode.Should().Be(200);
        secondResult.Message.Should().Be("Refresh token is already revoked.");

        var persistedToken = await dbContext.RefreshTokens.SingleAsync();
        persistedToken.RevokedAtUtc.Should().Be(FixedNowUtc);
    }

    [Fact]
    public async Task UpdateProfileAsync_ShouldUpdateFullNameAndPasswordHash_WhenPasswordChangeIsRequested()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Alice Johnson",
            Username = "alice@todo.local",
            PasswordHash = "old-password-hash"
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        _passwordHasherMock
            .Setup(x => x.VerifyPassword("Current1!", "old-password-hash"))
            .Returns(true);
        _passwordHasherMock
            .Setup(x => x.HashPassword("NewStrong1!"))
            .Returns("new-password-hash");

        var service = CreateService(dbContext);

        // ACT
        var result = await service.UpdateProfileAsync(user.Id, new UpdateProfileRequest
        {
            FullName = "Alice Updated",
            CurrentPassword = "Current1!",
            NewPassword = "NewStrong1!"
        }, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeTrue();
        result.Value!.FullName.Should().Be("Alice Updated");

        var updatedUser = await dbContext.Users.SingleAsync();
        updatedUser.FullName.Should().Be("Alice Updated");
        updatedUser.PasswordHash.Should().Be("new-password-hash");
    }

    [Fact]
    public async Task RefreshAsync_ShouldRejectSecondAttemptForSameRefreshToken()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Alice Johnson",
            Username = "alice@todo.local",
            PasswordHash = "stored-hash"
        };

        dbContext.Users.Add(user);
        dbContext.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = "shared-token-hash",
            CreatedAtUtc = FixedNowUtc.AddMinutes(-5),
            ExpiresAtUtc = FixedNowUtc.AddDays(1)
        });
        await dbContext.SaveChangesAsync();

        var generatedTokens = new Queue<string>(new[] { "rotated-token-1", "rotated-token-2" });
        _refreshTokenServiceMock.Setup(x => x.GenerateToken()).Returns(() => generatedTokens.Dequeue());
        _refreshTokenServiceMock.Setup(x => x.HashToken("shared-token")).Returns("shared-token-hash");
        _refreshTokenServiceMock.Setup(x => x.HashToken("rotated-token-1")).Returns("rotated-token-hash-1");
        _refreshTokenServiceMock.Setup(x => x.HashToken("rotated-token-2")).Returns("rotated-token-hash-2");

        var service = CreateService(dbContext);

        // ACT
        var firstResult = await service.RefreshAsync(new RefreshTokenRequest
        {
            RefreshToken = "shared-token"
        }, CancellationToken.None);

        var secondResult = await service.RefreshAsync(new RefreshTokenRequest
        {
            RefreshToken = "shared-token"
        }, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        firstResult.IsSuccess.Should().BeTrue();
        secondResult.IsSuccess.Should().BeFalse();
        secondResult.StatusCode.Should().Be(401);
        secondResult.Message.Should().Be("Refresh token is no longer active.");
    }

    private AuthService CreateService(AppDbContext dbContext)
    {
        return new AuthService(
            dbContext,
            _passwordHasherMock.Object,
            _jwtTokenServiceMock.Object,
            _refreshTokenServiceMock.Object,
            _dateTimeServiceMock.Object,
            _jwtOptions);
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

