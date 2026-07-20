using Vox.Domain.Entities;

namespace Vox.Domain.Interfaces;

public interface IAspiranteRepository
{
    Task<Aspirante?> GetByUserIdAsync(int userId);
    Task<Aspirante?> GetByIdAsync(int id);
    Task AddAsync(Aspirante aspirante);
    void Update(Aspirante aspirante);
    Task SaveChangesAsync();
}
