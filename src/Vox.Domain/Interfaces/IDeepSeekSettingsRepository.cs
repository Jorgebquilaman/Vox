using Vox.Domain.Entities;

namespace Vox.Domain.Interfaces;

public interface IDeepSeekSettingsRepository : IRepository<DeepSeekSettingsEntity>
{
    Task<DeepSeekSettingsEntity?> GetSingletonAsync();
}
