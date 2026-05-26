using ToDoManagement.Api.Services.Interfaces;

namespace ToDoManagement.Api.Services;

public sealed class DateTimeService : IDateTimeService
{
    public DateTime UtcNow => DateTime.UtcNow;
}
