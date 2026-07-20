using AutoMapper;
using Vox.Application.DTOs;
using Vox.Domain.Entities;

namespace Vox.Application.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Survey, SurveyDto>()
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.IsAnonymous, o => o.MapFrom(s => s.IsAnonymous))
            .ForMember(d => d.Questions, o => o.MapFrom(s => s.Questions.OrderBy(q => q.Order)));

        CreateMap<Question, QuestionDto>()
            .ForMember(d => d.Type, o => o.MapFrom(q => q.Type.ToString()))
            .ForMember(d => d.FieldType, o => o.MapFrom(q => q.FieldType.ToString()))
            .ForCtorParam(nameof(QuestionDto.ParentQuestionOrder), o => o.MapFrom(_ => (int?)null))
            .ForCtorParam(nameof(QuestionDto.ParentAlternativeOrder), o => o.MapFrom(_ => (int?)null))
            .ForCtorParam(nameof(QuestionDto.PdfPageNumber), o => o.MapFrom(q => q.PdfPageNumber))
            .ForCtorParam(nameof(QuestionDto.PdfPositionX), o => o.MapFrom(q => q.PdfPositionX))
            .ForCtorParam(nameof(QuestionDto.PdfPositionY), o => o.MapFrom(q => q.PdfPositionY))
            .ForMember(d => d.Alternatives, o => o.MapFrom(q => q.Alternatives.OrderBy(a => a.Order)));

        CreateMap<Alternative, AlternativeDto>();
    }
}
