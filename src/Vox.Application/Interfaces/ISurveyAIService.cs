using Vox.Application.DTOs;

namespace Vox.Application.Interfaces;

public interface ISurveyAIService
{
    /// <summary>
    /// Genera una encuesta a partir del contenido de un PDF.
    /// </summary>
    /// <param name="pdfStream">Stream del PDF subido.</param>
    /// <param name="fileName">Nombre del archivo (solo para validar extensión).</param>
    /// <param name="ct"></param>
    /// <returns>La encuesta generada y si se usó IA real (false = fallback demo).</returns>
    Task<(CreateSurveyDto Survey, bool UsedAi)> GenerateFromPdfAsync(Stream pdfStream, string fileName, CancellationToken ct = default);
}
