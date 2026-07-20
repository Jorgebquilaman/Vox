using Vox.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Vox.Infrastructure.Persistence.EF;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Survey> Surveys => Set<Survey>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<Alternative> Alternatives => Set<Alternative>();
    public DbSet<SurveyResponse> SurveyResponses => Set<SurveyResponse>();
    public DbSet<Answer> Answers => Set<Answer>();
    public DbSet<Aspirante> Aspirantes => Set<Aspirante>();
    public DbSet<DocumentoIdentidad> DocumentosIdentidad => Set<DocumentoIdentidad>();
    public DbSet<PropuestaElegida> PropuestasElegidas => Set<PropuestaElegida>();
    public DbSet<DocumentoDigital> DocumentosDigitales => Set<DocumentoDigital>();
    public DbSet<TurnoPresentacion> TurnosPresentacion => Set<TurnoPresentacion>();
    public DbSet<EmailSettings> EmailSettings => Set<EmailSettings>();
    public DbSet<DeepSeekSettingsEntity> DeepSeekSettings => Set<DeepSeekSettingsEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("Users");
            e.HasKey(u => u.Id);
            e.Property(u => u.Name).IsRequired().HasMaxLength(200);
            e.Property(u => u.Email).IsRequired().HasMaxLength(200);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.PasswordHash).IsRequired();
            e.Property(u => u.Role).IsRequired().HasConversion<string>().HasMaxLength(50);
            e.Property(u => u.ExternalId).HasMaxLength(50);
            e.Property(u => u.PasswordResetToken).HasMaxLength(200);
        });

        modelBuilder.Entity<Survey>(e =>
        {
            e.ToTable("Surveys");
            e.HasKey(s => s.Id);
            e.Property(s => s.Title).IsRequired().HasMaxLength(500);
            e.Property(s => s.Description).HasMaxLength(4000);
            e.Property(s => s.Status).IsRequired().HasConversion<string>().HasMaxLength(50);
            e.Property(s => s.TargetAudience).HasMaxLength(500);
        });

        modelBuilder.Entity<Question>(e =>
        {
            e.ToTable("Questions");
            e.HasKey(q => q.Id);
            e.Property(q => q.Type).IsRequired().HasConversion<string>().HasMaxLength(50);
            e.Property(q => q.Title).IsRequired().HasMaxLength(1000);
            e.Property(q => q.Description).HasMaxLength(4000);
            e.Property(q => q.FieldType).HasConversion<string>().HasMaxLength(50);
            e.Property(q => q.Placeholder).HasMaxLength(500);
            e.Property(q => q.PdfPositionX).HasColumnType("double precision");
            e.Property(q => q.PdfPositionY).HasColumnType("double precision");
            e.HasOne(q => q.Survey)
                .WithMany(s => s.Questions)
                .HasForeignKey(q => q.SurveyId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(q => q.ParentAlternative)
                .WithMany()
                .HasForeignKey(q => q.ParentAlternativeId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Alternative>(e =>
        {
            e.ToTable("Alternatives");
            e.HasKey(a => a.Id);
            e.Property(a => a.Text).IsRequired().HasMaxLength(1000);
            e.Property(a => a.Score).HasColumnType("decimal(18,2)");
            e.HasOne(a => a.Question)
                .WithMany(q => q.Alternatives)
                .HasForeignKey(a => a.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SurveyResponse>(e =>
        {
            e.ToTable("SurveyResponses");
            e.HasKey(r => r.Id);
            e.Property(r => r.TotalScore).HasColumnType("decimal(18,2)");
            e.HasOne(r => r.Survey)
                .WithMany(s => s.Responses)
                .HasForeignKey(r => r.SurveyId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(r => r.User)
                .WithMany(u => u.Responses)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(r => new { r.SurveyId, r.UserId }).IsUnique();
        });

        modelBuilder.Entity<Answer>(e =>
        {
            e.ToTable("Answers");
            e.HasKey(a => a.Id);
            e.Property(a => a.TextValue).HasMaxLength(4000);
            e.Property(a => a.FileName).HasMaxLength(500);
            e.Property(a => a.ContentType).HasMaxLength(200);
            e.HasOne(a => a.SurveyResponse)
                .WithMany(r => r.Answers)
                .HasForeignKey(a => a.SurveyResponseId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(a => a.Question)
                .WithMany(q => q.Answers)
                .HasForeignKey(a => a.QuestionId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(a => a.Alternative)
                .WithMany(aAlt => aAlt.Answers)
                .HasForeignKey(a => a.AlternativeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Aspirante>(e =>
        {
            e.ToTable("Aspirantes");
            e.HasKey(a => a.Id);
            e.Property(a => a.Estado).IsRequired().HasConversion<string>().HasMaxLength(50);
            e.Property(a => a.Email).IsRequired().HasMaxLength(200);
            e.Property(a => a.Apellido).IsRequired().HasMaxLength(200);
            e.Property(a => a.Nombre).IsRequired().HasMaxLength(200);
            e.Property(a => a.Nacionalidad).HasMaxLength(100);
            e.Property(a => a.PaisEmisorDocumento).HasMaxLength(100);
            e.Property(a => a.TipoDocumento).HasMaxLength(50);
            e.Property(a => a.NumeroDocumento).HasMaxLength(50);
            e.Property(a => a.ApellidoNombreLegal).HasMaxLength(400);
            e.Property(a => a.ApellidoNombreElegido).HasMaxLength(400);
            e.Property(a => a.IdentidadGenero).HasMaxLength(50);
            e.Property(a => a.EmailContacto).HasMaxLength(200);
            e.Property(a => a.Telefono).HasMaxLength(50);
            e.Property(a => a.LugarNacimiento).HasMaxLength(200);
            e.Property(a => a.Calle).HasMaxLength(200);
            e.Property(a => a.Numero).HasMaxLength(20);
            e.Property(a => a.Piso).HasMaxLength(10);
            e.Property(a => a.Departamento).HasMaxLength(10);
            e.Property(a => a.Localidad).HasMaxLength(150);
            e.Property(a => a.Provincia).HasMaxLength(150);
            e.Property(a => a.Pais).HasMaxLength(100);
            e.Property(a => a.CodigoPostal).HasMaxLength(20);
            e.Property(a => a.EstudiosPrevios).HasMaxLength(500);
            e.Property(a => a.DatosSocioeconomicos).HasMaxLength(2000);
            e.Property(a => a.BandaHoraria).HasMaxLength(20);
            e.HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DocumentoIdentidad>(e =>
        {
            e.ToTable("DocumentosIdentidad");
            e.HasKey(d => d.Id);
            e.Property(d => d.Tipo).IsRequired().HasMaxLength(50);
            e.Property(d => d.Numero).IsRequired().HasMaxLength(50);
            e.Property(d => d.PaisEmisor).HasMaxLength(100);
            e.HasOne(d => d.Aspirante)
                .WithMany(a => a.Documentos)
                .HasForeignKey(d => d.AspiranteId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PropuestaElegida>(e =>
        {
            e.ToTable("PropuestasElegidas");
            e.HasKey(p => p.Id);
            e.Property(p => p.UnidadAcademica).IsRequired().HasMaxLength(200);
            e.Property(p => p.PropuestaFormativa).IsRequired().HasMaxLength(200);
            e.Property(p => p.Sede).HasMaxLength(150);
            e.Property(p => p.Modalidad).HasMaxLength(50);
            e.HasOne(p => p.Aspirante)
                .WithMany(a => a.Propuestas)
                .HasForeignKey(p => p.AspiranteId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DocumentoDigital>(e =>
        {
            e.ToTable("DocumentosDigitales");
            e.HasKey(d => d.Id);
            e.Property(d => d.Requisito).IsRequired().HasMaxLength(200);
            e.Property(d => d.FileName).HasMaxLength(500);
            e.Property(d => d.ContentType).HasMaxLength(200);
            e.HasOne(d => d.Aspirante)
                .WithMany(a => a.DocumentosDigitales)
                .HasForeignKey(d => d.AspiranteId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TurnoPresentacion>(e =>
        {
            e.ToTable("TurnosPresentacion");
            e.HasKey(t => t.Id);
            e.Property(t => t.BandaHoraria).IsRequired().HasMaxLength(20);
            e.HasOne(t => t.Aspirante)
                .WithMany()
                .HasForeignKey(t => t.AspiranteId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EmailSettings>(e =>
        {
            e.ToTable("EmailSettings");
            e.HasKey(s => s.Id);
            e.Property(s => s.SmtpHost).IsRequired().HasMaxLength(200);
            e.Property(s => s.Username).HasMaxLength(200);
            e.Property(s => s.Password).HasMaxLength(500);
            e.Property(s => s.FromAddress).IsRequired().HasMaxLength(200);
            e.Property(s => s.FromName).IsRequired().HasMaxLength(200);
            e.HasData(new EmailSettings
            {
                Id = 1,
                Enabled = false,
                SmtpHost = "smtp.gmail.com",
                SmtpPort = 587,
                UseSsl = true,
                Username = string.Empty,
                Password = string.Empty,
                FromAddress = string.Empty,
                FromName = "Vox IUPA"
            });
        });

        modelBuilder.Entity<DeepSeekSettingsEntity>(e =>
        {
            e.ToTable("DeepSeekSettings");
            e.HasKey(s => s.Id);
            e.Property(s => s.ApiKey).HasMaxLength(500);
            e.Property(s => s.BaseUrl).IsRequired().HasMaxLength(300);
            e.Property(s => s.Model).IsRequired().HasMaxLength(100);
            e.HasData(new DeepSeekSettingsEntity
            {
                Id = 1,
                Enabled = false,
                ApiKey = string.Empty,
                BaseUrl = "https://api.deepseek.com",
                Model = "deepseek-chat",
                TimeoutSeconds = 120
            });
        });
    }
}
