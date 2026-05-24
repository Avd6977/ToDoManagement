namespace ToDoManagement.Api.Models;

public sealed class PasswordResetToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UsedAtUtc { get; set; }

    public bool IsActive(DateTime nowUtc) => UsedAtUtc is null && ExpiresAtUtc > nowUtc;
}
