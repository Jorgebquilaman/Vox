using Vox.Application.DTOs;
using Vox.Application.Interfaces;
using Vox.Domain.Entities;
using Vox.Domain.Enums;
using Vox.Domain.Interfaces;

namespace Vox.Application.UseCases;

public class SurveyResponseService : ISurveyResponseService
{
    private readonly ISurveyRepository _surveyRepository;
    private readonly ISurveyResponseRepository _responseRepository;
    private readonly IQuestionRepository _questionRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFileStorageService _fileStorage;
    private readonly IAspiranteRepository _aspiranteRepository;
    private readonly IEmailService _emailService;
    private readonly IEmailSettingsRepository _emailSettingsRepository;

    public SurveyResponseService(
        ISurveyRepository surveyRepository,
        ISurveyResponseRepository responseRepository,
        IQuestionRepository questionRepository,
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        IFileStorageService fileStorage,
        IAspiranteRepository aspiranteRepository,
        IEmailService emailService,
        IEmailSettingsRepository emailSettingsRepository)
    {
        _surveyRepository = surveyRepository;
        _responseRepository = responseRepository;
        _questionRepository = questionRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _fileStorage = fileStorage;
        _aspiranteRepository = aspiranteRepository;
        _emailService = emailService;
        _emailSettingsRepository = emailSettingsRepository;
    }

    public async Task<int> SubmitResponseAsync(SubmitSurveyDto dto, int userId)
    {
        var survey = await _surveyRepository.GetSurveyWithQuestionsAsync(dto.SurveyId)
            ?? throw new KeyNotFoundException($"Encuesta {dto.SurveyId} no encontrada.");

        if (survey.Status != SurveyStatus.Published)
            throw new InvalidOperationException("La encuesta no está disponible para responder.");

        var existingResponse = await _responseRepository.GetUserResponseForSurveyAsync(dto.SurveyId, userId);
        bool isUpdate = existingResponse != null;

        if (isUpdate && survey.ValidTo < DateTime.UtcNow)
            throw new InvalidOperationException("La encuesta ya ha finalizado, no puedes modificar tus respuestas.");

        var questions = survey.Questions.OrderBy(q => q.Order).ToList();
        decimal totalScore = 0;

        SurveyResponse response;
        if (isUpdate)
        {
            response = existingResponse!;
            foreach (var answer in response.Answers)
            {
                if (answer.FileId.HasValue)
                    await _fileStorage.DeleteAsync(answer.FileId.Value);
            }
            response.Answers.Clear();
            response.RespondedAt = DateTime.UtcNow;
        }
        else
        {
            response = new SurveyResponse
            {
                SurveyId = dto.SurveyId,
                UserId = userId,
                RespondedAt = DateTime.UtcNow
            };
        }

        foreach (var answerDto in dto.Answers)
        {
            var question = questions.FirstOrDefault(q => q.Id == answerDto.QuestionId)
                ?? throw new KeyNotFoundException($"Pregunta {answerDto.QuestionId} no encontrada.");

            if (question.Type is QuestionType.Section or QuestionType.InfoText)
                continue;

            if (question.IsRequired && answerDto.AlternativeId is null && string.IsNullOrWhiteSpace(answerDto.TextValue) && answerDto.FileId is null)
                throw new InvalidOperationException($"La pregunta '{question.Title}' es obligatoria.");

            var answer = new Answer
            {
                QuestionId = question.Id,
                TextValue = answerDto.TextValue,
                FileId = answerDto.FileId,
                FileName = answerDto.FileId.HasValue ? answerDto.FileName : null,
                ContentType = answerDto.FileId.HasValue ? answerDto.ContentType : null,
                GroupInstance = answerDto.GroupInstance
            };

            if (answerDto.AlternativeId.HasValue)
            {
                var alt = question.Alternatives.FirstOrDefault(a => a.Id == answerDto.AlternativeId.Value)
                    ?? throw new KeyNotFoundException($"Alternativa {answerDto.AlternativeId} no encontrada.");

                answer.AlternativeId = alt.Id;
                totalScore += alt.Score;
            }
            else if (question.Type is QuestionType.StarRating && int.TryParse(answerDto.TextValue, out var stars))
            {
                totalScore += Math.Clamp(stars, 1, 5);
            }
            else if (question.Type is QuestionType.Thumbs && answerDto.TextValue == "up")
            {
                totalScore += 1;
            }

            response.Answers.Add(answer);
        }

        response.TotalScore = totalScore;
        if (!isUpdate)
            await _responseRepository.AddAsync(response);

        await _unitOfWork.SaveChangesAsync();

        var responseId = response.Id;

        if (!isUpdate)
            _ = SendCompletionEmailAsync(userId, dto.SurveyId, survey.Title, survey.IsAnonymous);

        return responseId;
    }

