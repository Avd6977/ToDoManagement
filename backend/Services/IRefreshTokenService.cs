namespace ToDoManagement.Api.Services;

public interface IRefreshTokenService
{
    string GenerateToken();
    string HashToken(string token);
}
