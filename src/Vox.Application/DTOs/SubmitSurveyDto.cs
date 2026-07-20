namespace Vox.Application.DTOs;

public record SubmitSurveyDto(int SurveyId, List<AnswerDto> Answers);

public record AnswerDto(int QuestionId, int? AlternativeId, string? TextValue, int? GroupInstance = null, Guid? FileId = null, string? FileName = null, string? ContentType = null);