    public async Task<List<AnswerDto>> GetMyAnswersAsync(int surveyId, int userId)
    {
        var response = await _responseRepository.GetUserResponseForSurveyAsync(surveyId, userId);
        if (response is null) return new List<AnswerDto>();

        return response.Answers.Select(a => new AnswerDto(
            a.QuestionId,
            a.AlternativeId,
            a.TextValue,
            a.GroupInstance,
            a.FileId,
            a.FileName,
            a.ContentType
        )).ToList();
    }

    private async Task SendCompletionEmailAsync(int userId, int surveyId, string surveyTitle, bool isAnonymous)
    {
        try
        {
            var settings = await _emailSettingsRepository.GetSingletonAsync();
            if (settings is null || !settings.Enabled)
                return;

            var user = await _userRepository.GetByIdAsync(userId);
            if (user is null)
                return;

            string? to = user.Email;
            if (string.IsNullOrWhiteSpace(to) && !isAnonymous)
            {
                var aspirante = await _aspiranteRepository.GetByUserIdAsync(userId);
                to = aspirante?.EmailContacto;
            }

            if (string.IsNullOrWhiteSpace(to))
                return;

            var body = $@"<div style='font-family:Segoe UI,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a'>
  <h2 style='color:#1e3a5f;margin-bottom:8px'>¡Gracias por completar la encuesta!</h2>
  <p>Hola {user.Name},</p>
  <p>Registramos correctamente tu respuesta a la encuesta <strong>{surveyTitle}</strong>.</p>
  <p style='color:#64748b;font-size:13px'>Este es un mensaje automático, no es necesario responderlo.</p>
</div>";
            await _emailService.SendAsync(to, $"Encuesta completada: {surveyTitle}", body, settings);
        }
        catch
        {
            // El envío de correo no debe interrumpir la respuesta guardada.
        }
    }

    public async Task<SurveyResultDto> GetSurveyResultsAsync(int surveyId, int userId, string userRole)
    {
        var survey = await _surveyRepository.GetSurveyWithQuestionsAsync(surveyId)
            ?? throw new KeyNotFoundException($"Encuesta {surveyId} no encontrada.");

        var isAdmin = userRole == nameof(UserRole.Admin);
        var showAll = isAdmin || survey.ResultsPublished;

        var allResponses = await _responseRepository.GetRankingBySurveyAsync(surveyId);
        var responses = showAll ? allResponses : allResponses.Where(r => r.UserId == userId);

        var rankings = new List<UserResultDto>();
        foreach (var r in responses)
        {
            UserDemographicsDto? demographics = null;
            string userName;

            if (survey.IsAnonymous)
            {
                userName = "Anónimo";
            }
            else
            {
                userName = r.User.Name;
                if (isAdmin)
                {
                    var aspirante = await _aspiranteRepository.GetByUserIdAsync(r.UserId);
                    if (aspirante is not null)
                    {
                        var edad = aspirante.FechaNacimiento.HasValue
                            ? (DateTime.UtcNow.Year - aspirante.FechaNacimiento.Value.Year).ToString()
                            : null;
                        var propuesta = aspirante.Propuestas
                            .OrderBy(p => p.Orden)
                            .FirstOrDefault();
                        demographics = new UserDemographicsDto(
                            edad,
                            aspirante.IdentidadGenero,
                            aspirante.Localidad,
                            aspirante.Provincia,
                            aspirante.Pais,
                            aspirante.EstudiosPrevios,
                            aspirante.Telefono,
                            aspirante.EmailContacto,
                            propuesta?.PropuestaFormativa,
                            propuesta?.UnidadAcademica
                        );
                    }
                }
            }

            var answerDtos = r.Answers
                .Where(a => a.Question.Type is not QuestionType.Section and not QuestionType.InfoText)
                .Select(a => new AnswerDetailDto(
                    a.QuestionId,
                    a.Question.Title,
                    a.Alternative?.Text,
                    a.AlternativeId,
                    a.Alternative?.Score,
                    a.TextValue,
                    isAdmin || a.Question.IsVisibleInReports,
                    a.GroupInstance,
                    a.FileId,
                    a.FileName,
                    a.ContentType
                )).ToList();

            rankings.Add(new UserResultDto(
                survey.IsAnonymous ? 0 : r.UserId,
                userName,
                r.TotalScore,
                r.RespondedAt,
                answerDtos,
                demographics
            ));
        }

        rankings = rankings.OrderByDescending(r => r.TotalScore).ToList();

        return new SurveyResultDto(surveyId, survey.Title, responses.Count(), survey.IsAnonymous, survey.ResultsPublished, rankings);
    }

