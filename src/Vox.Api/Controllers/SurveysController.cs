using System.Security.Claims;
using Vox.Application.DTOs;
using Vox.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Vox.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SurveysController : ControllerBase
{
    private readonly ISurveyService _surveyService;
    private readonly ISurveyResponseService _responseService;
    private readonly ISurveyAIService _surveyAIService;

    public SurveysController(ISurveyService surveyService, ISurveyResponseService responseService, ISurveyAIService surveyAIService)
    {
        _surveyService = surveyService;
        _responseService = responseService;
        _surveyAIService = surveyAIService;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string UserRole => User.FindFirstValue(ClaimTypes.Role)!;

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
        => Ok(await _surveyService.GetAllSurveysAsync());

    [HttpGet("available")]
    public async Task<IActionResult> GetAvailable()
        => Ok(await _surveyService.GetAvailableSurveysAsync(UserId));

    [HttpGet("responded")]
    public async Task<IActionResult> GetResponded()
        => Ok(await _surveyService.GetRespondedSurveysAsync(UserId));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            return Ok(await _surveyService.GetSurveyByIdAsync(id, UserId));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateSurveyDto dto)
    {
        var survey = await _surveyService.CreateSurveyAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = survey.Id }, survey);
    }

    [HttpPost("generate-from-pdf")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GenerateFromPdf(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No se envió ningún archivo." });

        try
        {
            var (survey, usedAi) = await _surveyAIService.GenerateFromPdfAsync(file.OpenReadStream(), file.FileName, ct);
            return Ok(new { survey, usedAi });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateSurveyDto dto)
    {
        try
        {
            await _surveyService.UpdateSurveyAsync(id, dto);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _surveyService.DeleteSurveyAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/publish")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Publish(int id)
    {
        await _surveyService.PublishSurveyAsync(id);
        return NoContent();
    }

    [HttpPost("{id}/close")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Close(int id)
    {
        await _surveyService.CloseSurveyAsync(id);
        return NoContent();
    }

    [HttpPost("{id}/clone")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Clone(int id)
    {
        try
        {
            var newId = await _surveyService.CloneSurveyAsync(id);
            var survey = await _surveyService.GetSurveyByIdAsync(newId, UserId);
            return Ok(survey);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/toggle-results")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ToggleResults(int id)
    {
        try
        {
            await _surveyService.ToggleResultsPublishedAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/respond")]
    public async Task<IActionResult> Respond(int id, [FromBody] SubmitSurveyDto dto)
    {
        try
        {
            dto = dto with { SurveyId = id };
            var responseId = await _responseService.SubmitResponseAsync(dto, UserId);
            return Ok(new { message = "Encuesta respondida correctamente.", responseId });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id}/results")]
    public async Task<IActionResult> Results(int id)
    {
        try
        {
            var result = await _responseService.GetSurveyResultsAsync(id, UserId, UserRole);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{surveyId}/responses/{userId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteUserResponse(int surveyId, int userId)
    {
        try
        {
            await _responseService.DeleteUserResponseAsync(surveyId, userId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("results")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AllResults()
        => Ok(await _responseService.GetAllResultsAsync(UserId, UserRole));

    [HttpGet("{surveyId}/my-response/pdf-data")]
    public async Task<IActionResult> GetMyResponsePdfData(int surveyId)
    {
        try
        {
            var data = await _responseService.GetResponsePdfDataAsync(surveyId, UserId, UserId, UserRole);
            return Ok(data);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("{surveyId}/responses/{userId}/pdf-data")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetResponsePdfData(int surveyId, int userId)
    {
        try
        {
            var data = await _responseService.GetResponsePdfDataAsync(surveyId, userId, UserId, UserRole);
            return Ok(data);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("{surveyId}/my-answers")]
    public async Task<IActionResult> GetMyAnswers(int surveyId)
    {
        var data = await _responseService.GetMyAnswersAsync(surveyId, UserId);
        return Ok(data);
    }

    [HttpGet("{surveyId}/my-response/form-data")]
    public async Task<IActionResult> GetMyResponseFormData(int surveyId)
    {
        try
        {
            var data = await _responseService.GetResponseFormDataAsync(surveyId, UserId, UserId, UserRole);
            return Ok(data);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("{surveyId}/responses/{userId}/form-data")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetResponseFormData(int surveyId, int userId)
    {
        try
        {
            var data = await _responseService.GetResponseFormDataAsync(surveyId, userId, UserId, UserRole);
            return Ok(data);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
