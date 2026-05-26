namespace ToDoManagement.Api.Services;

public sealed record ServiceResult
{
    private ServiceResult(int statusCode, string? message)
    {
        StatusCode = statusCode;
        Message = message;
    }

    public int StatusCode { get; }

    public string? Message { get; }

    public bool IsSuccess => StatusCode is >= 200 and < 300;

    public static ServiceResult Success(int statusCode = StatusCodes.Status200OK) => new(statusCode, null);

    public static ServiceResult Failure(int statusCode, string message) => new(statusCode, message);
}

public sealed record ServiceResult<T>
{
    private ServiceResult(int statusCode, T? value, string? message)
    {
        StatusCode = statusCode;
        Value = value;
        Message = message;
    }

    public int StatusCode { get; }

    public T? Value { get; }

    public string? Message { get; }

    public bool IsSuccess => StatusCode is >= 200 and < 300;

    public static ServiceResult<T> Success(T value, int statusCode = StatusCodes.Status200OK) => new(statusCode, value, null);

    public static ServiceResult<T> Failure(int statusCode, string message) => new(statusCode, default, message);
}
