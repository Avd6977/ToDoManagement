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
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.RegisterAsync(request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : StatusCode(result.StatusCode, new { message = result.Message });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : StatusCode(result.StatusCode, new { message = result.Message });
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.RefreshAsync(request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : StatusCode(result.StatusCode, new { message = result.Message });
    }

    [HttpPost("revoke")]
    public async Task<IActionResult> Revoke(RevokeTokenRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.RevokeAsync(request, cancellationToken);
        if (result.StatusCode == StatusCodes.Status200OK)
        {
            return Ok(new { message = result.Message });
        }

        return StatusCode(result.StatusCode, new { message = result.Message });
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ForgotPasswordResponse>> ForgotPassword(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _authService.ForgotPasswordAsync(request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : StatusCode(result.StatusCode, new { message = result.Message });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        ResetPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _authService.ResetPasswordAsync(request, cancellationToken);
        return result.StatusCode == StatusCodes.Status200OK
            ? Ok(new { message = result.Message })
            : StatusCode(result.StatusCode, new { message = result.Message });
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
}