    public async Task DeleteUserResponseAsync(int surveyId, int userId)
    {
        var response = await _responseRepository.GetUserResponseForSurveyAsync(surveyId, userId)
            ?? throw new KeyNotFoundException($"El usuario {userId} no ha respondido la encuesta {surveyId}.");

        foreach (var answer in response.Answers)
        {
            if (answer.FileId.HasValue)
                await _fileStorage.DeleteAsync(answer.FileId.Value);
        }

        _responseRepository.Delete(response);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<bool> CanAccessFileAsync(Guid fileId, int userId, string userRole)
    {
        if (userRole == nameof(UserRole.Admin))
            return true;

        var response = await _responseRepository.GetResponseByFileIdAsync(fileId);
        return response?.UserId == userId;
    }

    public async Task<(string FileName, string ContentType)> GetFileInfoAsync(Guid fileId)
    {
        var answer = await _responseRepository.GetAnswerByFileIdAsync(fileId)
            ?? throw new KeyNotFoundException("Archivo no encontrado.");

        return (answer.FileName ?? "archivo", answer.ContentType ?? "application/octet-stream");
    }

    public async Task<IEnumerable<SurveyResultDto>> GetAllResultsAsync(int userId, string userRole)
    {
        var surveys = await _surveyRepository.GetAllAsync();
        var results = new List<SurveyResultDto>();

        foreach (var survey in surveys)
        {
            var result = await GetSurveyResultsAsync(survey.Id, userId, userRole);
            results.Add(result);
        }

        return results;
    }

    public async Task<ResponsePdfDataDto> GetResponsePdfDataAsync(int surveyId, int userId, int currentUserId, string currentUserRole)
    {
        var response = await _responseRepository.GetUserResponseForSurveyAsync(surveyId, userId)
            ?? throw new KeyNotFoundException("Respuesta no encontrada.");

        if (currentUserRole != nameof(UserRole.Admin) && response.UserId != currentUserId)
            throw new UnauthorizedAccessException("No tienes permiso para ver esta respuesta.");

        var user = response.User;
        var survey = await _surveyRepository.GetSurveyWithQuestionsAsync(surveyId)
            ?? throw new KeyNotFoundException("Encuesta no encontrada.");

        var items = new List<PdfAnswerItemDto>();

        foreach (var question in survey.Questions.OrderBy(q => q.Order))
        {
            if (question.Type is QuestionType.Section)
            {
                items.Add(new PdfAnswerItemDto
                {
                    QuestionOrder = question.Order,
                    QuestionTitle = question.Title,
                    IsSection = true
                });
                continue;
            }

            if (question.Type is QuestionType.InfoText)
                continue;

            var answers = response.Answers
                .Where(a => a.QuestionId == question.Id)
                .OrderBy(a => a.GroupInstance)
                .ToList();

            if (answers.Count == 0)
            {
                items.Add(new PdfAnswerItemDto
                {
                    QuestionOrder = question.Order,
                    QuestionTitle = question.Title,
                    SelectedAlternative = "(sin respuesta)",
                    PdfPageNumber = question.PdfPageNumber,
                    PdfPositionX = question.PdfPositionX,
                    PdfPositionY = question.PdfPositionY
                });
                continue;
            }

            foreach (var answer in answers)
            {
                items.Add(new PdfAnswerItemDto
                {
                    QuestionOrder = question.Order,
                    QuestionTitle = question.Title,
                    SelectedAlternative = answer.Alternative?.Text,
                    TextValue = answer.TextValue,
                    Score = answer.Alternative?.Score,
                    FileName = answer.FileName,
                    GroupInstance = answer.GroupInstance,
                    PdfPageNumber = question.PdfPageNumber,
                    PdfPositionX = question.PdfPositionX,
                    PdfPositionY = question.PdfPositionY
                });
            }
        }

        return new ResponsePdfDataDto
        {
            ResponseId = response.Id,
            SurveyId = surveyId,
            SurveyTitle = survey.Title,
            SurveyDescription = survey.Description ?? string.Empty,
            RespondentName = user.Name,
            RespondentEmail = user.Email ?? string.Empty,
            RespondedAt = response.RespondedAt,
            OriginalPdfBase64 = survey.OriginalPdf is { Length: > 0 } pdfBytes
                ? Convert.ToBase64String(pdfBytes)
                : null,
            Answers = items
        };
    }

    public async Task<ResponseFormDto> GetResponseFormDataAsync(int surveyId, int userId, int currentUserId, string currentUserRole)
    {
        var response = await _responseRepository.GetUserResponseForSurveyAsync(surveyId, userId)
            ?? throw new KeyNotFoundException("Respuesta no encontrada.");

        if (currentUserRole != nameof(UserRole.Admin) && response.UserId != currentUserId)
            throw new UnauthorizedAccessException("No tienes permiso para ver esta respuesta.");

        var user = response.User;
        var survey = await _surveyRepository.GetSurveyWithQuestionsAsync(surveyId)
            ?? throw new KeyNotFoundException("Encuesta no encontrada.");

        var sections = new List<FormSectionDto>();
        FormSectionDto? currentSection = null;

        foreach (var question in survey.Questions.OrderBy(q => q.Order))
        {
            if (question.Type is QuestionType.Section)
            {
                if (currentSection is not null && !currentSection.IsRepeatable)
                    sections.Add(currentSection);

                currentSection = new FormSectionDto
                {
                    Title = question.Title,
                    Description = question.Description,
                    Order = question.Order,
                    IsRepeatable = question.IsRepeatable,
                    Questions = new List<FormQuestionDto>()
                };
                continue;
            }

            if (question.Type is QuestionType.InfoText)
            {
                if (currentSection is not null)
                {
                    currentSection.Questions.Add(new FormQuestionDto
                    {
                        Id = question.Id,
                        Type = nameof(QuestionType.InfoText),
                        Title = question.Title,
                        Description = question.Description,
                        Order = question.Order
                    });
                }
                continue;
            }

            var answers = response.Answers
                .Where(a => a.QuestionId == question.Id)
                .OrderBy(a => a.GroupInstance)
                .ToList();

            var formQuestion = new FormQuestionDto
            {
                Id = question.Id,
                Type = question.Type.ToString(),
                Title = question.Title,
                Description = question.Description,
                Order = question.Order,
                IsRequired = question.IsRequired,
                FieldType = question.FieldType?.ToString(),
                Placeholder = question.Placeholder,
                Alternatives = question.Alternatives.OrderBy(a => a.Order).Select(a => new FormAlternativeDto
                {
                    Id = a.Id,
                    Text = a.Text,
                    Order = a.Order,
                    IsSelected = answers.Any(ans => ans.AlternativeId == a.Id)
                }).ToList(),
                Answers = answers.Select(a => new FormAnswerValueDto
                {
                    AlternativeId = a.AlternativeId,
                    TextValue = a.TextValue,
                    FileId = a.FileId,
                    FileName = a.FileName,
                    GroupInstance = a.GroupInstance
                }).ToList()
            };

            if (currentSection is not null)
                currentSection.Questions.Add(formQuestion);
            else
            {
                sections.Add(new FormSectionDto
                {
                    Order = 0,
                    Questions = new List<FormQuestionDto> { formQuestion }
                });
            }
        }

        if (currentSection is not null)
            sections.Add(currentSection);

        return new ResponseFormDto
        {
            SurveyId = surveyId,
            SurveyTitle = survey.Title,
            SurveyDescription = survey.Description ?? string.Empty,
            RespondentName = user.Name,
            RespondentEmail = user.Email ?? string.Empty,
            RespondedAt = response.RespondedAt,
            Sections = sections
        };
    }

    public async Task<VerificationInfoDto> GetVerificationInfoAsync(int responseId)
    {
        var response = await _responseRepository.GetByIdWithDetailsAsync(responseId);

        if (response is null)
            return new VerificationInfoDto { ResponseId = responseId, Exists = false };

        return new VerificationInfoDto
        {
            ResponseId = response.Id,
            SurveyTitle = response.Survey.Title,
            RespondentName = response.User.Name,
            RespondedAt = response.RespondedAt,
            Exists = true
        };
    }
}
