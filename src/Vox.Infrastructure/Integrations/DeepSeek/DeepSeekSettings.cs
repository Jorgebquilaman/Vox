namespace Vox.Infrastructure.Integrations.DeepSeek;

public class DeepSeekSettings
{
    public const string SectionName = "DeepSeek";
    public bool Enabled { get; set; } = false;
    public string ApiKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://api.deepseek.com";
    public string Model { get; set; } = "deepseek-chat";
    public int TimeoutSeconds { get; set; } = 120;
}
