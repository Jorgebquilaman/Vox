using Vox.Application.DTOs;
using Vox.Application.Interfaces;
using Vox.Domain.Entities;
using Vox.Domain.Enums;
using Vox.Domain.Interfaces;

namespace Vox.Application.UseCases;

public class PreinscripcionService : IPreinscripcionService
{
    private readonly IAspiranteRepository _repository;

    public PreinscripcionService(IAspiranteRepository repository)
    {
        _repository = repository;
    }

    public async Task<PreinscripcionDto?> GetByUserAsync(int userId)
    {
        var a = await _repository.GetByUserIdAsync(userId);
        return a is null ? null : ToDto(a);
    }

    public async Task<PreinscripcionDto?> GetByUserIdForAdminAsync(int userId)
    {
        var a = await _repository.GetByUserIdAsync(userId);
        return a is null ? null : ToDto(a);
    }

    public async Task<PreinscripcionDto> SaveDraftAsync(int userId, PreinscripcionDto dto)
    {
        var a = await _repository.GetByUserIdAsync(userId) ?? new Aspirante { UserId = userId };
        Apply(dto, a);
        a.Estado = PreinscripcionEstado.Borrador;
        a.UltimaModificacion = DateTime.UtcNow;

        if (a.Id == 0) await _repository.AddAsync(a);
        else _repository.Update(a);

        await _repository.SaveChangesAsync();
        return ToDto(await _repository.GetByUserIdAsync(userId) ?? a);
    }

    public async Task<PreinscripcionDto> FinalizeAsync(int userId, PreinscripcionDto dto)
    {
        var errors = ValidateMandatory(dto);
        if (errors.Count != 0)
            throw new InvalidOperationException("Faltan campos obligatorios: " + string.Join(", ", errors));

        var a = await _repository.GetByUserIdAsync(userId) ?? new Aspirante { UserId = userId };
        Apply(dto, a);
        a.Estado = PreinscripcionEstado.Finalizado;
        a.UltimaModificacion = DateTime.UtcNow;
        a.FechaFinalizacion = DateTime.UtcNow;

        if (a.Id == 0) await _repository.AddAsync(a);
        else _repository.Update(a);

        await _repository.SaveChangesAsync();
        return ToDto(await _repository.GetByUserIdAsync(userId) ?? a);
    }

    public async Task<object> ExportToGuaraniAsync(int userId)
    {
        var a = await _repository.GetByUserIdAsync(userId)
            ?? throw new KeyNotFoundException("No hay preinscripción para exportar.");
        if (a.Estado != PreinscripcionEstado.Finalizado)
            throw new InvalidOperationException("Solo se puede exportar una preinscripción finalizada.");

        // Forma lista para el importador de SIU-Guaraní (Preinscripción 3.23).
        // Los nombres de propiedades buscan coincidir con los atributos del formulario de Guaraní.
        return new
        {
            persona = new
            {
                email = a.Email,
                apellido = a.Apellido,
                nombre = a.Nombre,
                apellido_nombre_legal = a.ApellidoNombreLegal,
                apellido_nombre_elegido = a.ApellidoNombreElegido,
                identidad_genero = a.IdentidadGenero,
                fecha_nacimiento = a.FechaNacimiento,
                nacionalidad = a.Nacionalidad,
                email_contacto = a.EmailContacto,
                telefono = a.Telefono
            },
            documentos = a.Documentos.Select(d => new { tipo = d.Tipo, numero = d.Numero, pais_emisor = d.PaisEmisor }),
            domicilio = new
            {
                calle = a.Calle,
                numero = a.Numero,
                piso = a.Piso,
                departamento = a.Departamento,
                localidad = a.Localidad,
                provincia = a.Provincia,
                pais = a.Pais,
                codigo_postal = a.CodigoPostal
            },
            propuestas = a.Propuestas.Select(p => new
            {
                unidad_academica = p.UnidadAcademica,
                propuesta_formativa = p.PropuestaFormativa,
                sede = p.Sede,
                modalidad = p.Modalidad,
                orden = p.Orden
            }),
            documentacion_digital = a.DocumentosDigitales.Select(d => new { requisito = d.Requisito, file_id = d.FileId }),
            turno = a.FechaPresentacion.HasValue
                ? new { fecha = a.FechaPresentacion, banda_horaria = a.BandaHoraria }
                : null
        };
    }

