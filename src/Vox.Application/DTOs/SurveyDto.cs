namespace Vox.Application.DTOs;

public record SurveyDto(
    int Id,
    string Title,
    string Description,
    DateTime ValidFrom,
    DateTime ValidTo,
    string Status,
    string? TargetAudience,
    bool IsAnonymous,
    DateTime CreatedAt,
    List<QuestionDto>? Questions
);

public record SurveySummaryDto(
    int Id,
    string Title,
    string Description,
    DateTime ValidFrom,
    DateTime ValidTo,
    string Status,
    int QuestionCount,
    bool HasResponded,
    bool IsAnonymous,
    bool ResultsPublished
);
