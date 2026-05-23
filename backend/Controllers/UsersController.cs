using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToDoManagement.Api.Data;
using ToDoManagement.Api.Dtos;

namespace ToDoManagement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/users")]
public sealed class UsersController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public UsersController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("search")]
    public async Task<ActionResult<IReadOnlyCollection<UserSearchResult>>> SearchUsers(
        [FromQuery] string query,
        CancellationToken cancellationToken)
    {
        var normalized = (query ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return Ok(Array.Empty<UserSearchResult>());
        }

        var users = await _dbContext.Users.AsNoTracking().ToListAsync(cancellationToken);

        var results = users
            .Select(u => new UserSearchResult
            {
                Id = u.Id,
                // Assumption: Username stores the display/full name in this lightweight model.
                FullName = u.Username,
                Username = u.Username
            })
            .Where(u => IsFuzzyMatch(u.FullName, normalized))
            .OrderBy(u => u.FullName)
            .Take(10)
            .ToList();

        return Ok(results);
    }

    private static bool IsFuzzyMatch(string source, string query)
    {
        if (source.Contains(query, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        var sourceIndex = 0;
        var queryIndex = 0;

        while (sourceIndex < source.Length && queryIndex < query.Length)
        {
            if (char.ToUpperInvariant(source[sourceIndex]) == char.ToUpperInvariant(query[queryIndex]))
            {
                queryIndex++;
            }

            sourceIndex++;
        }

        return queryIndex == query.Length;
    }
}
