using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ToDoManagement.Api.Models;

namespace ToDoManagement.Api.Data.Configuration.Auth;

internal sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasIndex(user => user.Username)
            .IsUnique();

        builder.HasIndex(user => user.FullName);

        builder.Property(user => user.FullName)
            .HasColumnType("VARCHAR(100)")
            .HasMaxLength(100);
    }
}
