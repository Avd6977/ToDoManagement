using Microsoft.Extensions.Options;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Services.Interfaces;

namespace ToDoManagement.Api.Services;

public sealed class RefreshTokenCleanupHostedService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly RefreshTokenCleanupOptions _options;
    private readonly ILogger<RefreshTokenCleanupHostedService> _logger;

    public RefreshTokenCleanupHostedService(
        IServiceScopeFactory scopeFactory,
        IOptions<RefreshTokenCleanupOptions> options,
        ILogger<RefreshTokenCleanupHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Refresh token cleanup job is disabled.");
            return;
        }

        var intervalMinutes = Math.Max(1, _options.IntervalMinutes);
        var interval = TimeSpan.FromMinutes(intervalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var cleanupService = scope.ServiceProvider.GetRequiredService<IRefreshTokenCleanupService>();
                var deletedCount = await cleanupService.CleanupAsync(stoppingToken);
                _logger.LogInformation("Refresh token cleanup removed {DeletedCount} expired/revoked records.", deletedCount);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Refresh token cleanup job failed.");
            }

            await Task.Delay(interval, stoppingToken);
        }
    }
}
