namespace Vox.Application.DTOs;

public record ResponsePdfDataDto
{
    public int ResponseId { get; init; }
    public int SurveyId { get; init; }
    public string SurveyTitle { get; init; } = string.Empty;
    public string SurveyDescription { get; init; } = string.Empty;
    public string RespondentName { get; init; } = string.Empty;
    public string RespondentEmail { get; init; } = string.Empty;
    public DateTime RespondedAt { get; init; }
    public string? OriginalPdfBase64 { get; init; }
    public List<PdfAnswerItemDto> Answers { get; init; } = new();
}

public record PdfAnswerItemDto
{
    public int QuestionOrder { get; init; }
    public string QuestionTitle { get; init; } = string.Empty;
    public bool IsSection { get; init; }
    public string? SelectedAlternative { get; init; }
    public string? TextValue { get; init; }
    public decimal? Score { get; init; }
    public string? FileName { get; init; }
    public int? GroupInstance { get; init; }
    public int? PdfPageNumber { get; init; }
    public double? PdfPositionX { get; init; }
    public double? PdfPositionY { get; init; }
}
