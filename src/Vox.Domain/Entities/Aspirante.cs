using Vox.Domain.Enums;

namespace Vox.Domain.Entities;

// Mapea a SIU-Guaraní: tabla "persona" (perfil alumno / preinscripción) + "aspirante".
// Los campos de nombres buscan coincidencia 1:1 con los atributos de persona/aspirante
// para facilitar la exportación hacia el importador de Preinscripción.
public class Aspirante
{
    public int Id { get; set; }

    // Vincula con la cuenta Vox (User) que inició la preinscripción.
    public int UserId { get; set; }
    public User? User { get; set; }

    public PreinscripcionEstado Estado { get; set; } = PreinscripcionEstado.Borrador;

    // --- Bloque a) Alta de usuario / cuenta ---
    public string Email { get; set; } = string.Empty;            // persona.email
    public string Apellido { get; set; } = string.Empty;         // persona.apellido
    public string Nombre { get; set; } = string.Empty;           // persona.nombre
    public string Nacionalidad { get; set; } = string.Empty;     // tipo_documento / persona.nacionalidad (país)
    public string PaisEmisorDocumento { get; set; } = string.Empty;
    public string TipoDocumento { get; set; } = string.Empty;    // tipo_documento.codigo (DNI, CUIL, PASAPORTE, CEDULA)
    public string NumeroDocumento { get; set; } = string.Empty;  // documento.numero

    // --- Bloque b) Datos principales del aspirante ---
    public string ApellidoNombreLegal { get; set; } = string.Empty;
    public string? ApellidoNombreElegido { get; set; }           // identidad de género (nombre elegido)
    public string? IdentidadGenero { get; set; }                 // persona.identidad_genero

    public string EmailContacto { get; set; } = string.Empty;
    public string? Telefono { get; set; }

    // --- Bloque c) Datos censales ---
    public DateTime? FechaNacimiento { get; set; }               // persona.fecha_nacimiento
    public string? LugarNacimiento { get; set; }                 // localidad de nacimiento
    public string? Calle { get; set; }
    public string? Numero { get; set; }
    public string? Piso { get; set; }
    public string? Departamento { get; set; }
    public string? Localidad { get; set; }
    public string? Provincia { get; set; }
    public string? Pais { get; set; }
    public string? CodigoPostal { get; set; }
    public string? EstudiosPrevios { get; set; }                // título secundario / estudio previo
    public string? DatosSocioeconomicos { get; set; }

    // --- Bloque f) Turno de presentación ---
    public DateTime? FechaPresentacion { get; set; }
    public string? BandaHoraria { get; set; }                    // mañana / tarde / noche

    public DateTime UltimaModificacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaFinalizacion { get; set; }

    public ICollection<DocumentoIdentidad> Documentos { get; set; } = new List<DocumentoIdentidad>();
    public ICollection<PropuestaElegida> Propuestas { get; set; } = new List<PropuestaElegida>();
    public ICollection<DocumentoDigital> DocumentosDigitales { get; set; } = new List<DocumentoDigital>();
}
