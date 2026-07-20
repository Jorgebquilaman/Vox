namespace Vox.Application.DTOs;

public record EmailSettingsDto(
    bool Enabled,
    string SmtpHost,
    int SmtpPort,
    bool UseSsl,
    string Username,
    string Password,
    string FromAddress,
    string FromName
);
