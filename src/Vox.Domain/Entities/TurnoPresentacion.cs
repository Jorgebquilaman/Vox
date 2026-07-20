namespace Vox.Domain.Entities;

// Mapea a SIU-Guaraní: tabla "turno_presentacion" (asignación de fecha y banda horaria
// para la presentación presencial del aspirante).
public class TurnoPresentacion
{
    public int Id { get; set; }
    public int AspiranteId { get; set; }
    public Aspirante? Aspirante { get; set; }

    public DateTime Fecha { get; set; }
    public string BandaHoraria { get; set; } = string.Empty;  // mañana / tarde / noche
}
