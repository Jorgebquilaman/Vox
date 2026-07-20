using Vox.Domain.Entities;
using Vox.Domain.Enums;

namespace Vox.Domain.Tests.Entities;

public class SurveyTests
{
    [Fact]
    public void NewSurvey_ShouldBeInDraftStatus()
    {
        var survey = new Survey();
        Assert.Equal(SurveyStatus.Draft, survey.Status);
    }

    [Fact]
    public void Survey_CanHaveQuestions()
    {
        var survey = new Survey();
        survey.Questions.Add(new Question
        {
            Title = "Pregunta 1",
            Type = QuestionType.SingleChoice,
            Order = 1,
            IsRequired = true
        });

        Assert.Single(survey.Questions);
        Assert.Equal("Pregunta 1", survey.Questions.First().Title);
    }

    [Fact]
    public void Survey_CanCalculateTotalQuestions()
    {
        var survey = new Survey();
        survey.Questions.Add(new Question { Title = "Q1", Type = QuestionType.FreeText, Order = 1 });
        survey.Questions.Add(new Question { Title = "Q2", Type = QuestionType.SingleChoice, Order = 2 });

        Assert.Equal(2, survey.Questions.Count);
    }
}
