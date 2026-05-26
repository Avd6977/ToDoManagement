using ToDoManagement.Api.Models;

namespace ToDoManagement.Api.Services.Interfaces;

public interface IJwtTokenService
{
    string CreateToken(User user);
}

