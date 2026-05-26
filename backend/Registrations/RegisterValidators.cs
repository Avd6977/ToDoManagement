using System.Diagnostics.CodeAnalysis;
using FluentValidation;
using SharpGrip.FluentValidation.AutoValidation.Mvc.Extensions;

namespace ToDoManagement.Api.Registrations;

[ExcludeFromCodeCoverage]
public static class RegisterValidators
{
    public static void Register(WebApplicationBuilder builder)
    {
        builder.Services.AddFluentValidationAutoValidation();
        builder.Services.AddValidatorsFromAssemblyContaining<Program>();
    }
}
