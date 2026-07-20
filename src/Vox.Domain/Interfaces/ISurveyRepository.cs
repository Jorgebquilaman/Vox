using Vox.Domain.Entities;
using Vox.Domain.Enums;

namespace Vox.Domain.Interfaces;

public interface ISurveyRepository : IRepository<Survey>
{
    Task<IEnumerable<Survey>> GetSurveysByStatusAsync(SurveyStatus status);
    Task<Survey?> GetSurveyWithQuestionsAsync(int surveyId);
    Task<IEnumerable<Survey>> GetAvailableSurveysForUserAsync(int userId);
    Task<IEnumerable<Survey>> GetRespondedSurveysByUserAsync(int userId);
}
