using Vox.Application.DTOs;
using Vox.Application.Interfaces;
using Vox.Domain.Enums;
using Vox.Domain.Interfaces;

namespace Vox.Application.UseCases;

public class AnalyticsService : IAnalyticsService
{
    private readonly ISurveyRepository _surveyRepository;
    private readonly ISurveyResponseRepository _responseRepository;

    public AnalyticsService(ISurveyRepository surveyRepository, ISurveyResponseRepository responseRepository)
    {
        _surveyRepository = surveyRepository;
        _responseRepository = responseRepository;
    }

    public async Task<SurveyAnalyticsDto> GetSurveyAnalyticsAsync(int surveyId)
    {
        var survey = await _surveyRepository.GetSurveyWithQuestionsAsync(surveyId)
            ?? throw new KeyNotFoundException("Encuesta no encontrada.");

        var responses = await _responseRepository.GetRankingBySurveyAsync(surveyId);
        var questions = survey.Questions.OrderBy(q => q.Order).ToList();

        var openTexts = new List<OpenTextResponseDto>();
        var qAnalytics = new List<QuestionAnalyticsDto>();

        foreach (var q in questions)
        {
            var answersForQ = responses
                .SelectMany(r => r.Answers.Where(a => a.QuestionId == q.Id))
                .ToList();

            var responseCount = answersForQ.Count;

            if (q.Type == QuestionType.FreeText || q.Type == QuestionType.SimpleField)
            {
                foreach (var r in responses)
                {
                    var a = r.Answers.FirstOrDefault(x => x.QuestionId == q.Id);
                    if (a != null && !string.IsNullOrWhiteSpace(a.TextValue))
                        openTexts.Add(new OpenTextResponseDto(q.Id, q.Title, r.User.Name, a.TextValue));
                }

                qAnalytics.Add(new QuestionAnalyticsDto(q.Id, q.Title, q.Type.ToString(), null, responseCount, null, null, false));
                continue;
            }

            if (q.Type == QuestionType.FileUpload)
            {
                qAnalytics.Add(new QuestionAnalyticsDto(q.Id, q.Title, q.Type.ToString(), null, responseCount, null, null, false));
                continue;
            }

            // Closed questions (SingleChoice / MultipleChoice)
            var alternatives = q.Alternatives.OrderBy(a => a.Order).ToList();
            var totalAnswers = answersForQ.Count;
            var isLikert = alternatives.Count >= 3 && alternatives.Count <= 10 && alternatives.Any(a => a.Score != 0);

            var dist = alternatives.Select(alt =>
            {
                var count = answersForQ.Count(a => a.AlternativeId == alt.Id);
                return new AlternativeCountDto(
                    alt.Id,
                    alt.Text,
                    count,
                    totalAnswers > 0 ? Math.Round((decimal)count / totalAnswers * 100, 1) : 0,
                    alt.Score
                );
            }).ToList();

            var nonZeroScores = alternatives.Where(a => a.Score != 0).Select(a => a.Score).ToList();
            decimal? meanScore = nonZeroScores.Count != 0
                ? Math.Round(dist.Where(d => d.Count > 0).Average(d => d.Score ?? 0), 2)
                : null;

            decimal? medianScore = null;
            if (isLikert && totalAnswers > 0)
            {
                var sortedScores = alternatives.OrderBy(a => a.Score).ToList();
                var midpoint = alternatives.Count / 2;
                medianScore = alternatives.Count % 2 == 0
                    ? (sortedScores[midpoint - 1].Score + sortedScores[midpoint].Score) / 2
                    : sortedScores[midpoint].Score;
            }

            qAnalytics.Add(new QuestionAnalyticsDto(q.Id, q.Title, q.Type.ToString(), dist, responseCount, meanScore, medianScore, isLikert));
        }

        // NPS detection: find question with 11 alternatives (0-10) or a scale question that looks like NPS
        decimal? nps = null;
        foreach (var q in questions.Where(x => x.Type == QuestionType.SingleChoice && x.Alternatives.Count >= 10))
        {
            var answersForQ = responses
                .SelectMany(r => r.Answers.Where(a => a.QuestionId == q.Id))
                .ToList();
            if (answersForQ.Count == 0) continue;

            // Assume 0-10 scale: promoters 9-10, detractors 0-6
            var promoters = 0; // score >= 9
            var detractors = 0; // score <= 6
            foreach (var a in answersForQ)
            {
                var s = q.Alternatives.FirstOrDefault(x => x.Id == a.AlternativeId)?.Score;
                if (s >= 9) promoters++;
                else if (s <= 6) detractors++;
            }
            nps = Math.Round((decimal)(promoters - detractors) / answersForQ.Count * 100, 1);
            break;
        }

        var responseList = responses.ToList();

        return new SurveyAnalyticsDto(
            surveyId,
            survey.Title,
            new SummaryDto(
                responseList.Count,
                responseList.Count > 0 ? Math.Round(responseList.Average(r => r.TotalScore), 2) : 0,
                nps
            ),
            qAnalytics,
            openTexts
        );
    }
}
