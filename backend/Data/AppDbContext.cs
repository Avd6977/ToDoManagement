using Microsoft.EntityFrameworkCore;

namespace ToDoManagement.Api.Data;

public sealed partial class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        OnAuthModelCreating(modelBuilder);
        OnTasksModelCreating(modelBuilder);
    }

    partial void OnAuthModelCreating(ModelBuilder modelBuilder);

    partial void OnTasksModelCreating(ModelBuilder modelBuilder);
}
