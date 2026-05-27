using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ToDoManagement.Api.Data;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Services.Interfaces;

namespace ToDoManagement.Api.Services;

public sealed class RefreshTokenCleanupService : IRefreshTokenCleanupService
{
    private readonly AppDbContext _dbContext;
    private readonly IDateTimeService _dateTimeService;
    private readonly RefreshTokenCleanupOptions _options;

    public RefreshTokenCleanupService(
        AppDbContext dbContext,
        IDateTimeService dateTimeService,
        IOptions<RefreshTokenCleanupOptions> options)
    {
        _dbContext = dbContext;
        _dateTimeService = dateTimeService;
        _options = options.Value;
    }

    public Task<int> CleanupAsync(CancellationToken cancellationToken)
    {
        var retentionDays = Math.Max(1, _options.RetentionDays);
        var thresholdUtc = _dateTimeService.UtcNow.AddDays(-retentionDays);

        // Future cleanup implementation is wired and disabled by default via configuration.
        return _dbContext.RefreshTokens
            .Where(token =>
                (token.RevokedAtUtc.HasValue && token.RevokedAtUtc.Value < thresholdUtc)
                || token.ExpiresAtUtc < thresholdUtc)
            .ExecuteDeleteAsync(cancellationToken);
    }
}
