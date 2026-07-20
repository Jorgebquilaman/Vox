using Vox.Domain.Entities;
using Vox.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Vox.Infrastructure.Persistence.EF.Repositories;

public class EmailSettingsRepository : BaseRepository<EmailSettings>, IEmailSettingsRepository
{
    public EmailSettingsRepository(AppDbContext context) : base(context) { }

    public async Task<EmailSettings?> GetSingletonAsync()
        => await Context.EmailSettings.FirstOrDefaultAsync();
}
