namespace ToDoManagement.Api.Services.Interfaces;

public interface IRefreshTokenCleanupService
{
    Task<int> CleanupAsync(CancellationToken cancellationToken);
}
