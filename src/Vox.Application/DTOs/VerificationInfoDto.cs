namespace Vox.Application.DTOs;

public record VerificationInfoDto
{
    public int ResponseId { get; init; }
    public string SurveyTitle { get; init; } = string.Empty;
    public string RespondentName { get; init; } = string.Empty;
    public DateTime RespondedAt { get; init; }
    public bool Exists { get; init; }
}
