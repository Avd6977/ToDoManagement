using ToDoManagement.Api.Models;

namespace ToDoManagement.Api.Services;

public interface IJwtTokenService
{
    string CreateToken(User user);
}
