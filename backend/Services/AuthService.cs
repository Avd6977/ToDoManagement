using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ToDoManagement.Api.Data;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Models;
using ToDoManagement.Api.Services.Interfaces;

namespace ToDoManagement.Api.Services;

public sealed class AuthService : IAuthService
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasherService _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly IDateTimeService _dateTimeService;
    private readonly JwtTokenDto _jwtOptions;

    public AuthService(
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

    public async Task<ServiceResult<AuthResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var fullName = request.FullName.Trim();
        var email = request.Username.Trim();

        var users = await _dbContext.Users.ToListAsync(cancellationToken);
        var existingUser = users.FirstOrDefault(u => u.Username.Equals(email, StringComparison.OrdinalIgnoreCase));

        if (existingUser is not null)
        {
            return ServiceResult<AuthResponse>.Failure(StatusCodes.Status409Conflict, "Email is already taken.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = fullName,
            Username = email,
            PasswordHash = _passwordHasher.HashPassword(request.Password)
        };

        _dbContext.Users.Add(user);
        var authResponse = await IssueTokensAsync(user, cancellationToken);
        return ServiceResult<AuthResponse>.Success(authResponse);
    }

    public async Task<ServiceResult<AuthResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var email = request.Username.Trim();
        var users = await _dbContext.Users.ToListAsync(cancellationToken);
        var user = users.FirstOrDefault(u => u.Username.Equals(email, StringComparison.OrdinalIgnoreCase));

        if (user is null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            return ServiceResult<AuthResponse>.Failure(StatusCodes.Status401Unauthorized, "Invalid email or password.");
        }

        var authResponse = await IssueTokensAsync(user, cancellationToken);
        return ServiceResult<AuthResponse>.Success(authResponse);
    }

    public async Task<ServiceResult<AuthResponse>> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var tokenHash = _refreshTokenService.HashToken(request.RefreshToken);
        var refreshToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        if (refreshToken is null)
        {
            return ServiceResult<AuthResponse>.Failure(StatusCodes.Status401Unauthorized, "Refresh token is invalid.");
        }

        var nowUtc = _dateTimeService.UtcNow;
        if (!refreshToken.IsActive(nowUtc))
        {
            return ServiceResult<AuthResponse>.Failure(StatusCodes.Status401Unauthorized, "Refresh token is no longer active.");
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == refreshToken.UserId, cancellationToken);
        if (user is null)
        {
            return ServiceResult<AuthResponse>.Failure(StatusCodes.Status401Unauthorized, "User for refresh token was not found.");
        }

        var newRefreshTokenValue = _refreshTokenService.GenerateToken();
        var newRefreshTokenHash = _refreshTokenService.HashToken(newRefreshTokenValue);
        refreshToken.RevokedAtUtc = nowUtc;
        refreshToken.ReplacedByTokenHash = newRefreshTokenHash;

        _dbContext.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = newRefreshTokenHash,
            ExpiresAtUtc = nowUtc.AddDays(_jwtOptions.RefreshTokenExpiresInDays),
            CreatedAtUtc = nowUtc
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

        return ServiceResult<AuthResponse>.Success(new AuthResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Username = user.Username,
            Token = _jwtTokenService.CreateToken(user),
            RefreshToken = newRefreshTokenValue
        });
    }

    public async Task<ServiceResult> RevokeAsync(RevokeTokenRequest request, CancellationToken cancellationToken)
    {
        var tokenHash = _refreshTokenService.HashToken(request.RefreshToken);
        var refreshToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        if (refreshToken is null)
        {
            return ServiceResult.Failure(StatusCodes.Status404NotFound, "Refresh token was not found.");
        }

        if (refreshToken.RevokedAtUtc is not null)
        {
            return ServiceResult.Failure(StatusCodes.Status200OK, "Refresh token is already revoked.");
        }

        refreshToken.RevokedAtUtc = _dateTimeService.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return ServiceResult.Failure(StatusCodes.Status200OK, "Refresh token revoked successfully.");
    }

    public async Task<ServiceResult<ProfileResponse>> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
        {
            return ServiceResult<ProfileResponse>.Failure(StatusCodes.Status404NotFound, "User not found.");
        }

        user.FullName = request.FullName.Trim();

        var newPassword = request.NewPassword?.Trim();
        if (!string.IsNullOrWhiteSpace(newPassword))
        {
            var currentPassword = request.CurrentPassword ?? string.Empty;
            if (!_passwordHasher.VerifyPassword(currentPassword, user.PasswordHash))
            {
                return ServiceResult<ProfileResponse>.Failure(StatusCodes.Status400BadRequest, "Current password is incorrect.");
            }

            user.PasswordHash = _passwordHasher.HashPassword(newPassword);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return ServiceResult<ProfileResponse>.Success(new ProfileResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Username = user.Username
        });
    }

    private async Task<AuthResponse> IssueTokensAsync(User user, CancellationToken cancellationToken)
    {
        var nowUtc = _dateTimeService.UtcNow;
        var refreshTokenValue = _refreshTokenService.GenerateToken();
        var refreshTokenHash = _refreshTokenService.HashToken(refreshTokenValue);

        _dbContext.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = refreshTokenHash,
            ExpiresAtUtc = nowUtc.AddDays(_jwtOptions.RefreshTokenExpiresInDays),
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
}
