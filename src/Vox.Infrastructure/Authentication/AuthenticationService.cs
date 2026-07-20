using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Vox.Application.DTOs;
using Vox.Application.Interfaces;
using Vox.Domain.Entities;
using Vox.Domain.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Vox.Infrastructure.Authentication;

public class AuthenticationService : IAuthenticationService
{
    private readonly IUserRepository _userRepository;
    private readonly IEmailSettingsRepository _emailSettingsRepository;
    private readonly IEmailService _emailService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly JwtSettings _jwtSettings;

    public AuthenticationService(
        IUserRepository userRepository,
        IEmailSettingsRepository emailSettingsRepository,
        IEmailService emailService,
        IUnitOfWork unitOfWork,
        IOptions<JwtSettings> jwtSettings)
    {
        _userRepository = userRepository;
        _emailSettingsRepository = emailSettingsRepository;
        _emailService = emailService;
        _unitOfWork = unitOfWork;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email)
            ?? throw new UnauthorizedAccessException("Credenciales inválidas.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Usuario desactivado.");

        if (!VerifyPassword(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Credenciales inválidas.");

        var token = GenerateJwtToken(user);

        return new LoginResponseDto(token, user.Role.ToString(), user.Name, user.Email);
    }

    public async Task ChangePasswordAsync(int userId, string currentPassword, string newPassword)
    {
        var user = await _userRepository.GetByIdAsync(userId)
            ?? throw new UnauthorizedAccessException("Usuario no encontrado.");

        if (!VerifyPassword(currentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException("La contraseña actual no es correcta.");

        user.PasswordHash = HashPassword(newPassword);
        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task ForgotPasswordAsync(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user is null || !user.IsActive)
            return;

        var tokenBytes = RandomNumberGenerator.GetBytes(32);
        var token = Convert.ToBase64String(tokenBytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
        user.PasswordResetToken = token;
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync();

        var settings = await _emailSettingsRepository.GetSingletonAsync();
        if (settings is null || !settings.Enabled)
            return;

        try
        {
            var resetLink = $"{_jwtSettings.FrontendBaseUrl}/reset-password?email={Uri.EscapeDataString(user.Email)}&token={token}";
            var body = BuildResetEmailHtml(user.Name, resetLink);
            await _emailService.SendAsync(user.Email, "Recuperar contraseña - Vox IUPA", body, settings);
        }
        catch
        {
            // El token ya fue generado; no revelamos el error de envío al cliente.
        }
    }

    public async Task ResetPasswordAsync(string email, string token, string newPassword)
    {
        var user = await _userRepository.GetByEmailAsync(email)
            ?? throw new KeyNotFoundException("No se encontró un usuario con ese correo.");

        if (user.PasswordResetToken != token)
            throw new UnauthorizedAccessException("El token de recuperación es inválido.");

        if (user.PasswordResetTokenExpiry is null || user.PasswordResetTokenExpiry < DateTime.UtcNow)
            throw new UnauthorizedAccessException("El token de recuperación ha expirado.");

        if (newPassword.Length < 6)
            throw new ArgumentException("La contraseña debe tener al menos 6 caracteres.");

        user.PasswordHash = HashPassword(newPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync();
    }

    private static string BuildResetEmailHtml(string name, string resetLink)
    {
        return $@"<div style='font-family:Segoe UI,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a'>
  <h2 style='color:#1e3a5f;margin-bottom:8px'>Recuperar tu contraseña</h2>
  <p>Hola {name},</p>
  <p>Recibimos una solicitud para restablecer tu contraseña. Hacé clic en el botón para continuar. El enlace es válido por 1 hora.</p>
  <p style='margin:24px 0'>
    <a href='{resetLink}' style='background:#1e3a5f;color:#ffffff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600'>Restablecer contraseña</a>
  </p>
  <p style='color:#64748b;font-size:13px'>Si no solicitaste este cambio, podés ignorar este mensaje.</p>
</div>";
    }

    public string HashPassword(string password) => BCrypt.Net.BCrypt.HashPassword(password);

    public bool VerifyPassword(string password, string hash) => BCrypt.Net.BCrypt.Verify(password, hash);

    private string GenerateJwtToken(Domain.Entities.User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationInMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
