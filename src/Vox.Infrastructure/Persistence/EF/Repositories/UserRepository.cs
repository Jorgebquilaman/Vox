using Vox.Domain.Entities;
using Vox.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Vox.Infrastructure.Persistence.EF.Repositories;

public class UserRepository : BaseRepository<User>, IUserRepository
{
    public UserRepository(AppDbContext context) : base(context) { }

    public async Task<User?> GetByEmailAsync(string email)
        => await Context.Users.FirstOrDefaultAsync(u => u.Email == email);

    public async Task<User?> GetByExternalIdAsync(string externalId)
        => await Context.Users.FirstOrDefaultAsync(u => u.ExternalId == externalId);
}
