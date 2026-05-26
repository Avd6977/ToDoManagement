using FluentAssertions;
using FluentAssertions.Execution;
using ToDoManagement.Api.Services;
using Xunit;

namespace ToDoManagement.Api.Tests.Services;

public sealed class DateTimeServiceTests
{
    private readonly DateTimeService _service = new();

    [Fact]
    public void UtcNow_Should_BeCloseToCurrentUtcTime()
    {
        // ARRANGE
        var before = DateTime.UtcNow;

        // ACT
        var actual = _service.UtcNow;

        // ASSERT
        var after = DateTime.UtcNow;
        using var scope = new AssertionScope();
        actual.Should().BeOnOrAfter(before);
        actual.Should().BeOnOrBefore(after);
    }
}

