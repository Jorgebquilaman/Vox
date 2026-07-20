using Vox.Application.Interfaces;
using Vox.Application.UseCases;
using Vox.Domain.Interfaces;
using Vox.Infrastructure.Authentication;
using Vox.Infrastructure.Email;
using Vox.Infrastructure.Integrations.DeepSeek;
using Vox.Infrastructure.Integrations.SIUGuarani;
using Vox.Infrastructure.Services;
using Vox.Infrastructure.Persistence.EF;
using Vox.Infrastructure.Persistence.EF.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Vox.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IFileStorageService, FileStorageService>();
        services.AddScoped<Vox.Domain.Interfaces.IPdfTextExtractor, Vox.Infrastructure.Services.PdfTextExtractor>();

        services.AddScoped(typeof(IRepository<>), typeof(BaseRepository<>));
        services.AddScoped<ISurveyRepository, SurveyRepository>();
        services.AddScoped<IQuestionRepository, QuestionRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ISurveyResponseRepository, SurveyResponseRepository>();
        services.AddScoped<IAspiranteRepository, AspiranteRepository>();
        services.AddScoped<IEmailSettingsRepository, EmailSettingsRepository>();

        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.AddScoped<IAuthenticationService, AuthenticationService>();
        services.AddScoped<IEmailService, EmailService>();

        var guaraniEnabled = configuration.GetValue<bool>($"{SiuGuaraniSettings.SectionName}:Enabled");
        if (guaraniEnabled)
        {
            services.Configure<SiuGuaraniSettings>(configuration.GetSection(SiuGuaraniSettings.SectionName));
            services.AddScoped<ISiuGuaraniIntegration, SiuGuaraniAdapter>();
        }
        else
        {
            services.AddScoped<ISiuGuaraniIntegration, SiuGuaraniDisabledFallback>();
        }

        // DeepSeek (IA para generar encuestas desde PDF). HTTP client + servicio con fallback demo.
        services.Configure<DeepSeekSettings>(configuration.GetSection(DeepSeekSettings.SectionName));
        services.AddHttpClient<IDeepSeekService, DeepSeekService>();
        services.AddScoped<IDeepSeekSettingsRepository, DeepSeekSettingsRepository>();
        services.AddScoped<IDeepSeekSettingsProvider, DeepSeekSettingsProvider>();
        services.AddScoped<ISurveyAIService, SurveyAIService>();

        return services;
    }
}
