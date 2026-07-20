using Vox.Application.DTOs;
using Vox.Application.Interfaces;
using Vox.Application.UseCases;
using Vox.Domain.Entities;
using Vox.Domain.Enums;
using Vox.Domain.Interfaces;
using Moq;

namespace Vox.Application.Tests.UseCases;

public class SurveyResponseServiceTests
{
    private readonly Mock<ISurveyRepository> _surveyRepoMock;
    private readonly Mock<ISurveyResponseRepository> _responseRepoMock;
    private readonly Mock<IQuestionRepository> _questionRepoMock;
    private readonly Mock<IUserRepository> _userRepoMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IFileStorageService> _fileStorageMock;
    private readonly Mock<IAspiranteRepository> _aspiranteMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<IEmailSettingsRepository> _emailSettingsMock;
    private readonly SurveyResponseService _service;

    public SurveyResponseServiceTests()
    {
        _surveyRepoMock = new Mock<ISurveyRepository>();
        _responseRepoMock = new Mock<ISurveyResponseRepository>();
        _questionRepoMock = new Mock<IQuestionRepository>();
        _userRepoMock = new Mock<IUserRepository>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _fileStorageMock = new Mock<IFileStorageService>();
        _aspiranteMock = new Mock<IAspiranteRepository>();
        _emailServiceMock = new Mock<IEmailService>();
        _emailSettingsMock = new Mock<IEmailSettingsRepository>();

        _service = new SurveyResponseService(
            _surveyRepoMock.Object,
            _responseRepoMock.Object,
            _questionRepoMock.Object,
            _userRepoMock.Object,
            _unitOfWorkMock.Object,
            _fileStorageMock.Object,
            _aspiranteMock.Object,
            _emailServiceMock.Object,
            _emailSettingsMock.Object);
    }

    [Fact]
    public async Task SubmitResponseAsync_ShouldCalculateTotalScore()
    {
        var surveyId = 1;
        var userId = 1;

        var survey = new Survey
        {
            Id = surveyId,
            Status = SurveyStatus.Published,
            Questions = new List<Question>
            {
                new()
                {
                    Id = 1, Type = QuestionType.SingleChoice, Title = "P1", IsRequired = true, Order = 1,
                    Alternatives = new List<Alternative>
                    {
                        new() { Id = 1, Text = "A", Score = 10, Order = 1 },
                        new() { Id = 2, Text = "B", Score = 5, Order = 2 }
                    }
                },
                new()
                {
                    Id = 2, Type = QuestionType.MultipleChoice, Title = "P2", IsRequired = true, Order = 2,
                    Alternatives = new List<Alternative>
                    {
                        new() { Id = 3, Text = "C", Score = 3, Order = 1 },
                        new() { Id = 4, Text = "D", Score = 2, Order = 2 }
                    }
                }
            }
        };

        _surveyRepoMock.Setup(r => r.GetSurveyWithQuestionsAsync(surveyId)).ReturnsAsync(survey);
        _responseRepoMock.Setup(r => r.HasUserRespondedAsync(surveyId, userId)).ReturnsAsync(false);
        _responseRepoMock.Setup(r => r.AddAsync(It.IsAny<SurveyResponse>())).Returns(Task.CompletedTask);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        var dto = new SubmitSurveyDto(surveyId, new List<AnswerDto>
        {
            new(1, 1, null),
            new(2, 3, null)
        });

        await _service.SubmitResponseAsync(dto, userId);

        _responseRepoMock.Verify(r => r.AddAsync(It.Is<SurveyResponse>(resp =>
            resp.TotalScore == 13)), Times.Once);
    }

    [Fact]
    public async Task SubmitResponseAsync_ShouldThrow_WhenAlreadyRespondedAndSurveyClosed()
    {
        _surveyRepoMock.Setup(r => r.GetSurveyWithQuestionsAsync(1))
            .ReturnsAsync(new Survey { Id = 1, Status = SurveyStatus.Published, ValidTo = DateTime.UtcNow.AddDays(-1) });
        _responseRepoMock.Setup(r => r.GetUserResponseForSurveyAsync(1, 1))
            .ReturnsAsync(new SurveyResponse { Id = 1, Answers = new List<Answer>() });

        var dto = new SubmitSurveyDto(1, new List<AnswerDto>());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.SubmitResponseAsync(dto, 1));
    }

    [Fact]
    public async Task SubmitResponseAsync_ShouldThrow_WhenSurveyNotPublished()
    {
        _surveyRepoMock.Setup(r => r.GetSurveyWithQuestionsAsync(1))
            .ReturnsAsync(new Survey { Id = 1, Status = SurveyStatus.Draft });

        var dto = new SubmitSurveyDto(1, new List<AnswerDto>());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.SubmitResponseAsync(dto, 1));
    }

    [Fact]
    public async Task GetSurveyResultsAsync_ShouldFilterVisibility_ForStudents()
    {
        var surveyId = 1;
        var userId = 2;

        var survey = new Survey
        {
            Id = surveyId, Title = "Test",
            Questions = new List<Question>
            {
                new() { Id = 1, Title = "Visible", IsVisibleInReports = true },
                new() { Id = 2, Title = "Oculta", IsVisibleInReports = false }
            }
        };

        _surveyRepoMock.Setup(r => r.GetSurveyWithQuestionsAsync(surveyId)).ReturnsAsync(survey);
        _responseRepoMock.Setup(r => r.GetRankingBySurveyAsync(surveyId))
            .ReturnsAsync(new List<SurveyResponse>
            {
                new()
                {
                    UserId = 2, User = new User { Name = "Alumno" }, TotalScore = 10, RespondedAt = DateTime.UtcNow,
                    Answers = new List<Answer>
                    {
                        new() { QuestionId = 1, Question = survey.Questions.ElementAt(0), Alternative = new Alternative { Text = "Sí" }, AlternativeId = 1 },
                        new() { QuestionId = 2, Question = survey.Questions.ElementAt(1), TextValue = "Secreto" }
                    }
                }
            });

        var result = await _service.GetSurveyResultsAsync(surveyId, userId, "Student");

        var answer = result.Rankings.First().Answers.First(a => a.QuestionId == 2);
        Assert.False(answer.IsVisible);
    }
}
