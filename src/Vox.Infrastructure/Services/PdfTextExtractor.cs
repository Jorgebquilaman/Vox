using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;
using Vox.Domain.Interfaces;

namespace Vox.Infrastructure.Services;

/// <summary>
/// Extrae el texto plano de un PDF (PdfPig) para alimentar al generador de encuestas con IA.
/// </summary>
public class PdfTextExtractor : IPdfTextExtractor
{
    public string Extract(Stream pdfStream)
    {
        if (pdfStream is null || pdfStream.Length == 0)
            return string.Empty;

        if (pdfStream.CanSeek)
            pdfStream.Position = 0;

        var text = new System.Text.StringBuilder();
        using var document = PdfDocument.Open(pdfStream);

        foreach (var page in document.GetPages())
        {
            foreach (var word in page.GetWords())
            {
                text.Append(word.Text).Append(' ');
            }
            text.AppendLine();
        }

        return text.ToString().Trim();
    }
}
