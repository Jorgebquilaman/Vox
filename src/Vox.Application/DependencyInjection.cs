using Vox.Application.Interfaces;
using Vox.Application.UseCases;
using Microsoft.Extensions.DependencyInjection;

namespace Vox.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddAutoMapper(typeof(DependencyInjection).Assembly);

        services.AddScoped<ISurveyService, SurveyService>();
        services.AddScoped<ISurveyResponseService, SurveyResponseService>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<IPreinscripcionService, PreinscripcionService>();
        services.AddScoped<IAnalyticsService, AnalyticsService>();
        services.AddScoped<ISurveyAIService, SurveyAIService>();

        return services;
    }
}
