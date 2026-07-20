using Vox.Domain.Entities;
using Vox.Domain.Enums;

namespace Vox.Domain.Tests.Entities;

public class QuestionTests
{
    [Fact]
    public void SingleChoiceQuestion_ShouldAcceptAlternatives()
    {
        var question = new Question
        {
            Type = QuestionType.SingleChoice,
            Title = "¿Cómo calificas el curso?",
            IsRequired = true,
            Order = 1
        };

        question.Alternatives.Add(new Alternative { Text = "Excelente", Score = 5, Order = 1 });
        question.Alternatives.Add(new Alternative { Text = "Bueno", Score = 4, Order = 2 });
        question.Alternatives.Add(new Alternative { Text = "Regular", Score = 3, Order = 3 });

        Assert.Equal(3, question.Alternatives.Count);
        Assert.Equal(5, question.Alternatives.First().Score);
    }

    [Fact]
    public void SimpleFieldQuestion_ShouldHaveFieldType()
    {
        var question = new Question
        {
            Type = QuestionType.SimpleField,
            FieldType = SimpleFieldType.DNI,
            Title = "Ingrese su DNI",
            IsRequired = true,
            Order = 1
        };

        Assert.Equal(SimpleFieldType.DNI, question.FieldType);
        Assert.Equal(QuestionType.SimpleField, question.Type);
    }

    [Fact]
    public void FreeTextQuestion_ShouldNotHaveAlternatives()
    {
        var question = new Question
        {
            Type = QuestionType.FreeText,
            Title = "Comentarios adicionales",
            Order = 1
        };

        Assert.Empty(question.Alternatives);
    }

    [Fact]
    public void Question_IsVisibleInReports_DefaultsToTrue()
    {
        var question = new Question();
        Assert.True(question.IsVisibleInReports);
    }
}
