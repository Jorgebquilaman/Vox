using Vox.Domain.Entities;
using Vox.Domain.Interfaces;
using Vox.Infrastructure.Persistence.EF;
using Microsoft.EntityFrameworkCore;

namespace Vox.Infrastructure.Persistence.EF.Repositories;

public class AspiranteRepository : IAspiranteRepository
{
    private readonly AppDbContext _ctx;

    public AspiranteRepository(AppDbContext ctx) => _ctx = ctx;

    public async Task<Aspirante?> GetByUserIdAsync(int userId) =>
        await _ctx.Aspirantes
            .Include(a => a.Documentos)
            .Include(a => a.Propuestas)
            .Include(a => a.DocumentosDigitales)
            .FirstOrDefaultAsync(a => a.UserId == userId);

    public async Task<Aspirante?> GetByIdAsync(int id) =>
        await _ctx.Aspirantes
            .Include(a => a.Documentos)
            .Include(a => a.Propuestas)
            .Include(a => a.DocumentosDigitales)
            .FirstOrDefaultAsync(a => a.Id == id);

    public async Task AddAsync(Aspirante aspirante) => await _ctx.Aspirantes.AddAsync(aspirante);

    public void Update(Aspirante aspirante) => _ctx.Aspirantes.Update(aspirante);

    public async Task SaveChangesAsync() => await _ctx.SaveChangesAsync();
}
