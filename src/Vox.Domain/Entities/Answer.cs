namespace Vox.Domain.Entities;

public class Answer
{
    public int Id { get; set; }
    public int SurveyResponseId { get; set; }
    public int QuestionId { get; set; }
    public int? AlternativeId { get; set; }
    public string? TextValue { get; set; }
    public Guid? FileId { get; set; }
    public string? FileName { get; set; }
    public string? ContentType { get; set; }
    public int? GroupInstance { get; set; }

    public SurveyResponse SurveyResponse { get; set; } = null!;
    public Question Question { get; set; } = null!;
    public Alternative? Alternative { get; set; }
}
