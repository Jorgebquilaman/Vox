namespace Vox.Domain.Entities;

// Mapea a SIU-Guaraní: tabla "documento" (documentos de identificación de la persona).
// Un aspirante puede tener más de un documento de identificación.
public class DocumentoIdentidad
{
    public int Id { get; set; }
    public int AspiranteId { get; set; }
    public Aspirante? Aspirante { get; set; }

    public string Tipo { get; set; } = string.Empty;      // tipo_documento.codigo
    public string Numero { get; set; } = string.Empty;    // documento.numero
    public string? PaisEmisor { get; set; }
}
