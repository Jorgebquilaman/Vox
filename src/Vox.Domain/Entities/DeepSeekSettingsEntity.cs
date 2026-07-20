namespace Vox.Domain.Entities;

public class DeepSeekSettingsEntity
{
    public int Id { get; set; } = 1;
    public bool Enabled { get; set; }
    public string ApiKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://api.deepseek.com";
    public string Model { get; set; } = "deepseek-chat";
    public int TimeoutSeconds { get; set; } = 120;
    public DateTime? UpdatedAt { get; set; }
}
