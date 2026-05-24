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
            .Select(u => new
            {
                Result = new UserSearchResult
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Username = u.Username
                },
                Score = GetScore(u.FullName, u.Username, normalized)
            })
            .Where(x => x.Score > 0)
            .OrderByDescending(x => x.Score)
            .ThenBy(x => x.Result.FullName)
            .Take(10)
            .Select(x => x.Result)
            .ToList();

        return Ok(results);
    }

    private static int GetScore(string fullName, string username, string query)
    {
        var score = 0;

        if (fullName.StartsWith(query, StringComparison.OrdinalIgnoreCase))
        {
            score += 300;
        }
        else if (fullName.Contains(query, StringComparison.OrdinalIgnoreCase))
        {
            score += 220;
        }
        else if (IsSubsequenceMatch(fullName, query))
        {
            score += 120;
        }

        if (username.StartsWith(query, StringComparison.OrdinalIgnoreCase))
        {
            score += 80;
        }
        else if (username.Contains(query, StringComparison.OrdinalIgnoreCase))
        {
            score += 40;
        }

        return score;
    }

    private static bool IsSubsequenceMatch(string source, string query)
    {
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
