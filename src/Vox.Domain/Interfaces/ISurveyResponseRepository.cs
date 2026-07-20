using Vox.Domain.Entities;

namespace Vox.Domain.Interfaces;

public interface ISurveyResponseRepository : IRepository<SurveyResponse>
{
    Task<IEnumerable<SurveyResponse>> GetBySurveyIdAsync(int surveyId);
    Task<IEnumerable<SurveyResponse>> GetByUserIdAsync(int userId);
    Task<SurveyResponse?> GetUserResponseForSurveyAsync(int surveyId, int userId);
    Task<IEnumerable<SurveyResponse>> GetRankingBySurveyAsync(int surveyId);
    Task<bool> HasUserRespondedAsync(int surveyId, int userId);
    Task<SurveyResponse?> GetResponseByFileIdAsync(Guid fileId);
    Task<Answer?> GetAnswerByFileIdAsync(Guid fileId);
    Task<SurveyResponse?> GetByIdWithDetailsAsync(int responseId);
}
