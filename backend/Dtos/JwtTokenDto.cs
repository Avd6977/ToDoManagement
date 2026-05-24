namespace ToDoManagement.Api.Dtos;

public sealed class JwtTokenDto
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpiresInMinutes { get; set; } = 120;
    public int RefreshTokenExpiresInDays { get; set; } = 7;
}
