namespace Vox.Application.DTOs;

public record PreinscripcionDto(
    int? Id,
    string Estado,
    // a) Alta de cuenta
    string Email,
    string Apellido,
    string Nombre,
    string Nacionalidad,
    string PaisEmisorDocumento,
    string TipoDocumento,
    string NumeroDocumento,
    // b) Datos principales
    string ApellidoNombreLegal,
    string? ApellidoNombreElegido,
    string? IdentidadGenero,
    string EmailContacto,
    string? Telefono,
    // c) Datos censales
    DateTime? FechaNacimiento,
    string? LugarNacimiento,
    string? Calle,
    string? Numero,
    string? Piso,
    string? Departamento,
    string? Localidad,
    string? Provincia,
    string? Pais,
    string? CodigoPostal,
    string? EstudiosPrevios,
    string? DatosSocioeconomicos,
    // d) Propuestas
    List<PropuestaElegidaDto> Propuestas,
    // e) Documentación digital
    List<DocumentoDigitalDto> DocumentosDigitales,
    // f) Turno
    DateTime? FechaPresentacion,
    string? BandaHoraria,
    List<DocumentoIdentidadDto> DocumentosIdentidad);

public record PropuestaElegidaDto(int? Id, string UnidadAcademica, string PropuestaFormativa, string? Sede, string? Modalidad, int Orden);

public record DocumentoDigitalDto(int? Id, string Requisito, Guid? FileId, string? FileName, string? ContentType);

public record DocumentoIdentidadDto(int? Id, string Tipo, string Numero, string? PaisEmisor);
