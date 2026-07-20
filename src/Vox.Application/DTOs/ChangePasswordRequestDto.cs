namespace Vox.Application.DTOs;

public record ChangePasswordRequestDto(string CurrentPassword, string NewPassword);
