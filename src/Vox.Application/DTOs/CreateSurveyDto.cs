namespace Vox.Application.DTOs;

public record CreateSurveyDto(
    string Title,
    string Description,
    DateTime ValidFrom,
    DateTime ValidTo,
    string? TargetAudience,
    bool IsAnonymous,
    List<CreateQuestionDto> Questions,
    string? OriginalPdfBase64 = null
);

public record CreateQuestionDto(
    string Type,
    string Title,
    string? Description,
    int Order,
    bool IsRequired,
    bool IsVisibleInReports,
    bool IsRepeatable,
    string? FieldType,
    string? Placeholder,
    int? ParentAlternativeId,
    int? ParentQuestionOrder,
    int? ParentAlternativeOrder,
    List<CreateAlternativeDto>? Alternatives,
    int? PdfPageNumber = null,
    double? PdfPositionX = null,
    double? PdfPositionY = null
);

public record CreateAlternativeDto(string Text, decimal Score, int Order);
