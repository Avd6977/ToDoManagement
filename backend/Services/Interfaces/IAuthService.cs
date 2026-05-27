using ToDoManagement.Api.Dtos;

namespace ToDoManagement.Api.Services.Interfaces;

public interface IAuthService
{
    Task<ServiceResult<IssuedAuthResult>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);

    Task<ServiceResult<IssuedAuthResult>> LoginAsync(LoginRequest request, CancellationToken cancellationToken);

    Task<ServiceResult<IssuedAuthResult>> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken);

    Task<ServiceResult> RevokeAsync(RevokeTokenRequest request, CancellationToken cancellationToken);

    Task<ServiceResult<ProfileResponse>> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken);
}

