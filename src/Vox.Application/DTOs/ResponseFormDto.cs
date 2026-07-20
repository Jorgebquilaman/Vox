using Vox.Domain.Enums;

namespace Vox.Application.DTOs;

public record ResponseFormDto
{
    public int SurveyId { get; init; }
    public string SurveyTitle { get; init; } = string.Empty;
    public string SurveyDescription { get; init; } = string.Empty;
    public string RespondentName { get; init; } = string.Empty;
    public string RespondentEmail { get; init; } = string.Empty;
    public DateTime RespondedAt { get; init; }
    public List<FormSectionDto> Sections { get; init; } = new();
}

public record FormSectionDto
{
    public string? Title { get; init; }
    public string? Description { get; init; }
    public int Order { get; init; }
    public bool IsRepeatable { get; init; }
    public List<FormQuestionDto> Questions { get; init; } = new();
}

public record FormQuestionDto
{
    public int Id { get; init; }
    public string Type { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public int Order { get; init; }
    public bool IsRequired { get; init; }
    public string? FieldType { get; init; }
    public string? Placeholder { get; init; }
    public List<FormAlternativeDto> Alternatives { get; init; } = new();
    public List<FormAnswerValueDto> Answers { get; init; } = new();
}

public record FormAlternativeDto
{
    public int Id { get; init; }
    public string Text { get; init; } = string.Empty;
    public int Order { get; init; }
    public bool IsSelected { get; init; }
}

public record FormAnswerValueDto
{
    public int? AlternativeId { get; init; }
    public string? TextValue { get; init; }
    public Guid? FileId { get; init; }
    public string? FileName { get; init; }
    public int? GroupInstance { get; init; }
}
