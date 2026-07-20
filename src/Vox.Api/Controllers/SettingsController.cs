using Vox.Application.DTOs;
using Vox.Application.Interfaces;
using Vox.Domain.Entities;
using Vox.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Vox.Api.Controllers;

[ApiController]
[Route("api/settings")]
[Authorize(Roles = "Admin")]
public class SettingsController : ControllerBase
{
    private readonly IEmailSettingsRepository _emailSettingsRepository;
    private readonly IEmailService _emailService;
    private readonly IDeepSeekSettingsRepository _deepSeekSettingsRepository;
    private readonly IUnitOfWork _unitOfWork;

    public SettingsController(
        IEmailSettingsRepository emailSettingsRepository,
        IEmailService emailService,
        IDeepSeekSettingsRepository deepSeekSettingsRepository,
        IUnitOfWork unitOfWork)
    {
        _emailSettingsRepository = emailSettingsRepository;
        _emailService = emailService;
        _deepSeekSettingsRepository = deepSeekSettingsRepository;
        _unitOfWork = unitOfWork;
    }

    [HttpGet("email")]
    public async Task<IActionResult> GetEmailSettings()
    {
        var settings = await _emailSettingsRepository.GetSingletonAsync();
        if (settings is null) return Ok(new EmailSettingsDto(false, "smtp.gmail.com", 587, true, "", "", "", "Vox IUPA"));

        return Ok(new EmailSettingsDto(
            settings.Enabled,
            settings.SmtpHost,
            settings.SmtpPort,
            settings.UseSsl,
            settings.Username,
            string.Empty,
            settings.FromAddress,
            settings.FromName));
    }

    [HttpPut("email")]
    public async Task<IActionResult> SaveEmailSettings([FromBody] EmailSettingsDto dto)
    {
        var settings = await _emailSettingsRepository.GetSingletonAsync();
        if (settings is null)
        {
            settings = new EmailSettings { Id = 1 };
            await _emailSettingsRepository.AddAsync(settings);
        }

        settings.Enabled = dto.Enabled;
        settings.SmtpHost = dto.SmtpHost;
        settings.SmtpPort = dto.SmtpPort;
        settings.UseSsl = dto.UseSsl;
        settings.Username = dto.Username;
        if (!string.IsNullOrEmpty(dto.Password))
            settings.Password = dto.Password;
        settings.FromAddress = dto.FromAddress;
        settings.FromName = dto.FromName;
        settings.UpdatedAt = DateTime.UtcNow;

        _emailSettingsRepository.Update(settings);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new { message = "Configuración de correo guardada." });
    }

    [HttpPost("email/test")]
    public async Task<IActionResult> TestEmail([FromBody] TestEmailRequestDto dto)
    {
        var settings = await _emailSettingsRepository.GetSingletonAsync()
            ?? throw new InvalidOperationException("No hay configuración de correo.");

        if (!settings.Enabled)
            return BadRequest(new { message = "El envío de correo está desactivado." });

        var body = "<div style='font-family:Segoe UI,Helvetica,Arial,sans-serif;padding:24px;color:#0f172a'><h2 style='color:#1e3a5f'>Correo de prueba</h2><p>Este es un mensaje de prueba enviado desde Vox IUPA.</p></div>";
        await _emailService.SendAsync(dto.To, "Correo de prueba - Vox IUPA", body, settings);

        return Ok(new { message = $"Correo de prueba enviado a {dto.To}." });
    }

    [HttpGet("deepseek")]
    public async Task<IActionResult> GetDeepSeekSettings()
    {
        var settings = await _deepSeekSettingsRepository.GetSingletonAsync();
        if (settings is null)
            return Ok(new DeepSeekSettingsDto(false, "", "https://api.deepseek.com", "deepseek-chat", 120));

        return Ok(new DeepSeekSettingsDto(
            settings.Enabled,
            string.Empty,
            settings.BaseUrl,
            settings.Model,
            settings.TimeoutSeconds));
    }

    [HttpPut("deepseek")]
    public async Task<IActionResult> SaveDeepSeekSettings([FromBody] DeepSeekSettingsDto dto)
    {
        var settings = await _deepSeekSettingsRepository.GetSingletonAsync();
        if (settings is null)
        {
            settings = new DeepSeekSettingsEntity { Id = 1 };
            await _deepSeekSettingsRepository.AddAsync(settings);
        }

        settings.Enabled = dto.Enabled;
        settings.BaseUrl = string.IsNullOrWhiteSpace(dto.BaseUrl) ? "https://api.deepseek.com" : dto.BaseUrl;
        settings.Model = string.IsNullOrWhiteSpace(dto.Model) ? "deepseek-chat" : dto.Model;
        settings.TimeoutSeconds = dto.TimeoutSeconds > 0 ? dto.TimeoutSeconds : 120;
        if (!string.IsNullOrEmpty(dto.ApiKey))
            settings.ApiKey = dto.ApiKey;
        settings.UpdatedAt = DateTime.UtcNow;

        _deepSeekSettingsRepository.Update(settings);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new { message = "Configuración de IA (DeepSeek) guardada." });
    }
}
