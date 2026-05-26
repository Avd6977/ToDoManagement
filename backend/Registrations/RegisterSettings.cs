using System.Diagnostics.CodeAnalysis;
using ToDoManagement.Api.Dtos;

namespace ToDoManagement.Api.Registrations;

[ExcludeFromCodeCoverage]
public static class RegisterSettings
{
    public static void Register(WebApplicationBuilder builder)
    {
        builder.Services.Configure<JwtTokenDto>(
            builder.Configuration.GetSection("Jwt"),
            options => options.BindNonPublicProperties = true);
    }
}
