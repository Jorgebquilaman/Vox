namespace Vox.Application.DTOs;

public record QuestionDto(
    int Id,
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
    List<AlternativeDto>? Alternatives,
    int? PdfPageNumber = null,
    double? PdfPositionX = null,
    double? PdfPositionY = null
);
