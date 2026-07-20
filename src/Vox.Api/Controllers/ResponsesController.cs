using Vox.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Vox.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ResponsesController : ControllerBase
{
    private readonly ISurveyResponseService _responseService;

    public ResponsesController(ISurveyResponseService responseService)
    {
        _responseService = responseService;
    }

    [HttpGet("{id}/verify")]
    public async Task<IActionResult> Verify(int id)
    {
        var info = await _responseService.GetVerificationInfoAsync(id);
        return Ok(info);
    }
}
