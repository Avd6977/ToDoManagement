using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Services.Interfaces;

namespace ToDoManagement.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private const string AccessTokenCookieName = "todo_access_token";
    private const string RefreshTokenCookieName = "todo_refresh_token";
    private const int RefreshTokenCookieDays = 14;

    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.RegisterAsync(request, cancellationToken);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, new { message = result.Message });
        }

        SetAuthCookies(result.Value!);
        return Ok(result.Value);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request, cancellationToken);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, new { message = result.Message });
        }

        SetAuthCookies(result.Value!);
        return Ok(result.Value);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshTokenRequest? request, CancellationToken cancellationToken)
    {
        var refreshToken = ReadRefreshToken(request?.RefreshToken);
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return BadRequest(new { message = "Refresh token is required." });
        }

        var result = await _authService.RefreshAsync(new RefreshTokenRequest
        {
            RefreshToken = refreshToken
        }, cancellationToken);

        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, new { message = result.Message });
        }

        SetAuthCookies(result.Value!);
        return Ok(result.Value);
    }

    [HttpPost("revoke")]
    public async Task<IActionResult> Revoke(RevokeTokenRequest? request, CancellationToken cancellationToken)
    {
        var refreshToken = ReadRefreshToken(request?.RefreshToken);
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return BadRequest(new { message = "Refresh token is required." });
        }

        var result = await _authService.RevokeAsync(new RevokeTokenRequest
        {
            RefreshToken = refreshToken
        }, cancellationToken);

        if (result.StatusCode == StatusCodes.Status200OK)
        {
            ClearAuthCookies();
            return Ok(new { message = result.Message });
        }

        return StatusCode(result.StatusCode, new { message = result.Message });
    }

    [Authorize]
    [HttpGet("session")]
    public ActionResult<ProfileResponse> GetSession()
    {
        var userId = GetCurrentUserId();
        var username = User.FindFirstValue(ClaimTypes.Name);
        var fullName = User.FindFirstValue(ClaimTypes.GivenName);

        if (userId is null || string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(fullName))
        {
            return Unauthorized(new { message = "User context is missing from token." });
        }

        return Ok(new ProfileResponse
        {
            Id = userId.Value,
            FullName = fullName,
            Username = username
        });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var refreshToken = ReadRefreshToken(null);
        if (!string.IsNullOrWhiteSpace(refreshToken))
        {
            await _authService.RevokeAsync(new RevokeTokenRequest
            {
                RefreshToken = refreshToken
            }, cancellationToken);
        }

        ClearAuthCookies();
        return Ok(new { message = "Logged out successfully." });
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

        var result = await _authService.UpdateProfileAsync(userId.Value, request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : StatusCode(result.StatusCode, new { message = result.Message });
    }

    private Guid? GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out var parsedId) ? parsedId : null;
    }

    private string? ReadRefreshToken(string? refreshTokenFromRequest)
    {
        if (!string.IsNullOrWhiteSpace(refreshTokenFromRequest))
        {
            return refreshTokenFromRequest.Trim();
        }

        if (HttpContext?.Request?.Cookies is null)
        {
            return null;
        }

        return Request.Cookies.TryGetValue(RefreshTokenCookieName, out var refreshCookie)
            ? refreshCookie
            : null;
    }

    private void SetAuthCookies(AuthResponse response)
    {
        Response.Cookies.Append(
            AccessTokenCookieName,
            response.Token,
            CreateCookieOptions());

        Response.Cookies.Append(
            RefreshTokenCookieName,
            response.RefreshToken,
            CreateCookieOptions(TimeSpan.FromDays(RefreshTokenCookieDays)));
    }

    private void ClearAuthCookies()
    {
        var responseCookies = HttpContext?.Response?.Cookies;
        if (responseCookies is null)
        {
            return;
        }

        responseCookies.Delete(AccessTokenCookieName);
        responseCookies.Delete(RefreshTokenCookieName);
    }

    private CookieOptions CreateCookieOptions(TimeSpan? maxAge = null)
    {
        var isHttps = HttpContext?.Request?.IsHttps ?? false;
        var options = new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = SameSiteMode.Strict,
            Path = "/"
        };

        if (maxAge.HasValue)
        {
            options.MaxAge = maxAge;
        }

        return options;
    }
}
