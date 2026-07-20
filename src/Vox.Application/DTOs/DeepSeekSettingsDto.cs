namespace Vox.Application.DTOs;

public record DeepSeekSettingsDto(
    bool Enabled,
    string ApiKey,
    string BaseUrl,
    string Model,
    int TimeoutSeconds
);
