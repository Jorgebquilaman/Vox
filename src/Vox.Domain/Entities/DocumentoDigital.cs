namespace Vox.Domain.Entities;

// Mapea a SIU-Guaraní: requisito de ingreso documental cargado digitalmente
// (tabla "requisito_ingreso" / archivos del trámite de preinscripción).
// El archivo físico se guarda vía IFileStorageService y se referencia por FileId.
public class DocumentoDigital
{
    public int Id { get; set; }
    public int AspiranteId { get; set; }
    public Aspirante? Aspirante { get; set; }

    public string Requisito { get; set; } = string.Empty;   // código/nombre del requisito documental
    public Guid? FileId { get; set; }                       // referencia al storage
    public string? FileName { get; set; }
    public string? ContentType { get; set; }
}
