using Vox.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace Vox.Infrastructure.Integrations.SIUGuarani;

public class SiuGuaraniDisabledFallback : ISiuGuaraniIntegration
{
    private readonly ILogger<SiuGuaraniDisabledFallback> _logger;

    public SiuGuaraniDisabledFallback(ILogger<SiuGuaraniDisabledFallback> logger)
    {
        _logger = logger;
    }

    public Task<PersonaGuarani?> GetPersonaByIdAsync(string idPersona)
    {
        _logger.LogWarning("SIU-Guaraní integration is disabled. Requested: GetPersonaById({Id})", idPersona);
        return Task.FromResult<PersonaGuarani?>(null);
    }

    public Task<PersonaGuarani?> GetPersonaByDniAsync(string dni)
    {
        _logger.LogWarning("SIU-Guaraní integration is disabled. Requested: GetPersonaByDni({Dni})", dni);
        return Task.FromResult<PersonaGuarani?>(null);
    }

    public Task<PersonaGuarani?> GetPersonaByEmailAsync(string email)
    {
        _logger.LogWarning("SIU-Guaraní integration is disabled. Requested: GetPersonaByEmail({Email})", email);
        return Task.FromResult<PersonaGuarani?>(null);
    }

    public Task<IEnumerable<AlumnoCarreraGuarani>> GetCarrerasByAlumnoAsync(string idAlumno)
    {
        _logger.LogWarning("SIU-Guaraní integration is disabled. Requested: GetCarrerasByAlumno({Id})", idAlumno);
        return Task.FromResult(Enumerable.Empty<AlumnoCarreraGuarani>());
    }

    public Task<IEnumerable<NotaGuarani>> GetNotasByAlumnoAsync(string idAlumno)
    {
        _logger.LogWarning("SIU-Guaraní integration is disabled. Requested: GetNotasByAlumno({Id})", idAlumno);
        return Task.FromResult(Enumerable.Empty<NotaGuarani>());
    }

    public Task<IEnumerable<CarreraGuarani>> GetAllCarrerasAsync()
    {
        _logger.LogWarning("SIU-Guaraní integration is disabled. Requested: GetAllCarreras");
        return Task.FromResult(Enumerable.Empty<CarreraGuarani>());
    }
}
