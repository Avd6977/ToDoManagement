using System.Security.Claims;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using ToDoManagement.Api.Controllers;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Services;
using ToDoManagement.Api.Services.Interfaces;
using Xunit;

namespace ToDoManagement.Api.Tests.Controllers;

public sealed class AuthControllerTests
{
    private const string AccessCookieName = "todo_access_token";
    private const string RefreshCookieName = "todo_refresh_token";

    private readonly Mock<IAuthService> _authServiceMock;
    private readonly IOptions<JwtTokenDto> _jwtOptions;

    public AuthControllerTests()
    {
        _authServiceMock = new Mock<IAuthService>();
        _jwtOptions = Options.Create(new JwtTokenDto
        {
            RefreshTokenExpiresInDays = 7
        });
    }

    [Fact]
    public async Task Register_Should_ReturnOk_WhenServiceSucceeds()
    {
        // ARRANGE
        var request = new RegisterRequest
        {
            FullName = "Alice Johnson",
            Username = "alice@todo.local",
            Password = "Strong1!"
        };

        var issuedResult = new IssuedAuthResult
        {
            Id = Guid.NewGuid(),
            FullName = "Alice Johnson",
            Username = "alice@todo.local",
            Token = "jwt-token",
            RefreshToken = "refresh-token"
        };

        var expectedResponse = new AuthResponse
        {
            Id = issuedResult.Id,
            FullName = issuedResult.FullName,
            Username = issuedResult.Username
        };

        _authServiceMock
            .Setup(x => x.RegisterAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceResult<IssuedAuthResult>.Success(issuedResult));

        var controller = CreateController();

        // ACT
        var result = await controller.Register(request, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeEquivalentTo(expectedResponse);
        controller.Response.Headers.SetCookie.ToString().Should().Contain(AccessCookieName);
        controller.Response.Headers.SetCookie.ToString().Should().Contain(RefreshCookieName);
        controller.Response.Headers.SetCookie.ToString().ToLowerInvariant().Should().Contain("max-age=604800");
    }

    [Fact]
    public async Task Register_Should_ReturnStatusCode_WhenServiceFails()
    {
        // ARRANGE
        var request = new RegisterRequest
        {
            FullName = "Alice Johnson",
            Username = "alice@todo.local",
            Password = "Strong1!"
        };

        _authServiceMock
            .Setup(x => x.RegisterAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceResult<IssuedAuthResult>.Failure(409, "Email is already taken."));

        var controller = CreateController();

        // ACT
        var result = await controller.Register(request, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(409);
    }

    [Fact]
    public async Task Revoke_Should_ReturnOk_WhenServiceReturnsStatus200()
    {
        // ARRANGE
        var request = new RevokeTokenRequest { RefreshToken = "refresh-token" };

        _authServiceMock
            .Setup(x => x.RevokeAsync(
                It.Is<RevokeTokenRequest>(r => r.RefreshToken == request.RefreshToken),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceResult.Failure(200, "Refresh token revoked successfully."));

        var controller = CreateController();

        // ACT
        var result = await controller.Revoke(request, CancellationToken.None);

        // ASSERT
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Revoke_Should_ReturnStatusCode_WhenServiceReturnsNon200()
    {
        // ARRANGE
        var request = new RevokeTokenRequest { RefreshToken = "refresh-token" };

        _authServiceMock
            .Setup(x => x.RevokeAsync(
                It.Is<RevokeTokenRequest>(r => r.RefreshToken == request.RefreshToken),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceResult.Failure(404, "Refresh token was not found."));

        var controller = CreateController();

        // ACT
        var result = await controller.Revoke(request, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task Refresh_Should_UseCookieRefreshToken_WhenRequestBodyIsMissing()
    {
        // ARRANGE
        const string refreshTokenValue = "refresh-token-cookie";
        var issuedResult = new IssuedAuthResult
        {
            Id = Guid.NewGuid(),
            FullName = "Alice Johnson",
            Username = "alice@todo.local",
            Token = "jwt-token",
            RefreshToken = "next-refresh-token"
        };

        _authServiceMock
            .Setup(x => x.RefreshAsync(
                It.Is<RefreshTokenRequest>(r => r.RefreshToken == refreshTokenValue),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceResult<IssuedAuthResult>.Success(issuedResult));

        var controller = CreateController();
        controller.ControllerContext.HttpContext.Request.Headers.Append("Cookie", $"{RefreshCookieName}={refreshTokenValue}");

        // ACT
        var result = await controller.Refresh(null, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.Result.Should().BeOfType<OkObjectResult>();
        controller.Response.Headers.SetCookie.ToString().Should().Contain(AccessCookieName);
        controller.Response.Headers.SetCookie.ToString().Should().Contain(RefreshCookieName);
    }

    [Fact]
    public async Task Logout_Should_ClearCookies_AndReturnOk()
    {
        // ARRANGE
        const string refreshTokenValue = "refresh-token-cookie";

        _authServiceMock
            .Setup(x => x.RevokeAsync(
                It.Is<RevokeTokenRequest>(r => r.RefreshToken == refreshTokenValue),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceResult.Failure(200, "Refresh token revoked successfully."));

        var controller = CreateController();
        controller.ControllerContext.HttpContext.Request.Headers.Append("Cookie", $"{RefreshCookieName}={refreshTokenValue}");

        // ACT
        var result = await controller.Logout(CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        result.Should().BeOfType<OkObjectResult>();
        controller.Response.Headers.SetCookie.ToString().Should().Contain($"{AccessCookieName}=;");
        controller.Response.Headers.SetCookie.ToString().Should().Contain($"{RefreshCookieName}=;");
    }

    [Fact]
    public async Task UpdateProfile_Should_ReturnUnauthorized_WhenUserClaimIsMissing()
    {
        // ARRANGE
        var controller = CreateController();

        // ACT
        var result = await controller.UpdateProfile(new UpdateProfileRequest
        {
            FullName = "Alice Johnson"
        }, CancellationToken.None);

        // ASSERT
        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
        _authServiceMock.Verify(
            x => x.UpdateProfileAsync(It.IsAny<Guid>(), It.IsAny<UpdateProfileRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task UpdateProfile_Should_ReturnOk_WhenServiceSucceeds()
    {
        // ARRANGE
        var userId = Guid.NewGuid();
        var request = new UpdateProfileRequest
        {
            FullName = "Alice Johnson",
            CurrentPassword = "Old1!",
            NewPassword = "NewStrong1!"
        };

        var response = new ProfileResponse
        {
            Id = userId,
            FullName = "Alice Johnson",
            Username = "alice@todo.local"
        };

        _authServiceMock
            .Setup(x => x.UpdateProfileAsync(userId, request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceResult<ProfileResponse>.Success(response));

        var controller = CreateController(userId);

        // ACT
        var result = await controller.UpdateProfile(request, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeEquivalentTo(response);
    }

    [Fact]
    public void Logout_Should_RequireAuthorizeAttribute()
    {
        // ARRANGE
        var logoutMethod = typeof(AuthController).GetMethod(nameof(AuthController.Logout));

        // ACT
        var authorizeAttribute = logoutMethod?.GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true);

        // ASSERT
        using var scope = new AssertionScope();
        logoutMethod.Should().NotBeNull();
        authorizeAttribute.Should().NotBeNull();
        authorizeAttribute!.Should().NotBeEmpty();
    }

    private AuthController CreateController(Guid? userId = null)
    {
        var controller = new AuthController(_authServiceMock.Object, _jwtOptions)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = userId.HasValue
                        ? new ClaimsPrincipal(new ClaimsIdentity(new[]
                        {
                            new Claim(ClaimTypes.NameIdentifier, userId.Value.ToString())
                        }, "TestAuth"))
                        : new ClaimsPrincipal(new ClaimsIdentity())
                }
            }
        };

        return controller;
    }
}

