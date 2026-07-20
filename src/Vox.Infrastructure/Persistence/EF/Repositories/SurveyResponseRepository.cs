using Vox.Domain.Entities;
using Vox.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Vox.Infrastructure.Persistence.EF.Repositories;

public class SurveyResponseRepository : BaseRepository<SurveyResponse>, ISurveyResponseRepository
{
    public SurveyResponseRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<SurveyResponse>> GetBySurveyIdAsync(int surveyId)
        => await Context.SurveyResponses
            .Where(r => r.SurveyId == surveyId)
            .Include(r => r.User)
            .Include(r => r.Answers)
                .ThenInclude(a => a.Question)
            .Include(r => r.Answers)
                .ThenInclude(a => a.Alternative)
            .ToListAsync();

    public async Task<IEnumerable<SurveyResponse>> GetByUserIdAsync(int userId)
        => await Context.SurveyResponses
            .Where(r => r.UserId == userId)
            .Include(r => r.Survey)
            .ToListAsync();

    public async Task<SurveyResponse?> GetUserResponseForSurveyAsync(int surveyId, int userId)
        => await Context.SurveyResponses
            .Where(r => r.SurveyId == surveyId && r.UserId == userId)
            .Include(r => r.User)
            .Include(r => r.Answers)
                .ThenInclude(a => a.Question)
            .Include(r => r.Answers)
                .ThenInclude(a => a.Alternative)
            .FirstOrDefaultAsync();

    public async Task<IEnumerable<SurveyResponse>> GetRankingBySurveyAsync(int surveyId)
        => await Context.SurveyResponses
            .Where(r => r.SurveyId == surveyId)
            .Include(r => r.User)
            .Include(r => r.Answers)
                .ThenInclude(a => a.Question)
            .Include(r => r.Answers)
                .ThenInclude(a => a.Alternative)
            .OrderByDescending(r => r.TotalScore)
            .ToListAsync();

    public async Task<bool> HasUserRespondedAsync(int surveyId, int userId)
        => await Context.SurveyResponses
            .AnyAsync(r => r.SurveyId == surveyId && r.UserId == userId);

    public async Task<SurveyResponse?> GetResponseByFileIdAsync(Guid fileId)
        => await Context.SurveyResponses
            .Where(r => r.Answers.Any(a => a.FileId == fileId))
            .FirstOrDefaultAsync();

    public async Task<Answer?> GetAnswerByFileIdAsync(Guid fileId)
        => await Context.Answers
            .FirstOrDefaultAsync(a => a.FileId == fileId);

    public async Task<SurveyResponse?> GetByIdWithDetailsAsync(int responseId)
        => await Context.SurveyResponses
            .Include(r => r.User)
            .Include(r => r.Survey)
            .Include(r => r.Answers)
                .ThenInclude(a => a.Question)
            .Include(r => r.Answers)
                .ThenInclude(a => a.Alternative)
            .FirstOrDefaultAsync(r => r.Id == responseId);
}
