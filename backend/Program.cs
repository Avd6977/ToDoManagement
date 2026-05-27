using Microsoft.EntityFrameworkCore;
using ToDoManagement.Api.Data;
using ToDoManagement.Api.Middleware;
using ToDoManagement.Api.Registrations;

var builder = WebApplication.CreateBuilder(args);

RegisterSettings.Register(builder);
RegisterValidators.Register(builder);
RegisterServices.Register(builder);

var runLocalMigrationsOnStartup =
    builder.Environment.IsDevelopment()
    && builder.Configuration.GetValue("Database:RunMigrationsOnStartup", true);

var app = builder.Build();

if (runLocalMigrationsOnStartup)
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

app.UseCors("Frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
