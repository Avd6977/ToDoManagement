using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ToDoManagement.Api.Data;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Models;
using ToDoManagement.Api.Services;
using ToDoManagement.Api.Services.Interfaces;
using Xunit;

namespace ToDoManagement.Api.Tests.Services;

public sealed class AuthServiceIntegrationTests
{
    private static readonly DateTime FixedNowUtc = new(2026, 5, 27, 9, 0, 0, DateTimeKind.Utc);

    [Fact]
    public async Task RefreshAsync_ShouldRotateRefreshToken_WithRealServices()
    {
        // ARRANGE
        await using var fixture = await TestFixture.CreateAsync();
        var refreshTokenService = new RefreshTokenService();
        const string originalToken = "integration-refresh-token";

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Alice Johnson",
            Username = "alice@todo.local",
            PasswordHash = new PasswordHasherService().HashPassword("Strong1!")
        };

        await using (var seedContext = fixture.CreateContext())
        {
            seedContext.Users.Add(user);
            seedContext.RefreshTokens.Add(new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TokenHash = refreshTokenService.HashToken(originalToken),
                CreatedAtUtc = FixedNowUtc.AddMinutes(-5),
                ExpiresAtUtc = FixedNowUtc.AddDays(3)
            });
            await seedContext.SaveChangesAsync();
        }

        await using var context = fixture.CreateContext();
        var service = fixture.CreateService(context);

        // ACT
        var result = await service.RefreshAsync(new RefreshTokenRequest
        {
            RefreshToken = originalToken
        }, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.IsSuccess.Should().BeTrue();

        await using var assertContext = fixture.CreateContext();
        var tokens = await assertContext.RefreshTokens
            .AsNoTracking()
            .Where(t => t.UserId == user.Id)
            .OrderBy(t => t.CreatedAtUtc)
            .ToListAsync();

        tokens.Should().HaveCount(2);
        tokens[0].RevokedAtUtc.Should().Be(FixedNowUtc);
        tokens[1].RevokedAtUtc.Should().BeNull();
    }

    [Fact]
    public async Task RevokeAsync_ShouldBeIdempotent_WithRealServices()
    {
        // ARRANGE
        await using var fixture = await TestFixture.CreateAsync();
        var refreshTokenService = new RefreshTokenService();
        const string refreshTokenValue = "integration-revoke-token";

        await using (var seedContext = fixture.CreateContext())
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Revoke User",
                Username = "revoke@todo.local",
                PasswordHash = new PasswordHasherService().HashPassword("Strong1!")
            };

            seedContext.Users.Add(user);
            seedContext.RefreshTokens.Add(new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TokenHash = refreshTokenService.HashToken(refreshTokenValue),
                CreatedAtUtc = FixedNowUtc.AddMinutes(-3),
                ExpiresAtUtc = FixedNowUtc.AddDays(2)
            });
            await seedContext.SaveChangesAsync();
        }

        await using var context = fixture.CreateContext();
        var service = fixture.CreateService(context);

        // ACT
        var firstResult = await service.RevokeAsync(new RevokeTokenRequest
        {
            RefreshToken = refreshTokenValue
        }, CancellationToken.None);

        var secondResult = await service.RevokeAsync(new RevokeTokenRequest
        {
            RefreshToken = refreshTokenValue
        }, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        firstResult.StatusCode.Should().Be(200);
        firstResult.Message.Should().Be("Refresh token revoked successfully.");
        secondResult.StatusCode.Should().Be(200);
        secondResult.Message.Should().Be("Refresh token is already revoked.");
    }

    [Fact]
    public async Task UpdateProfileAsync_ShouldChangePassword_WhenCurrentPasswordIsValid()
    {
        // ARRANGE
        await using var fixture = await TestFixture.CreateAsync();
        await using var context = fixture.CreateContext();
        var service = fixture.CreateService(context);

        var registerResult = await service.RegisterAsync(new RegisterRequest
        {
            FullName = "Alice Johnson",
            Username = "alice@todo.local",
            Password = "Strong1!"
        }, CancellationToken.None);

        registerResult.IsSuccess.Should().BeTrue();

        // ACT
        var updateResult = await service.UpdateProfileAsync(registerResult.Value!.Id, new UpdateProfileRequest
        {
            FullName = "Alice Updated",
            CurrentPassword = "Strong1!",
            NewPassword = "UpdatedStrong1!"
        }, CancellationToken.None);

        var oldPasswordLogin = await service.LoginAsync(new LoginRequest
        {
            Username = "alice@todo.local",
            Password = "Strong1!"
        }, CancellationToken.None);

        var newPasswordLogin = await service.LoginAsync(new LoginRequest
        {
            Username = "alice@todo.local",
            Password = "UpdatedStrong1!"
        }, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        updateResult.IsSuccess.Should().BeTrue();
        updateResult.Value!.FullName.Should().Be("Alice Updated");
        oldPasswordLogin.IsSuccess.Should().BeFalse();
        oldPasswordLogin.StatusCode.Should().Be(401);
        newPasswordLogin.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task RefreshAsync_ShouldAllowOnlyOneWinner_ForConcurrentAttempts()
    {
        // ARRANGE
        await using var fixture = await TestFixture.CreateAsync();
        var refreshTokenService = new RefreshTokenService();
        const string sharedRefreshToken = "integration-concurrent-refresh";

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Concurrent User",
            Username = "concurrent@todo.local",
            PasswordHash = new PasswordHasherService().HashPassword("Strong1!")
        };

        await using (var seedContext = fixture.CreateContext())
        {
            seedContext.Users.Add(user);
            seedContext.RefreshTokens.Add(new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TokenHash = refreshTokenService.HashToken(sharedRefreshToken),
                CreatedAtUtc = FixedNowUtc.AddMinutes(-1),
                ExpiresAtUtc = FixedNowUtc.AddDays(2)
            });
            await seedContext.SaveChangesAsync();
        }

        await using var context1 = fixture.CreateContext();
        await using var context2 = fixture.CreateContext();
        var service1 = fixture.CreateService(context1);
        var service2 = fixture.CreateService(context2);

        // ACT
        var refreshTasks = await Task.WhenAll(
            service1.RefreshAsync(new RefreshTokenRequest { RefreshToken = sharedRefreshToken }, CancellationToken.None),
            service2.RefreshAsync(new RefreshTokenRequest { RefreshToken = sharedRefreshToken }, CancellationToken.None));

        // ASSERT
        using var scope = new AssertionScope();
        refreshTasks.Count(r => r.IsSuccess).Should().Be(1);
        refreshTasks.Count(r => !r.IsSuccess && r.StatusCode == 401).Should().Be(1);

        await using var assertContext = fixture.CreateContext();
        var tokens = await assertContext.RefreshTokens
            .Where(t => t.UserId == user.Id)
            .ToListAsync();

        tokens.Should().HaveCount(2);
        tokens.Count(t => t.RevokedAtUtc is null).Should().Be(1);
        tokens.Count(t => t.RevokedAtUtc is not null).Should().Be(1);
    }

    private sealed class TestFixture : IAsyncDisposable
    {
        private readonly string _databasePath;
        private readonly DbContextOptions<AppDbContext> _dbOptions;
        private readonly IOptions<JwtTokenDto> _jwtOptions;

        private TestFixture(string databasePath)
        {
            _databasePath = databasePath;
            _dbOptions = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite($"Data Source={databasePath}")
                .Options;

            _jwtOptions = Options.Create(new JwtTokenDto
            {
                RefreshTokenExpiresInDays = 7,
                ExpiresInMinutes = 30,
                Key = "0123456789ABCDEF0123456789ABCDEF",
                Issuer = "todo-api",
                Audience = "todo-client"
            });
        }

        public static async Task<TestFixture> CreateAsync()
        {
            var databasePath = Path.Combine(Path.GetTempPath(), $"todo-auth-integration-{Guid.NewGuid():N}.db");
            var fixture = new TestFixture(databasePath);

            await using var context = fixture.CreateContext();
            await context.Database.EnsureCreatedAsync();
            return fixture;
        }

        public AppDbContext CreateContext() => new(_dbOptions);

        public AuthService CreateService(AppDbContext context)
        {
            var dateTimeService = new FixedDateTimeService(FixedNowUtc);
            var passwordHasher = new PasswordHasherService();
            var refreshTokenService = new RefreshTokenService();
            var jwtTokenService = new JwtTokenService(_jwtOptions, dateTimeService);

            return new AuthService(
                context,
                passwordHasher,
                jwtTokenService,
                refreshTokenService,
                dateTimeService,
                _jwtOptions);
        }

        public ValueTask DisposeAsync()
        {
            if (!File.Exists(_databasePath))
            {
                return ValueTask.CompletedTask;
            }

            try
            {
                File.Delete(_databasePath);
            }
            catch (IOException)
            {
                // Ignore cleanup contention in tests; the temp file can be reclaimed later.
            }

            return ValueTask.CompletedTask;
        }
    }

    private sealed class FixedDateTimeService : IDateTimeService
    {
        public FixedDateTimeService(DateTime utcNow)
        {
            UtcNow = utcNow;
        }

        public DateTime UtcNow { get; }
    }
}
