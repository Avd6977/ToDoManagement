using Microsoft.EntityFrameworkCore;
using ToDoManagement.Api.Data.Configuration.Auth;
using ToDoManagement.Api.Models;

namespace ToDoManagement.Api.Data;

public sealed partial class AppDbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    partial void OnAuthModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new RefreshTokenConfiguration());
    }
}
