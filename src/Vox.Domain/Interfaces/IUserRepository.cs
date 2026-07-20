using Vox.Domain.Entities;

namespace Vox.Domain.Interfaces;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByExternalIdAsync(string externalId);
}
