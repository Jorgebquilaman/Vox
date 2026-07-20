using Vox.Application.DTOs;
using Vox.Application.Interfaces;
using Vox.Domain.Interfaces;

namespace Vox.Application.UseCases;

public class SurveyAIService : ISurveyAIService
{
    private readonly IDeepSeekService _deepSeek;
    private readonly IPdfTextExtractor _pdfExtractor;
    private const int MaxTextLength = 12000;

    public SurveyAIService(IDeepSeekService deepSeek, IPdfTextExtractor pdfExtractor)
    {
        _deepSeek = deepSeek;
        _pdfExtractor = pdfExtractor;
    }

    public async Task<(CreateSurveyDto Survey, bool UsedAi)> GenerateFromPdfAsync(
        Stream pdfStream, string fileName, CancellationToken ct = default)
    {
        if (!string.Equals(Path.GetExtension(fileName).Trim(), ".pdf", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("El archivo debe ser un PDF.");

        var text = _pdfExtractor.Extract(pdfStream);
        if (string.IsNullOrWhiteSpace(text))
            throw new InvalidOperationException("No se pudo extraer texto del PDF. Verificá que no sea una imagen escaneada.");

        if (text.Length > MaxTextLength)
            text = text[..MaxTextLength];

        return await _deepSeek.GenerateSurveyAsync(text, ct);
    }
}
