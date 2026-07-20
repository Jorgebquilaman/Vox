namespace Vox.Domain.Interfaces;

/// <summary>
/// Extrae el texto plano de un PDF. La implementación concreta vive en Infrastructure.
/// </summary>
public interface IPdfTextExtractor
{
    string Extract(Stream pdfStream);
}
