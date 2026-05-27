namespace ToDoManagement.Api.Dtos;

public sealed class RefreshTokenCleanupOptions
{
    public bool Enabled { get; set; }
    public int IntervalMinutes { get; set; } = 60;
    public int RetentionDays { get; set; } = 30;
}
