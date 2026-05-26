using Microsoft.EntityFrameworkCore;
using ToDoManagement.Api.Data;
using ToDoManagement.Api.Registrations;

var builder = WebApplication.CreateBuilder(args);

RegisterSettings.Register(builder);
RegisterValidators.Register(builder);
RegisterServices.Register(builder);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