    private static void Apply(PreinscripcionDto d, Aspirante a)
    {
        a.Email = d.Email;
        a.Apellido = d.Apellido;
        a.Nombre = d.Nombre;
        a.Nacionalidad = d.Nacionalidad;
        a.PaisEmisorDocumento = d.PaisEmisorDocumento;
        a.TipoDocumento = d.TipoDocumento;
        a.NumeroDocumento = d.NumeroDocumento;
        a.ApellidoNombreLegal = d.ApellidoNombreLegal;
        a.ApellidoNombreElegido = d.ApellidoNombreElegido;
        a.IdentidadGenero = d.IdentidadGenero;
        a.EmailContacto = d.EmailContacto;
        a.Telefono = d.Telefono;
        a.FechaNacimiento = d.FechaNacimiento;
        a.LugarNacimiento = d.LugarNacimiento;
        a.Calle = d.Calle;
        a.Numero = d.Numero;
        a.Piso = d.Piso;
        a.Departamento = d.Departamento;
        a.Localidad = d.Localidad;
        a.Provincia = d.Provincia;
        a.Pais = d.Pais;
        a.CodigoPostal = d.CodigoPostal;
        a.EstudiosPrevios = d.EstudiosPrevios;
        a.DatosSocioeconomicos = d.DatosSocioeconomicos;
        a.FechaPresentacion = d.FechaPresentacion;
        a.BandaHoraria = d.BandaHoraria;

        a.Documentos = d.DocumentosIdentidad.Select(x => new DocumentoIdentidad
        {
            Id = x.Id ?? 0,
            Tipo = x.Tipo,
            Numero = x.Numero,
            PaisEmisor = x.PaisEmisor
        }).ToList();

        a.Propuestas = d.Propuestas.Select(x => new PropuestaElegida
        {
            Id = x.Id ?? 0,
            UnidadAcademica = x.UnidadAcademica,
            PropuestaFormativa = x.PropuestaFormativa,
            Sede = x.Sede,
            Modalidad = x.Modalidad,
            Orden = x.Orden
        }).ToList();

        a.DocumentosDigitales = d.DocumentosDigitales.Select(x => new DocumentoDigital
        {
            Id = x.Id ?? 0,
            Requisito = x.Requisito,
            FileId = x.FileId,
            FileName = x.FileName,
            ContentType = x.ContentType
        }).ToList();
    }

    private static List<string> ValidateMandatory(PreinscripcionDto d)
    {
        var e = new List<string>();
        if (string.IsNullOrWhiteSpace(d.Email)) e.Add("Email");
        if (string.IsNullOrWhiteSpace(d.Apellido)) e.Add("Apellido");
        if (string.IsNullOrWhiteSpace(d.Nombre)) e.Add("Nombre");
        if (string.IsNullOrWhiteSpace(d.TipoDocumento)) e.Add("Tipo de documento");
        if (string.IsNullOrWhiteSpace(d.NumeroDocumento)) e.Add("Número de documento");
        if (string.IsNullOrWhiteSpace(d.ApellidoNombreLegal)) e.Add("Apellido y nombre legal");
        if (string.IsNullOrWhiteSpace(d.EmailContacto)) e.Add("Email de contacto");
        if (d.Propuestas.Count == 0) e.Add("Al menos una propuesta formativa");
        if (d.DocumentosIdentidad.Count == 0) e.Add("Al menos un documento de identidad");
        return e;
    }

    private static PreinscripcionDto ToDto(Aspirante a) => new(
        a.Id,
        a.Estado.ToString(),
        a.Email, a.Apellido, a.Nombre, a.Nacionalidad, a.PaisEmisorDocumento, a.TipoDocumento, a.NumeroDocumento,
        a.ApellidoNombreLegal, a.ApellidoNombreElegido, a.IdentidadGenero, a.EmailContacto, a.Telefono,
        a.FechaNacimiento, a.LugarNacimiento, a.Calle, a.Numero, a.Piso, a.Departamento,
        a.Localidad, a.Provincia, a.Pais, a.CodigoPostal, a.EstudiosPrevios, a.DatosSocioeconomicos,
        a.Propuestas.Select(p => new PropuestaElegidaDto(p.Id, p.UnidadAcademica, p.PropuestaFormativa, p.Sede, p.Modalidad, p.Orden)).ToList(),
        a.DocumentosDigitales.Select(d => new DocumentoDigitalDto(d.Id, d.Requisito, d.FileId, d.FileName, d.ContentType)).ToList(),
        a.FechaPresentacion, a.BandaHoraria,
        a.Documentos.Select(d => new DocumentoIdentidadDto(d.Id, d.Tipo, d.Numero, d.PaisEmisor)).ToList());
}
