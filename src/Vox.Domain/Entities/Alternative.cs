namespace Vox.Domain.Entities;

public class Alternative
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public string Text { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public int Order { get; set; }

    public Question Question { get; set; } = null!;
    public ICollection<Answer> Answers { get; set; } = new List<Answer>();
}
