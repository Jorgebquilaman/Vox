namespace Vox.Application.Interfaces;

public record PersonaGuarani(
    string IdPersona,
    string Nombre,
    string Apellido,
    string? Email,
    string? Dni,
    string? IdAlumno
);

public record CarreraGuarani(string IdCarrera, string Nombre, string? Codigo);

public record AlumnoCarreraGuarani(
    string IdPersona,
    string IdAlumno,
    string IdCarrera,
    string NombreCarrera,
    string Estado
);

public record NotaGuarani(
    string IdAlumno,
    string IdMateria,
    string NombreMateria,
    decimal Nota,
    string Estado
);

public interface ISiuGuaraniIntegration
{
    Task<PersonaGuarani?> GetPersonaByIdAsync(string idPersona);
    Task<PersonaGuarani?> GetPersonaByDniAsync(string dni);
    Task<PersonaGuarani?> GetPersonaByEmailAsync(string email);
    Task<IEnumerable<AlumnoCarreraGuarani>> GetCarrerasByAlumnoAsync(string idAlumno);
    Task<IEnumerable<NotaGuarani>> GetNotasByAlumnoAsync(string idAlumno);
    Task<IEnumerable<CarreraGuarani>> GetAllCarrerasAsync();
}
