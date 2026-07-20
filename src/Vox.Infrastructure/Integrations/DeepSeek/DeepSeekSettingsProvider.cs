using Microsoft.Extensions.Options;
using Vox.Domain.Interfaces;
using Vox.Infrastructure.Integrations.DeepSeek;

namespace Vox.Infrastructure.Integrations.DeepSeek;

public interface IDeepSeekSettingsProvider
{
    Task<DeepSeekSettings> GetEffectiveSettingsAsync();
}

public class DeepSeekSettingsProvider : IDeepSeekSettingsProvider
{
    private readonly IDeepSeekSettingsRepository _repository;
    private readonly DeepSeekSettings _fallback;

    public DeepSeekSettingsProvider(
        IDeepSeekSettingsRepository repository,
        IOptions<DeepSeekSettings> fallback)
    {
        _repository = repository;
        _fallback = fallback.Value;
    }

    public async Task<DeepSeekSettings> GetEffectiveSettingsAsync()
    {
        var stored = await _repository.GetSingletonAsync();
        if (stored is null)
            return _fallback;

        return new DeepSeekSettings
        {
            Enabled = stored.Enabled,
            ApiKey = stored.ApiKey,
            BaseUrl = string.IsNullOrWhiteSpace(stored.BaseUrl) ? _fallback.BaseUrl : stored.BaseUrl,
            Model = string.IsNullOrWhiteSpace(stored.Model) ? _fallback.Model : stored.Model,
            TimeoutSeconds = stored.TimeoutSeconds <= 0 ? _fallback.TimeoutSeconds : stored.TimeoutSeconds
        };
    }
}
