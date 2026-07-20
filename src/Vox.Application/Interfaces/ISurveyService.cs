using Vox.Application.DTOs;

namespace Vox.Application.Interfaces;

public interface ISurveyService
{
    Task<IEnumerable<SurveySummaryDto>> GetAllSurveysAsync();
    Task<IEnumerable<SurveySummaryDto>> GetAvailableSurveysAsync(int userId);
    Task<IEnumerable<SurveySummaryDto>> GetRespondedSurveysAsync(int userId);
    Task<SurveyDto> GetSurveyByIdAsync(int surveyId, int userId);
    Task<SurveyDto> CreateSurveyAsync(CreateSurveyDto dto);
    Task UpdateSurveyAsync(int id, CreateSurveyDto dto);
    Task DeleteSurveyAsync(int id);
    Task PublishSurveyAsync(int id);
    Task CloseSurveyAsync(int id);
    Task ToggleResultsPublishedAsync(int id);
    Task<int> CloneSurveyAsync(int id);
}
