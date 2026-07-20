namespace Vox.Application.DTOs;

public record SurveyResultDto(
    int SurveyId,
    string SurveyTitle,
    int TotalResponses,
    bool IsAnonymous,
    bool ResultsPublished,
    List<UserResultDto> Rankings
);

public record UserResultDto(
    int UserId,
    string UserName,
    decimal TotalScore,
    DateTime RespondedAt,
    List<AnswerDetailDto> Answers,
    UserDemographicsDto? Demographics = null
);

public record UserDemographicsDto(
    string? Edad,
    string? Genero,
    string? Localidad,
    string? Provincia,
    string? Pais,
    string? EstudiosPrevios,
    string? Telefono,
    string? Email,
    string? Propuesta,
    string? UnidadAcademica
);

public record AnswerDetailDto(
    int QuestionId,
    string QuestionTitle,
    string? SelectedAlternative,
    int? SelectedAlternativeId,
    decimal? Score,
    string? TextValue,
    bool IsVisible,
    int? GroupInstance = null,
    Guid? FileId = null,
    string? FileName = null,
    string? ContentType = null
);
