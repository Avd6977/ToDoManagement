using Microsoft.EntityFrameworkCore;
using ToDoManagement.Api.Data.Configuration.Tasks;
using ToDoManagement.Api.Models;

namespace ToDoManagement.Api.Data;

public sealed partial class AppDbContext
{
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<TaskItemHistory> TaskHistory => Set<TaskItemHistory>();

    partial void OnTasksModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new TaskItemConfiguration());
        modelBuilder.ApplyConfiguration(new TaskItemHistoryConfiguration());
    }
}
