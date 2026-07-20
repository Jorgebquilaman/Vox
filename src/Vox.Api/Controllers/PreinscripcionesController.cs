using System.Security.Claims;
using Vox.Application.DTOs;
using Vox.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Vox.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PreinscripcionesController : ControllerBase
{
    private readonly IPreinscripcionService _service;

    public PreinscripcionesController(IPreinscripcionService service) => _service = service;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        var dto = await _service.GetByUserAsync(UserId);
        return Ok(dto);
    }

    [HttpGet("admin/{userId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetByUserForAdmin(int userId)
    {
        var dto = await _service.GetByUserIdForAdminAsync(userId);
        return dto is null ? NotFound(new { message = "El usuario no tiene preinscripción." }) : Ok(dto);
    }

    [HttpPost("draft")]
    public async Task<IActionResult> SaveDraft([FromBody] PreinscripcionDto dto)
    {
        try
        {
            return Ok(await _service.SaveDraftAsync(UserId, dto));
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("finalize")]
    public async Task<IActionResult> Finalize([FromBody] PreinscripcionDto dto)
    {
        try
        {
            return Ok(await _service.FinalizeAsync(UserId, dto));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        try
        {
            return Ok(await _service.ExportToGuaraniAsync(UserId));
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
