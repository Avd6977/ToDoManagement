using System.Security.Claims;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using ToDoManagement.Api.Controllers;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Services;
using ToDoManagement.Api.Services.Interfaces;
using Xunit;

namespace ToDoManagement.Api.Tests.Controllers;

public sealed class AuthControllerTests
{
    private readonly Mock<IAuthService> _authServiceMock;

    public AuthControllerTests()
    {
        _authServiceMock = new Mock<IAuthService>();
    }

    [Fact]
    public async Task Register_Should_ReturnOk_WhenServiceSucceeds()
    {
        // ARRANGE
        var request = new RegisterRequest
        {
            FullName = "Alice Johnson",
            Username = "alice",
            Password = "Strong1!"
        };

        var response = new AuthResponse
        {
            Id = Guid.NewGuid(),
            FullName = "Alice Johnson",
            Username = "alice",
            Token = "jwt-token",
            RefreshToken = "refresh-token"
        };

        _authServiceMock
            .Setup(x => x.RegisterAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceResult<AuthResponse>.Success(response));

        var controller = CreateController();

        // ACT
        var result = await controller.Register(request, CancellationToken.None);

        // ASSERT
        using var scope = new AssertionScope();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeEquivalentTo(response);
    }

    [Fact]
    public async Task Register_Should_ReturnStatusCode_WhenServiceFails()
    {
        // ARRANGE
        var request = new RegisterRequest
        {
            FullName = "Alice Johnson",
            Username = "alice",
            Password = "Strong1!"
        };

        _authServiceMock
            .Setup(x => x.RegisterAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceResult<AuthResponse>.Failure(409, "Username is already taken."));

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
            .Setup(x => x.RevokeAsync(request, It.IsAny<CancellationToken>()))
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
            .Setup(x => x.RevokeAsync(request, It.IsAny<CancellationToken>()))
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
            Username = "alice"
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

    private AuthController CreateController(Guid? userId = null)
    {
        var controller = new AuthController(_authServiceMock.Object)
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

