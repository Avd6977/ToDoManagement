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
    public async Task RegisterAsync_Should_ReturnConflict_WhenUsernameAlreadyExists()
    {
        // ARRANGE
        await using var dbContext = await CreateDbContextAsync();

        dbContext.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            FullName = "Existing User",
            Username = "existing-user",
            PasswordHash = "stored-hash"
        });
        await dbContext.SaveChangesAsync();

        var service = CreateService(dbContext);

        // ACT
        var result = await service.RegisterAsync(new RegisterRequest
        {
            FullName = "New User",
            Username = "EXISTING-USER",
            Password = "Strong1!"
        }, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(409);
        result.Message.Should().Be("Username is already taken.");
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
            Username = "test-user",
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
            Username = "test-user",
            Password = "Wrong1!"
        }, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(401);
        result.Message.Should().Be("Invalid username or password.");
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

