using Vox.Application.DTOs;

namespace Vox.Application.Interfaces;

public interface IAuthenticationService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
    string HashPassword(string password);
    bool VerifyPassword(string password, string hash);
    Task ChangePasswordAsync(int userId, string currentPassword, string newPassword);
    Task ForgotPasswordAsync(string email);
    Task ResetPasswordAsync(string email, string token, string newPassword);
}
