using Vox.Application.DTOs;

namespace Vox.Application.Interfaces;

public interface ISurveyResponseService
{
    Task<int> SubmitResponseAsync(SubmitSurveyDto dto, int userId);
    Task<List<AnswerDto>> GetMyAnswersAsync(int surveyId, int userId);
    Task<SurveyResultDto> GetSurveyResultsAsync(int surveyId, int userId, string userRole);
    Task<IEnumerable<SurveyResultDto>> GetAllResultsAsync(int userId, string userRole);
    Task DeleteUserResponseAsync(int surveyId, int userId);
    Task<bool> CanAccessFileAsync(Guid fileId, int userId, string userRole);
    Task<(string FileName, string ContentType)> GetFileInfoAsync(Guid fileId);
    Task<ResponsePdfDataDto> GetResponsePdfDataAsync(int surveyId, int userId, int currentUserId, string currentUserRole);
    Task<ResponseFormDto> GetResponseFormDataAsync(int surveyId, int userId, int currentUserId, string currentUserRole);
    Task<VerificationInfoDto> GetVerificationInfoAsync(int responseId);
}
