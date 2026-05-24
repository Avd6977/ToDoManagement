using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ToDoManagement.Api.Data;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Models;
using ToDoManagement.Api.Services;

namespace ToDoManagement.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasherService _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly IDateTimeService _dateTimeService;
    private readonly JwtTokenDto _jwtOptions;

    public AuthController(
        AppDbContext dbContext,
        IPasswordHasherService passwordHasher,
        IJwtTokenService jwtTokenService,
        IRefreshTokenService refreshTokenService,
        IDateTimeService dateTimeService,
        IOptions<JwtTokenDto> jwtOptions)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _refreshTokenService = refreshTokenService;
        _dateTimeService = dateTimeService;
        _jwtOptions = jwtOptions.Value;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var fullName = request.FullName.Trim();
        var username = request.Username.Trim();

        var users = await _dbContext.Users.ToListAsync(cancellationToken);
        var existingUser = users.FirstOrDefault(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase));

        if (existingUser is not null)
        {
            return Conflict(new { message = "Username is already taken." });
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = fullName,
            Username = username,
            PasswordHash = _passwordHasher.HashPassword(request.Password)
        };

        _dbContext.Users.Add(user);
        var authResponse = await IssueTokensAsync(user, cancellationToken);
        return Ok(authResponse);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var username = request.Username.Trim();
        var users = await _dbContext.Users.ToListAsync(cancellationToken);
        var user = users.FirstOrDefault(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase));

        if (user is null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid username or password." });
        }

        var authResponse = await IssueTokensAsync(user, cancellationToken);
        return Ok(authResponse);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var tokenHash = _refreshTokenService.HashToken(request.RefreshToken);
        var refreshToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        if (refreshToken is null)
        {
            return Unauthorized(new { message = "Refresh token is invalid." });
        }

        var nowUtc = _dateTimeService.UtcNow;
        if (!refreshToken.IsActive(nowUtc))
        {
            return Unauthorized(new { message = "Refresh token is no longer active." });
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == refreshToken.UserId, cancellationToken);
        if (user is null)
        {
            return Unauthorized(new { message = "User for refresh token was not found." });
        }

        var newRefreshTokenValue = _refreshTokenService.GenerateToken();
        var newRefreshTokenHash = _refreshTokenService.HashToken(newRefreshTokenValue);
        refreshToken.RevokedAtUtc = nowUtc;
        refreshToken.ReplacedByTokenHash = newRefreshTokenHash;

        var expiresInDays = _jwtOptions.RefreshTokenExpiresInDays;

        _dbContext.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = newRefreshTokenHash,
            ExpiresAtUtc = nowUtc.AddDays(expiresInDays),
            CreatedAtUtc = nowUtc
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new AuthResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Username = user.Username,
            Token = _jwtTokenService.CreateToken(user),
            RefreshToken = newRefreshTokenValue
        });
    }

    [HttpPost("revoke")]
    public async Task<IActionResult> Revoke(RevokeTokenRequest request, CancellationToken cancellationToken)
    {
        var tokenHash = _refreshTokenService.HashToken(request.RefreshToken);
        var refreshToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        if (refreshToken is null)
        {
            return NotFound(new { message = "Refresh token was not found." });
        }

        if (refreshToken.RevokedAtUtc is not null)
        {
            return Ok(new { message = "Refresh token is already revoked." });
        }

        refreshToken.RevokedAtUtc = _dateTimeService.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Refresh token revoked successfully." });
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ForgotPasswordResponse>> ForgotPassword(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var username = request.Username.Trim();
        var users = await _dbContext.Users.ToListAsync(cancellationToken);
        var user = users.FirstOrDefault(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase));

        var response = new ForgotPasswordResponse
        {
            Message = "If the account exists, a reset token has been generated."
        };

        if (user is null)
        {
            return Ok(response);
        }

        var nowUtc = _dateTimeService.UtcNow;
        var activeTokens = await _dbContext.PasswordResetTokens
            .Where(t => t.UserId == user.Id && t.UsedAtUtc == null && t.ExpiresAtUtc > nowUtc)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.UsedAtUtc = nowUtc;
        }

        var resetToken = _refreshTokenService.GenerateToken();
        var resetTokenHash = _refreshTokenService.HashToken(resetToken);
        var resetTokenExpiresInMinutes = 30;

        _dbContext.PasswordResetTokens.Add(new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = resetTokenHash,
            CreatedAtUtc = nowUtc,
            ExpiresAtUtc = nowUtc.AddMinutes(resetTokenExpiresInMinutes)
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Demo-only behavior: return token directly because email provider integration is out of scope.
        response.ResetToken = resetToken;
        return Ok(response);
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        ResetPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var tokenHash = _refreshTokenService.HashToken(request.ResetToken);
        var resetToken = await _dbContext.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        if (resetToken is null)
        {
            return BadRequest(new { message = "Reset token is invalid." });
        }

        var nowUtc = _dateTimeService.UtcNow;
        if (!resetToken.IsActive(nowUtc))
        {
            return BadRequest(new { message = "Reset token is expired or already used." });
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == resetToken.UserId, cancellationToken);
        if (user is null)
        {
            return BadRequest(new { message = "User for reset token was not found." });
        }

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        resetToken.UsedAtUtc = nowUtc;

        var activeRefreshTokens = await _dbContext.RefreshTokens
            .Where(t => t.UserId == user.Id && t.RevokedAtUtc == null && t.ExpiresAtUtc > nowUtc)
            .ToListAsync(cancellationToken);

        foreach (var token in activeRefreshTokens)
        {
            token.RevokedAtUtc = nowUtc;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Password has been reset successfully." });
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<ProfileResponse>> UpdateProfile(
        UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "User context is missing from token." });
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        user.FullName = request.FullName.Trim();

        var newPassword = request.NewPassword?.Trim();
        if (!string.IsNullOrWhiteSpace(newPassword))
        {
            var currentPassword = request.CurrentPassword ?? string.Empty;
            if (!_passwordHasher.VerifyPassword(currentPassword, user.PasswordHash))
            {
                return BadRequest(new { message = "Current password is incorrect." });
            }

            user.PasswordHash = _passwordHasher.HashPassword(newPassword);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new ProfileResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Username = user.Username
        });
    }

    private async Task<AuthResponse> IssueTokensAsync(User user, CancellationToken cancellationToken)
    {
        var nowUtc = _dateTimeService.UtcNow;
        var expiresInDays = _jwtOptions.RefreshTokenExpiresInDays;

        var refreshTokenValue = _refreshTokenService.GenerateToken();
        var refreshTokenHash = _refreshTokenService.HashToken(refreshTokenValue);

        _dbContext.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = refreshTokenHash,
            ExpiresAtUtc = nowUtc.AddDays(expiresInDays),
            CreatedAtUtc = nowUtc
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new AuthResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Username = user.Username,
            Token = _jwtTokenService.CreateToken(user),
            RefreshToken = refreshTokenValue
        };
    }

    private Guid? GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out var parsedId) ? parsedId : null;
    }
}
