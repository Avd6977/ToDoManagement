namespace ToDoManagement.Api.Dtos;

public sealed class UserSearchResult
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
}
