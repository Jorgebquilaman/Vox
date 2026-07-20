using Vox.Domain.Entities;
using Vox.Domain.Enums;
using Vox.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Vox.Infrastructure.Persistence.EF.Repositories;

public class SurveyRepository : BaseRepository<Survey>, ISurveyRepository
{
    public SurveyRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<Survey>> GetSurveysByStatusAsync(SurveyStatus status)
        => await Context.Surveys
            .Where(s => s.Status == status)
            .Include(s => s.Questions)
            .ToListAsync();

    public async Task<Survey?> GetSurveyWithQuestionsAsync(int surveyId)
        => await Context.Surveys
            .Include(s => s.Questions.OrderBy(q => q.Order))
                .ThenInclude(q => q.Alternatives.OrderBy(a => a.Order))
            .FirstOrDefaultAsync(s => s.Id == surveyId);

    public async Task<IEnumerable<Survey>> GetAvailableSurveysForUserAsync(int userId)
    {
        var respondedIds = await Context.SurveyResponses
            .Where(r => r.UserId == userId)
            .Select(r => r.SurveyId)
            .ToListAsync();

        return await Context.Surveys
            .Where(s => s.Status == SurveyStatus.Published
                && s.ValidFrom <= DateTime.UtcNow
                && s.ValidTo >= DateTime.UtcNow
                && !respondedIds.Contains(s.Id))
            .Include(s => s.Questions)
            .ToListAsync();
    }

    public async Task<IEnumerable<Survey>> GetRespondedSurveysByUserAsync(int userId)
    {
        var respondedIds = await Context.SurveyResponses
            .Where(r => r.UserId == userId)
            .Select(r => r.SurveyId)
            .ToListAsync();

        return await Context.Surveys
            .Where(s => respondedIds.Contains(s.Id))
            .Include(s => s.Questions)
            .ToListAsync();
    }

    public override async Task<IEnumerable<Survey>> GetAllAsync()
        => await Context.Surveys
            .Include(s => s.Questions)
            .ToListAsync();
}
