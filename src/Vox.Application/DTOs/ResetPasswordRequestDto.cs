namespace Vox.Application.DTOs;

public record ResetPasswordRequestDto(string Email, string Token, string NewPassword);
