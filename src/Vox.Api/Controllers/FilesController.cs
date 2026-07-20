using System.Security.Claims;
using Vox.Application.Interfaces;
using Vox.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Vox.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IFileStorageService _fileStorage;
    private readonly ISurveyResponseService _responseService;

    public FilesController(IFileStorageService fileStorage, ISurveyResponseService responseService)
    {
        _fileStorage = fileStorage;
        _responseService = responseService;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string UserRole => User.FindFirstValue(ClaimTypes.Role)!;

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No se envió ningún archivo." });

        using var stream = file.OpenReadStream();
        var fileId = await _fileStorage.SaveAsync(stream);

        return Ok(new { fileId, fileName = file.FileName, contentType = file.ContentType });
    }

    [HttpGet("{fileId}")]
    public async Task<IActionResult> Download(Guid fileId)
    {
        var (fileName, contentType) = await _responseService.GetFileInfoAsync(fileId);
        var canAccess = await _responseService.CanAccessFileAsync(fileId, UserId, UserRole);
        if (!canAccess)
            return Forbid();

        var content = await _fileStorage.GetStreamAsync(fileId);
        return File(content, contentType, fileName);
    }
}
