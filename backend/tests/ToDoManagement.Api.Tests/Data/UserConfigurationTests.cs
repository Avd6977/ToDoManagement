using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ToDoManagement.Api.Data;
using ToDoManagement.Api.Models;
using Xunit;

namespace ToDoManagement.Api.Tests.Data;

public sealed class UserConfigurationTests
{
    [Fact]
    public async Task SaveChangesAsync_ShouldEnforceCaseInsensitiveUsernameUniqueness()
    {
        // ARRANGE
        await using var context = await CreateDbContextAsync();

        context.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            FullName = "User One",
            Username = "user@example.com",
            PasswordHash = "hash-1"
        });

        await context.SaveChangesAsync();

        context.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            FullName = "User Two",
            Username = "USER@example.com",
            PasswordHash = "hash-2"
        });

        // ACT
        var act = () => context.SaveChangesAsync();

        // ASSERT
        await act.Should().ThrowAsync<DbUpdateException>();
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
