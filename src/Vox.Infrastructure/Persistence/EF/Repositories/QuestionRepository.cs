using Vox.Domain.Entities;
using Vox.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Vox.Infrastructure.Persistence.EF.Repositories;

public class QuestionRepository : BaseRepository<Question>, IQuestionRepository
{
    public QuestionRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<Question>> GetQuestionsBySurveyIdAsync(int surveyId)
        => await Context.Questions
            .Where(q => q.SurveyId == surveyId)
            .Include(q => q.Alternatives)
            .OrderBy(q => q.Order)
            .ToListAsync();
}
