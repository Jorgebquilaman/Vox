namespace Vox.Domain.Entities;

// Mapea a SIU-Guaraní: tabla "propuesta_carrera" / "preinscripcion_propuesta"
// (la propuesta formativa elegida por el aspirante).
public class PropuestaElegida
{
    public int Id { get; set; }
    public int AspiranteId { get; set; }
    public Aspirante? Aspirante { get; set; }

    public string UnidadAcademica { get; set; } = string.Empty;   // unidad_academica.nombre
    public string PropuestaFormativa { get; set; } = string.Empty; // propuesta_carrera.nombre
    public string? Sede { get; set; }                            // ubicación / sede
    public string? Modalidad { get; set; }                       // modalidad
    public int Orden { get; set; }                               // orden de preferencia (pre_cant_max_propuestas_preinsc)
}
