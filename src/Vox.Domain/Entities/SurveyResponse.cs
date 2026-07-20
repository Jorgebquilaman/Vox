namespace Vox.Domain.Entities;

public class SurveyResponse
{
    public int Id { get; set; }
    public int SurveyId { get; set; }
    public int UserId { get; set; }
    public DateTime RespondedAt { get; set; } = DateTime.UtcNow;
    public decimal TotalScore { get; set; }

    public Survey Survey { get; set; } = null!;
    public User User { get; set; } = null!;
    public ICollection<Answer> Answers { get; set; } = new List<Answer>();
}
