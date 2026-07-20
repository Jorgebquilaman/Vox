using Vox.Domain.Entities;

namespace Vox.Domain.Interfaces;

public interface IEmailSettingsRepository : IRepository<EmailSettings>
{
    Task<EmailSettings?> GetSingletonAsync();
}
