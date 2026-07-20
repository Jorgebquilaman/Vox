using Vox.Domain.Enums;

namespace Vox.Domain.Entities;

public class Question
{
    public int Id { get; set; }
    public int SurveyId { get; set; }
    public QuestionType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Order { get; set; }
    public bool IsRequired { get; set; }
    public bool IsVisibleInReports { get; set; } = true;
    public SimpleFieldType? FieldType { get; set; }
    public string? Placeholder { get; set; }
    public int? ParentAlternativeId { get; set; }
    public bool IsRepeatable { get; set; }
    public int? PdfPageNumber { get; set; }
    public double? PdfPositionX { get; set; }
    public double? PdfPositionY { get; set; }

    public Survey Survey { get; set; } = null!;
    public Alternative? ParentAlternative { get; set; }
    public ICollection<Alternative> Alternatives { get; set; } = new List<Alternative>();
    public ICollection<Answer> Answers { get; set; } = new List<Answer>();
}
