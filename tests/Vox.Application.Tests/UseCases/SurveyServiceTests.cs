using AutoMapper;
using Vox.Application.DTOs;
using Vox.Application.Interfaces;
using Vox.Application.Mapping;
using Vox.Application.UseCases;
using Vox.Domain.Entities;
using Vox.Domain.Enums;
using Vox.Domain.Interfaces;
using Moq;

namespace Vox.Application.Tests.UseCases;

public class SurveyServiceTests
{
    private readonly Mock<ISurveyRepository> _surveyRepoMock;
    private readonly Mock<IQuestionRepository> _questionRepoMock;
    private readonly Mock<ISurveyResponseRepository> _responseRepoMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly IMapper _mapper;
    private readonly SurveyService _service;

    public SurveyServiceTests()
    {
        _surveyRepoMock = new Mock<ISurveyRepository>();
        _questionRepoMock = new Mock<IQuestionRepository>();
        _responseRepoMock = new Mock<ISurveyResponseRepository>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();

        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = config.CreateMapper();

        _service = new SurveyService(
            _surveyRepoMock.Object,
            _questionRepoMock.Object,
            _responseRepoMock.Object,
            _unitOfWorkMock.Object,
            _mapper);
    }

    [Fact]
    public async Task GetAvailableSurveysAsync_ShouldReturnOnlyPublished()
    {
        var userId = 1;
        var surveys = new List<Survey>
        {
            new() { Id = 1, Title = "Encuesta 1", Status = SurveyStatus.Published, ValidFrom = DateTime.UtcNow.AddDays(-1), ValidTo = DateTime.UtcNow.AddDays(1) },
            new() { Id = 2, Title = "Encuesta 2", Status = SurveyStatus.Published, ValidFrom = DateTime.UtcNow.AddDays(-1), ValidTo = DateTime.UtcNow.AddDays(1) }
        };

        _surveyRepoMock.Setup(r => r.GetAvailableSurveysForUserAsync(userId))
            .ReturnsAsync(surveys);

        var result = await _service.GetAvailableSurveysAsync(userId);

        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task GetSurveyByIdAsync_ShouldThrow_WhenNotFound()
    {
        _surveyRepoMock.Setup(r => r.GetSurveyWithQuestionsAsync(It.IsAny<int>()))
            .ReturnsAsync((Survey?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.GetSurveyByIdAsync(999, 1));
    }

    [Fact]
    public async Task CreateSurveyAsync_ShouldAddAndReturnSurvey()
    {
        var dto = new CreateSurveyDto(
            "Encuesta de prueba", "Descripción",
            DateTime.UtcNow, DateTime.UtcNow.AddDays(7),
            "Todos", false,
            new List<CreateQuestionDto>
            {
                new("SingleChoice", "¿Cómo estás?", null, 1, true, true, false, null, null, null, null, null,
                    new List<CreateAlternativeDto>
                    {
                        new("Bien", 5, 1),
                        new("Mal", 1, 2)
                    })
            });

        _surveyRepoMock.Setup(r => r.AddAsync(It.IsAny<Survey>()))
            .Returns(Task.CompletedTask);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(default))
            .ReturnsAsync(1);

        var result = await _service.CreateSurveyAsync(dto);

        Assert.NotNull(result);
        Assert.Equal("Encuesta de prueba", result.Title);
        _surveyRepoMock.Verify(r => r.AddAsync(It.IsAny<Survey>()), Times.Once);
    }

    [Fact]
    public async Task PublishSurveyAsync_ShouldUpdateStatus()
    {
        var survey = new Survey { Id = 1, Status = SurveyStatus.Draft };
        _surveyRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(survey);

        await _service.PublishSurveyAsync(1);

        Assert.Equal(SurveyStatus.Published, survey.Status);
        _surveyRepoMock.Verify(r => r.Update(survey), Times.Once);
    }

    [Fact]
    public async Task UpdateSurveyAsync_ShouldThrow_WhenNotDraft()
    {
        var survey = new Survey { Id = 1, Status = SurveyStatus.Published };
        _surveyRepoMock.Setup(r => r.GetSurveyWithQuestionsAsync(1)).ReturnsAsync(survey);

        var dto = new CreateSurveyDto("Test", "Desc", DateTime.UtcNow, DateTime.UtcNow, null, false, new List<CreateQuestionDto>());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.UpdateSurveyAsync(1, dto));
    }
}
