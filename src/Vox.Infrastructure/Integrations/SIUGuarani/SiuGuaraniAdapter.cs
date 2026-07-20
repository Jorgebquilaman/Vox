using System.Data;
using Vox.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Npgsql;

namespace Vox.Infrastructure.Integrations.SIUGuarani;

public class SiuGuaraniAdapter : ISiuGuaraniIntegration, IDisposable
{
    private readonly SiuGuaraniSettings _settings;
    private readonly ILogger<SiuGuaraniAdapter> _logger;
    private NpgsqlConnection? _connection;

    public SiuGuaraniAdapter(IOptions<SiuGuaraniSettings> settings, ILogger<SiuGuaraniAdapter> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    private async Task<NpgsqlConnection> GetConnectionAsync()
    {
        if (_connection is null || _connection.State != ConnectionState.Open)
        {
            _connection = new NpgsqlConnection(_settings.ConnectionString);
            await _connection.OpenAsync();
        }
        return _connection;
    }

    public async Task<PersonaGuarani?> GetPersonaByIdAsync(string idPersona)
    {
        try
        {
            await using var conn = await GetConnectionAsync();
            await using var cmd = new NpgsqlCommand(
                @"SELECT id_persona, nombre, apellido, email, nro_documento, id_alumno
                  FROM sg.personas WHERE id_persona = @id", conn);
            cmd.Parameters.AddWithValue("@id", idPersona);

            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new PersonaGuarani(
                    reader.GetString(0), reader.GetString(1), reader.GetString(2),
                    reader.IsDBNull(3) ? null : reader.GetString(3),
                    reader.IsDBNull(4) ? null : reader.GetString(4),
                    reader.IsDBNull(5) ? null : reader.GetString(5));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener persona desde Guaraní: {IdPersona}", idPersona);
        }
        return null;
    }

    public async Task<PersonaGuarani?> GetPersonaByDniAsync(string dni)
    {
        try
        {
            await using var conn = await GetConnectionAsync();
            await using var cmd = new NpgsqlCommand(
                @"SELECT id_persona, nombre, apellido, email, nro_documento, id_alumno
                  FROM sg.personas WHERE nro_documento = @dni", conn);
            cmd.Parameters.AddWithValue("@dni", dni);

            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new PersonaGuarani(
                    reader.GetString(0), reader.GetString(1), reader.GetString(2),
                    reader.IsDBNull(3) ? null : reader.GetString(3),
                    reader.IsDBNull(4) ? null : reader.GetString(4),
                    reader.IsDBNull(5) ? null : reader.GetString(5));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener persona por DNI desde Guaraní: {Dni}", dni);
        }
        return null;
    }

    public async Task<PersonaGuarani?> GetPersonaByEmailAsync(string email)
    {
        try
        {
            await using var conn = await GetConnectionAsync();
            await using var cmd = new NpgsqlCommand(
                @"SELECT id_persona, nombre, apellido, email, nro_documento, id_alumno
                  FROM sg.personas WHERE email = @email", conn);
            cmd.Parameters.AddWithValue("@email", email);

            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new PersonaGuarani(
                    reader.GetString(0), reader.GetString(1), reader.GetString(2),
                    reader.IsDBNull(3) ? null : reader.GetString(3),
                    reader.IsDBNull(4) ? null : reader.GetString(4),
                    reader.IsDBNull(5) ? null : reader.GetString(5));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener persona por email desde Guaraní: {Email}", email);
        }
        return null;
    }

    public async Task<IEnumerable<AlumnoCarreraGuarani>> GetCarrerasByAlumnoAsync(string idAlumno)
    {
        var result = new List<AlumnoCarreraGuarani>();
        try
        {
            await using var conn = await GetConnectionAsync();
            await using var cmd = new NpgsqlCommand(
                @"SELECT a.id_persona, a.id_alumno, a.id_carrera, c.nombre, a.estado
                  FROM sg.alumnos_carrera a
                  JOIN sg.carreras c ON a.id_carrera = c.id_carrera
                  WHERE a.id_alumno = @idAlumno", conn);
            cmd.Parameters.AddWithValue("@idAlumno", idAlumno);

            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                result.Add(new AlumnoCarreraGuarani(
                    reader.GetString(0), reader.GetString(1), reader.GetString(2),
                    reader.GetString(3), reader.GetString(4)));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener carreras desde Guaraní: {IdAlumno}", idAlumno);
        }
        return result;
    }

    public async Task<IEnumerable<NotaGuarani>> GetNotasByAlumnoAsync(string idAlumno)
    {
        var result = new List<NotaGuarani>();
        try
        {
            await using var conn = await GetConnectionAsync();
            await using var cmd = new NpgsqlCommand(
                @"SELECT n.id_alumno, n.id_materia, m.nombre, n.nota, n.estado
                  FROM sg.notas n
                  JOIN sg.materias m ON n.id_materia = m.id_materia
                  WHERE n.id_alumno = @idAlumno", conn);
            cmd.Parameters.AddWithValue("@idAlumno", idAlumno);

            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                result.Add(new NotaGuarani(
                    reader.GetString(0), reader.GetString(1), reader.GetString(2),
                    reader.GetDecimal(3), reader.GetString(4)));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener notas desde Guaraní: {IdAlumno}", idAlumno);
        }
        return result;
    }

    public async Task<IEnumerable<CarreraGuarani>> GetAllCarrerasAsync()
    {
        var result = new List<CarreraGuarani>();
        try
        {
            await using var conn = await GetConnectionAsync();
            await using var cmd = new NpgsqlCommand(
                @"SELECT id_carrera, nombre, codigo FROM sg.carreras ORDER BY nombre", conn);

            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                result.Add(new CarreraGuarani(
                    reader.GetString(0), reader.GetString(1),
                    reader.IsDBNull(2) ? null : reader.GetString(2)));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener carreras desde Guaraní");
        }
        return result;
    }

    public void Dispose()
    {
        _connection?.Close();
        _connection?.Dispose();
    }
}
