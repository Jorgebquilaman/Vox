namespace Vox.Application.DTOs;

public record LoginResponseDto(string Token, string Role, string Name, string Email);
