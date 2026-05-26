using System.Diagnostics.CodeAnalysis;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ToDoManagement.Api.Data;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Services;
using ToDoManagement.Api.Services.Interfaces;

namespace ToDoManagement.Api.Registrations;

[ExcludeFromCodeCoverage]
public static class RegisterServices
{
    public static void Register(WebApplicationBuilder builder)
    {
        builder.Services.AddControllers();
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        builder.Services.AddDbContext<AppDbContext>(options =>
        {
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Database connection string is not configured.");
            options.UseSqlite(connectionString);
        });

        builder.Services.AddScoped<IPasswordHasherService, PasswordHasherService>();
        builder.Services.AddScoped<IDateTimeService, DateTimeService>();
        builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
        builder.Services.AddScoped<IRefreshTokenService, RefreshTokenService>();
        builder.Services.AddScoped<IAuthService, AuthService>();
        builder.Services.AddScoped<ITaskService, TaskService>();

        var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtTokenDto>()
            ?? throw new InvalidOperationException("Jwt configuration is missing.");

        if (string.IsNullOrWhiteSpace(jwtSettings.Key))
        {
            throw new InvalidOperationException("Jwt:Key is missing from configuration.");
        }

        builder.Services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        if (string.IsNullOrWhiteSpace(context.Token)
                            && context.Request.Cookies.TryGetValue("todo_access_token", out var cookieToken)
                            && !string.IsNullOrWhiteSpace(cookieToken))
                        {
                            context.Token = cookieToken;
                        }

                        return Task.CompletedTask;
                    }
                };

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidAudience = jwtSettings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key))
                };
            });

        builder.Services.AddAuthorization();

        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:5173"];

        builder.Services.AddCors(options =>
        {
            options.AddPolicy("Frontend", policy =>
                policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials());
        });
    }
}
