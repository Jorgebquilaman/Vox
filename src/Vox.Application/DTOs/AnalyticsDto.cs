namespace Vox.Application.DTOs;

public record SurveyAnalyticsDto(
    int SurveyId,
    string SurveyTitle,
    SummaryDto Summary,
    List<QuestionAnalyticsDto> Questions,
    List<OpenTextResponseDto> OpenTextResponses
);

public record SummaryDto(
    int TotalResponses,
    decimal AverageScore,
    decimal? NpsScore
);

public record QuestionAnalyticsDto(
    int QuestionId,
    string Title,
    string Type,
    List<AlternativeCountDto>? Distribution,
    int ResponseCount,
    decimal? MeanScore,
    decimal? MedianScore,
    bool IsLikertScale
);

public record AlternativeCountDto(
    int AlternativeId,
    string Label,
    int Count,
    decimal Percentage,
    decimal? Score
);

public record OpenTextResponseDto(
    int QuestionId,
    string QuestionTitle,
    string UserName,
    string? Text
);
