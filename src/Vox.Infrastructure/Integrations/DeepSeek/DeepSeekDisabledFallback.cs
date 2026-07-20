using Microsoft.Extensions.Logging;
using Vox.Application.DTOs;

namespace Vox.Infrastructure.Integrations.DeepSeek;

/// <summary>
/// Helper usado cuando DeepSeek no está habilitado. Devuelve una encuesta de ejemplo
/// para que la experiencia de "generar con IA" se pueda demostrar sin configurar la API.
/// </summary>
public static class DeepSeekDisabledFallback
{
    public static (CreateSurveyDto Survey, bool UsedAi) BuildDemoSurvey(ILogger logger)
    {
        logger.LogWarning("DeepSeek está deshabilitado. Se devuelve una encuesta de ejemplo (no usa IA real).");

        var survey = new CreateSurveyDto(
            Title: "Encuesta de ejemplo (modo demo)",
            Description: "Esta encuesta fue generada como demostración porque la integración de IA no está configurada. Reemplazala con tu propio modelo.",
            ValidFrom: DateTime.UtcNow,
            ValidTo: DateTime.UtcNow.AddMonths(1),
            TargetAudience: null,
            IsAnonymous: false,
            Questions: new List<CreateQuestionDto>
            {
                new CreateQuestionDto(
                    Type: "Section", Title: "Datos generales", Description: null, Order: 1,
                    IsRequired: false, IsVisibleInReports: true, IsRepeatable: false,
                    FieldType: null, Placeholder: null, ParentAlternativeId: null,
                    ParentQuestionOrder: null, ParentAlternativeOrder: null, Alternatives: null),
                new CreateQuestionDto(
                    Type: "FreeText", Title: "Nombre del proyecto", Description: null, Order: 2,
                    IsRequired: true, IsVisibleInReports: true, IsRepeatable: false,
                    FieldType: null, Placeholder: "Ingrese el nombre", ParentAlternativeId: null,
                    ParentQuestionOrder: null, ParentAlternativeOrder: null, Alternatives: null),
                new CreateQuestionDto(
                    Type: "SingleChoice", Title: "Tipo de proyecto", Description: null, Order: 3,
                    IsRequired: true, IsVisibleInReports: true, IsRepeatable: false,
                    FieldType: null, Placeholder: null, ParentAlternativeId: null,
                    ParentQuestionOrder: null, ParentAlternativeOrder: null,
                    Alternatives: new List<CreateAlternativeDto>
                    {
                        new CreateAlternativeDto(Text: "Con trayectoria", Score: 1, Order: 1),
                        new CreateAlternativeDto(Text: "Proyectos fortalecidos", Score: 1, Order: 2)
                    }),
                new CreateQuestionDto(
                    Type: "StarRating", Title: "Nivel de satisfacción", Description: null, Order: 4,
                    IsRequired: false, IsVisibleInReports: true, IsRepeatable: false,
                    FieldType: null, Placeholder: null, ParentAlternativeId: null,
                    ParentQuestionOrder: null, ParentAlternativeOrder: null, Alternatives: null)
            });

        return (survey, false);
    }
}
