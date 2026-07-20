using Vox.Domain.Entities;
using Vox.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Vox.Infrastructure.Persistence.EF.Repositories;

public class DeepSeekSettingsRepository : BaseRepository<DeepSeekSettingsEntity>, IDeepSeekSettingsRepository
{
    public DeepSeekSettingsRepository(AppDbContext context) : base(context) { }

    public async Task<DeepSeekSettingsEntity?> GetSingletonAsync()
        => await Context.DeepSeekSettings.FirstOrDefaultAsync();
}
