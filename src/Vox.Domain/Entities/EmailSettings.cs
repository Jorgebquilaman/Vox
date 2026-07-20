namespace Vox.Domain.Entities;

public class EmailSettings
{
    public int Id { get; set; } = 1;
    public bool Enabled { get; set; }
    public string SmtpHost { get; set; } = "smtp.gmail.com";
    public int SmtpPort { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = "Vox IUPA";
    public DateTime? UpdatedAt { get; set; }
}
