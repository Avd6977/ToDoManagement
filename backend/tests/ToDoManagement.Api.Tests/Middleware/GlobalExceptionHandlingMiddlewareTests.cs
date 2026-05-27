using System.Text;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using ToDoManagement.Api.Middleware;
using Xunit;

namespace ToDoManagement.Api.Tests.Middleware;

public sealed class GlobalExceptionHandlingMiddlewareTests
{
    [Fact]
    public async Task Invoke_ShouldReturn500AndJson_WhenUnhandledExceptionOccurs()
    {
        // ARRANGE
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        RequestDelegate next = _ => throw new InvalidOperationException("boom");
        var loggerMock = new Mock<ILogger<GlobalExceptionHandlingMiddleware>>();
        var middleware = new GlobalExceptionHandlingMiddleware(next, loggerMock.Object);

        // ACT
        await middleware.Invoke(context);

        // ASSERT
        context.Response.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
        context.Response.ContentType.Should().Be("application/json");

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body, Encoding.UTF8);
        var payload = await reader.ReadToEndAsync();
        payload.Should().Contain("An unexpected error occurred.");
    }

    [Fact]
    public async Task Invoke_ShouldCallNext_WhenNoExceptionOccurs()
    {
        // ARRANGE
        var context = new DefaultHttpContext();
        var wasInvoked = false;

        RequestDelegate next = _ =>
        {
            wasInvoked = true;
            return Task.CompletedTask;
        };

        var loggerMock = new Mock<ILogger<GlobalExceptionHandlingMiddleware>>();
        var middleware = new GlobalExceptionHandlingMiddleware(next, loggerMock.Object);

        // ACT
        await middleware.Invoke(context);

        // ASSERT
        wasInvoked.Should().BeTrue();
        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
    }
}
