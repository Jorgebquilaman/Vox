using Vox.Application.DTOs;

namespace Vox.Application.Interfaces;

public interface IAnalyticsService
{
    Task<SurveyAnalyticsDto> GetSurveyAnalyticsAsync(int surveyId);
}
