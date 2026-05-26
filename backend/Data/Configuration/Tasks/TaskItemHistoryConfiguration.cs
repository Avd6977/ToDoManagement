using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ToDoManagement.Api.Models;

namespace ToDoManagement.Api.Data.Configuration.Tasks;

internal sealed class TaskItemHistoryConfiguration : IEntityTypeConfiguration<TaskItemHistory>
{
    public void Configure(EntityTypeBuilder<TaskItemHistory> builder)
    {
        builder.HasIndex(history => new { history.TaskId, history.ValidFromUtc });
    }
}
