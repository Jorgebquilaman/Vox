using Vox.Domain.Entities;

namespace Vox.Domain.Tests.Entities;

public class ResponseTests
{
    [Fact]
    public void SurveyResponse_ShouldAccumulateScore()
    {
        var response = new SurveyResponse();
        response.TotalScore = 15;

        Assert.Equal(15, response.TotalScore);
    }

    [Fact]
    public void SurveyResponse_ShouldStoreMultipleAnswers()
    {
        var response = new SurveyResponse();

        response.Answers.Add(new Answer
        {
            QuestionId = 1,
            AlternativeId = 1
        });

        response.Answers.Add(new Answer
        {
            QuestionId = 2,
            TextValue = "Comentario libre"
        });

        Assert.Equal(2, response.Answers.Count);
    }
}
