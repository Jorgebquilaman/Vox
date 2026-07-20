namespace Vox.Application.DTOs;

public record UserDto(int Id, string Name, string Email, string Role, bool IsActive, DateTime CreatedAt);

public record CreateUserDto(string Name, string Email, string Password, string Role);
