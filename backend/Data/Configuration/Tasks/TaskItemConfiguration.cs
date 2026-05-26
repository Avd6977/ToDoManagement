using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ToDoManagement.Api.Models;

namespace ToDoManagement.Api.Data.Configuration.Tasks;

internal sealed class TaskItemConfiguration : IEntityTypeConfiguration<TaskItem>
{
    public void Configure(EntityTypeBuilder<TaskItem> builder)
    {
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(task => task.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
