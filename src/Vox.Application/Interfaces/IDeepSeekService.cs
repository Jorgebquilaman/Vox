using Vox.Application.DTOs;

namespace Vox.Application.Interfaces;

/// <summary>
/// Convierte texto extraído de un documento en una encuesta (CreateSurveyDto)
/// usando un modelo de lenguaje. Las implementaciones pueden usar DeepSeek u
/// un fallback demo cuando la IA no está configurada.
/// </summary>
public interface IDeepSeekService
{
    /// <summary>
    /// Genera una encuesta a partir del texto del documento.
    /// Devuelve el DTO listo para revisar/guardar y un indicador de si usó IA real.
    /// </summary>
    Task<(CreateSurveyDto Survey, bool UsedAi)> GenerateSurveyAsync(string documentText, CancellationToken ct = default);
}
