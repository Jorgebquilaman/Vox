using AutoMapper;
using Vox.Application.DTOs;
using Vox.Application.Interfaces;
using Vox.Domain.Entities;
using Vox.Domain.Enums;
using Vox.Domain.Interfaces;

namespace Vox.Application.UseCases;

public class SurveyService : ISurveyService
{
    private readonly ISurveyRepository _surveyRepository;
    private readonly IQuestionRepository _questionRepository;
    private readonly ISurveyResponseRepository _responseRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public SurveyService(
        ISurveyRepository surveyRepository,
        IQuestionRepository questionRepository,
        ISurveyResponseRepository responseRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _surveyRepository = surveyRepository;
        _questionRepository = questionRepository;
        _responseRepository = responseRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<SurveySummaryDto>> GetAllSurveysAsync()
    {
        var surveys = await _surveyRepository.GetAllAsync();
        return surveys.Select(s => new SurveySummaryDto(
            s.Id, s.Title, s.Description, s.ValidFrom, s.ValidTo,
            s.Status.ToString(), s.Questions.Count, false, s.IsAnonymous, s.ResultsPublished));
    }

    public async Task<IEnumerable<SurveySummaryDto>> GetAvailableSurveysAsync(int userId)
    {
        var surveys = await _surveyRepository.GetAvailableSurveysForUserAsync(userId);
        return surveys.Select(s => new SurveySummaryDto(
            s.Id, s.Title, s.Description, s.ValidFrom, s.ValidTo,
            s.Status.ToString(), s.Questions.Count, false, s.IsAnonymous, s.ResultsPublished));
    }

    public async Task<IEnumerable<SurveySummaryDto>> GetRespondedSurveysAsync(int userId)
    {
        var surveys = await _surveyRepository.GetRespondedSurveysByUserAsync(userId);
        return surveys.Select(s => new SurveySummaryDto(
            s.Id, s.Title, s.Description, s.ValidFrom, s.ValidTo,
            s.Status.ToString(), s.Questions.Count, true, s.IsAnonymous, s.ResultsPublished));
    }

    public async Task<SurveyDto> GetSurveyByIdAsync(int surveyId, int userId)
    {
        var survey = await _surveyRepository.GetSurveyWithQuestionsAsync(surveyId)
            ?? throw new KeyNotFoundException($"Encuesta {surveyId} no encontrada.");

        var dto = _mapper.Map<SurveyDto>(survey);
        return dto with { Questions = PopulateParentQuestionOrder(dto.Questions, survey) };
    }

    public async Task<SurveyDto> CreateSurveyAsync(CreateSurveyDto dto)
    {
        var survey = new Survey
        {
            Title = dto.Title,
            Description = dto.Description,
            ValidFrom = dto.ValidFrom,
            ValidTo = dto.ValidTo,
            TargetAudience = dto.TargetAudience,
            IsAnonymous = dto.IsAnonymous,
            OriginalPdf = dto.OriginalPdfBase64 is not null ? Convert.FromBase64String(dto.OriginalPdfBase64) : null,
            Status = SurveyStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        foreach (var qDto in dto.Questions)
        {
            var question = new Question
            {
                Type = Enum.Parse<QuestionType>(qDto.Type),
                Title = qDto.Title,
                Description = qDto.Description,
                Order = qDto.Order,
                IsRequired = qDto.IsRequired,
                IsVisibleInReports = qDto.IsVisibleInReports,
                IsRepeatable = qDto.IsRepeatable,
                Placeholder = qDto.Placeholder,
                PdfPageNumber = qDto.PdfPageNumber,
                PdfPositionX = qDto.PdfPositionX,
                PdfPositionY = qDto.PdfPositionY,
            };

            if (qDto.FieldType is not null)
                question.FieldType = Enum.Parse<SimpleFieldType>(qDto.FieldType);

            if (qDto.Alternatives is not null)
            {
                foreach (var aDto in qDto.Alternatives)
                {
                    question.Alternatives.Add(new Alternative
                    {
                        Text = aDto.Text,
                        Score = aDto.Score,
                        Order = aDto.Order
                    });
                }
            }

            survey.Questions.Add(question);
        }

        await _surveyRepository.AddAsync(survey);
        await _unitOfWork.SaveChangesAsync();

        await ResolveParentReferencesAsync(survey, dto.Questions);
        await _unitOfWork.SaveChangesAsync();

        var result = _mapper.Map<SurveyDto>(survey);
        return result with { Questions = PopulateParentQuestionOrder(result.Questions, survey) };
    }

    public async Task UpdateSurveyAsync(int id, CreateSurveyDto dto)
    {
        var survey = await _surveyRepository.GetSurveyWithQuestionsAsync(id)
            ?? throw new KeyNotFoundException($"Encuesta {id} no encontrada.");

        if (survey.Status != SurveyStatus.Draft)
            throw new InvalidOperationException("Solo se pueden editar encuestas en estado borrador.");

        survey.Title = dto.Title;
        survey.Description = dto.Description;
        survey.ValidFrom = dto.ValidFrom;
        survey.ValidTo = dto.ValidTo;
        survey.TargetAudience = dto.TargetAudience;
        survey.IsAnonymous = dto.IsAnonymous;
        survey.UpdatedAt = DateTime.UtcNow;

        foreach (var existing in survey.Questions.ToList())
            _questionRepository.Delete(existing);

        foreach (var qDto in dto.Questions)
        {
            var question = new Question
            {
                SurveyId = survey.Id,
                Type = Enum.Parse<QuestionType>(qDto.Type),
                Title = qDto.Title,
                Description = qDto.Description,
                Order = qDto.Order,
                IsRequired = qDto.IsRequired,
                IsVisibleInReports = qDto.IsVisibleInReports,
                IsRepeatable = qDto.IsRepeatable,
                Placeholder = qDto.Placeholder,
                PdfPageNumber = qDto.PdfPageNumber,
                PdfPositionX = qDto.PdfPositionX,
                PdfPositionY = qDto.PdfPositionY,
            };

            if (qDto.FieldType is not null)
                question.FieldType = Enum.Parse<SimpleFieldType>(qDto.FieldType);

            if (qDto.Alternatives is not null)
            {
                foreach (var aDto in qDto.Alternatives)
                {
                    question.Alternatives.Add(new Alternative
                    {
                        Text = aDto.Text,
                        Score = aDto.Score,
                        Order = aDto.Order
                    });
                }
            }

            survey.Questions.Add(question);
        }

        _surveyRepository.Update(survey);
        await _unitOfWork.SaveChangesAsync();

        await ResolveParentReferencesAsync(survey, dto.Questions);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteSurveyAsync(int id)
    {
        var survey = await _surveyRepository.GetSurveyWithQuestionsAsync(id)
            ?? throw new KeyNotFoundException($"Encuesta {id} no encontrada.");

        var responses = await _responseRepository.GetBySurveyIdAsync(id);
        foreach (var r in responses)
            _responseRepository.Delete(r);

        _surveyRepository.Delete(survey);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task PublishSurveyAsync(int id)
    {
        var survey = await _surveyRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Encuesta {id} no encontrada.");

        survey.Status = SurveyStatus.Published;
        survey.UpdatedAt = DateTime.UtcNow;
        _surveyRepository.Update(survey);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task CloseSurveyAsync(int id)
    {
        var survey = await _surveyRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Encuesta {id} no encontrada.");

        survey.Status = SurveyStatus.Closed;
        survey.UpdatedAt = DateTime.UtcNow;
        _surveyRepository.Update(survey);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task ToggleResultsPublishedAsync(int id)
    {
        var survey = await _surveyRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Encuesta {id} no encontrada.");

        survey.ResultsPublished = !survey.ResultsPublished;
        survey.UpdatedAt = DateTime.UtcNow;
        _surveyRepository.Update(survey);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<int> CloneSurveyAsync(int id)
    {
        var source = await _surveyRepository.GetSurveyWithQuestionsAsync(id)
            ?? throw new KeyNotFoundException($"Encuesta {id} no encontrada.");

        var survey = new Survey
        {
            Title = $"{source.Title} - Copia",
            Description = source.Description,
            ValidFrom = source.ValidFrom,
            ValidTo = source.ValidTo,
            TargetAudience = source.TargetAudience,
            IsAnonymous = source.IsAnonymous,
            ResultsPublished = false,
            Status = SurveyStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        foreach (var sourceQ in source.Questions.OrderBy(q => q.Order))
        {
            var question = new Question
            {
                Type = sourceQ.Type,
                Title = sourceQ.Title,
                Description = sourceQ.Description,
                Order = sourceQ.Order,
                IsRequired = sourceQ.IsRequired,
                IsVisibleInReports = sourceQ.IsVisibleInReports,
                IsRepeatable = sourceQ.IsRepeatable,
                FieldType = sourceQ.FieldType,
                Placeholder = sourceQ.Placeholder,
                ParentAlternativeId = null,
                PdfPageNumber = sourceQ.PdfPageNumber,
                PdfPositionX = sourceQ.PdfPositionX,
                PdfPositionY = sourceQ.PdfPositionY,
            };

            foreach (var sourceA in sourceQ.Alternatives.OrderBy(a => a.Order))
            {
                question.Alternatives.Add(new Alternative
                {
                    Text = sourceA.Text,
                    Score = sourceA.Score,
                    Order = sourceA.Order
                });
            }

            survey.Questions.Add(question);
        }

        await _surveyRepository.AddAsync(survey);
        await _unitOfWork.SaveChangesAsync();

        return survey.Id;
    }

    private static List<QuestionDto>? PopulateParentQuestionOrder(List<QuestionDto>? questions, Survey survey)
    {
        if (questions is null) return null;
        return questions.Select(qDto =>
        {
            if (qDto.ParentAlternativeId is null) return qDto;
            var match = survey.Questions
                .SelectMany(q => q.Alternatives, (q, a) => new { QuestionOrder = q.Order, AlternativeOrder = a.Order, a.Id })
                .FirstOrDefault(x => x.Id == qDto.ParentAlternativeId.Value);
            return match is null ? qDto : qDto with
            {
                ParentQuestionOrder = match.QuestionOrder,
                ParentAlternativeOrder = match.AlternativeOrder
            };
        }).ToList();
    }

    private static Task ResolveParentReferencesAsync(Survey survey, List<CreateQuestionDto> questionDtos)
    {
        var questions = survey.Questions.OrderBy(q => q.Order).ToList();
        foreach (var qDto in questionDtos)
        {
            if (qDto.ParentQuestionOrder is null || qDto.ParentAlternativeOrder is null)
                continue;
            var parentQ = questions.FirstOrDefault(q => q.Order == qDto.ParentQuestionOrder.Value);
            if (parentQ is null) continue;
            var parentAlt = parentQ.Alternatives
                .FirstOrDefault(a => a.Order == qDto.ParentAlternativeOrder.Value);
            if (parentAlt is null) continue;
            var question = questions.FirstOrDefault(q => q.Order == qDto.Order);
            if (question is not null)
                question.ParentAlternativeId = parentAlt.Id;
        }
        return Task.CompletedTask;
    }
}
