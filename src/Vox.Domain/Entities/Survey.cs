using Vox.Domain.Enums;

namespace Vox.Domain.Entities;

public class Survey
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime ValidFrom { get; set; }
    public DateTime ValidTo { get; set; }
    public SurveyStatus Status { get; set; } = SurveyStatus.Draft;
    public string? TargetAudience { get; set; }
    public bool IsAnonymous { get; set; }
    public bool ResultsPublished { get; set; }
    public byte[]? OriginalPdf { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Question> Questions { get; set; } = new List<Question>();
    public ICollection<SurveyResponse> Responses { get; set; } = new List<SurveyResponse>();
}
