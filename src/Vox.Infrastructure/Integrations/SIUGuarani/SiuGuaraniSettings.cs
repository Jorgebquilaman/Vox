namespace Vox.Infrastructure.Integrations.SIUGuarani;

public class SiuGuaraniSettings
{
    public const string SectionName = "SiuGuarani";
    public string ConnectionString { get; set; } = string.Empty;
    public bool Enabled { get; set; } = false;
    public int TimeoutSeconds { get; set; } = 30;
}
