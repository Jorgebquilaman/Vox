using Vox.Domain.Entities;

namespace Vox.Domain.Interfaces;

public interface IQuestionRepository : IRepository<Question>
{
    Task<IEnumerable<Question>> GetQuestionsBySurveyIdAsync(int surveyId);
}
