using Vox.Application.DTOs;

namespace Vox.Application.Interfaces;

public interface IPreinscripcionService
{
    Task<PreinscripcionDto?> GetByUserAsync(int userId);
    Task<PreinscripcionDto?> GetByUserIdForAdminAsync(int userId);
    Task<PreinscripcionDto> SaveDraftAsync(int userId, PreinscripcionDto dto);
    Task<PreinscripcionDto> FinalizeAsync(int userId, PreinscripcionDto dto);
    Task<object> ExportToGuaraniAsync(int userId);
}
