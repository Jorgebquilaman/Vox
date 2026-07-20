import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Printer, ArrowLeft, Star, ThumbsUp, ThumbsDown } from '@phosphor-icons/react'
import api from '../../../shared/lib/api'
import type { ResponseFormData } from '../../../shared/types'
import Spinner from '../../../shared/components/Spinner'

const fieldTypeLabel: Record<string, string> = {
  Text: 'Texto', Number: 'Número', Email: 'Correo', Phone: 'Teléfono', DNI: 'DNI', Date: 'Fecha'
}

function AnswerValue({ q }: { q: ResponseFormData['sections'][0]['questions'][0] }) {
  if (q.type === 'InfoText') return null

  if (q.type === 'FileUpload') {
    const file = q.answers[0]
    return file?.fileName ? (
      <span className="text-sm text-primary font-medium">{file.fileName}</span>
    ) : (
      <span className="text-sm text-muted-text italic">(sin archivo)</span>
    )
  }

  if (q.type === 'StarRating') {
    const val = parseInt(q.answers[0]?.textValue || '0')
    return val > 0 ? (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(n => (
          <Star key={n} size={22} weight={n <= val ? 'fill' : 'regular'}
            className={n <= val ? 'text-accent' : 'text-muted-text'} />
        ))}
        <span className="ml-2 text-sm text-muted-text font-medium">{val}/5</span>
      </div>
    ) : (
      <span className="text-sm text-muted-text italic">(sin respuesta)</span>
    )
  }

  if (q.type === 'Thumbs') {
    const val = q.answers[0]?.textValue
    if (val === 'up')
      return <div className="flex items-center gap-2 text-success font-semibold text-sm"><ThumbsUp size={20} weight="fill" /> Me gusta</div>
    if (val === 'down')
      return <div className="flex items-center gap-2 text-red-500 dark:text-red-400 font-semibold text-sm"><ThumbsDown size={20} weight="fill" /> No me gusta</div>
    return <span className="text-sm text-muted-text italic">(sin respuesta)</span>
  }

  if (q.type === 'FreeText' || q.type === 'SimpleField') {
    const val = q.answers[0]?.textValue
    if (q.type === 'SimpleField' && !val) return null
    return val ? (
      <div className="bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-ink min-h-[40px]">
        {val}
      </div>
    ) : (
      <span className="text-sm text-muted-text italic">(sin respuesta)</span>
    )
  }

  if (q.type === 'MultipleChoice') {
    const selected = q.alternatives.filter(a => a.isSelected)
    if (selected.length === 0) return <span className="text-sm text-muted-text italic">(sin respuesta)</span>
    return (
      <div className="space-y-1.5">
        {q.alternatives.map(a => (
          <label key={a.id} className="flex items-center gap-2.5 cursor-default">
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
              a.isSelected
                ? 'border-primary bg-primary'
                : 'border-border'
            }`}>
              {a.isSelected && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                  <path stroke="currentColor" strokeWidth="2.5" d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className={`text-sm ${a.isSelected ? 'font-semibold text-ink' : 'text-muted-text'}`}>{a.text}</span>
          </label>
        ))}
      </div>
    )
  }

  const selectedAlt = q.alternatives.find(a => a.isSelected)
  if (!selectedAlt && !q.answers[0]?.textValue) return <span className="text-sm text-muted-text italic">(sin respuesta)</span>

  if (selectedAlt) {
    return (
      <div className="space-y-1.5">
        {q.alternatives.map(a => (
          <label key={a.id} className="flex items-center gap-2.5 cursor-default">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
              a.isSelected ? 'border-primary' : 'border-border'
            }`}>
              {a.isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <span className={`text-sm ${a.isSelected ? 'font-semibold text-ink' : 'text-muted-text'}`}>{a.text}</span>
          </label>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-ink min-h-[40px]">
      {q.answers[0]?.textValue}
    </div>
  )
}

function QuestionCard({ q, idx }: { q: ResponseFormData['sections'][0]['questions'][0]; idx: number }) {
  if (q.type === 'InfoText') {
    return (
      <div className="bg-accent-light dark:bg-accent-light/30 border-l-4 border-accent rounded-r-lg px-4 py-3 mb-4">
        {q.title && <p className="text-sm font-bold text-accent dark:text-accent">{q.title}</p>}
        {q.description && <p className="text-sm text-muted-text mt-0.5 leading-relaxed">{q.description}</p>}
      </div>
    )
  }

  const isSection = q.type === 'Section'
  if (isSection) return null

  const fieldType = q.fieldType ? fieldTypeLabel[q.fieldType] || q.fieldType : null

  return (
    <div className="mb-5 border border-border rounded-xl p-4 bg-surface shadow-sm" style={{ breakInside: 'avoid' }}>
      <div className="flex items-start gap-2 mb-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
          {idx}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink leading-snug">
            {q.title}
            {q.isRequired && <span className="text-error ml-0.5">*</span>}
          </p>
          {fieldType && (
            <span className="text-[11px] text-muted-text uppercase tracking-wider">{fieldType}</span>
          )}
        </div>
      </div>
      <div className="ml-8">
        <AnswerValue q={q} />
      </div>
    </div>
  )
}

export default function ResponseFormPage() {
  const { surveyId, userId } = useParams<{ surveyId: string; userId: string }>()
  const nav = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['response-form', surveyId, userId],
    queryFn: () => api.get<ResponseFormData>(`/surveys/${surveyId}/responses/${userId}/form-data`).then(r => r.data),
    enabled: !!surveyId && !!userId
  })

  return (
    <div className="min-h-dvh bg-muted dark:bg-muted print:bg-white pb-12">
      <div className="max-w-2xl mx-auto px-4 py-6 print:py-0">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-sm text-muted-text hover:text-ink transition-colors">
            <ArrowLeft size={16} /> Volver
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-border rounded-xl hover:bg-muted transition-all">
            <Printer size={16} /> Imprimir
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : !data ? (
          <p className="text-center text-muted-text py-20">No se encontraron datos.</p>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="font-display text-2xl font-extrabold text-ink">{data.surveyTitle}</h1>
              {data.surveyDescription && (
                <p className="text-sm text-muted-text mt-1 leading-relaxed">{data.surveyDescription}</p>
              )}
              <div className="mt-4 inline-flex flex-col items-center gap-1 text-xs text-muted-text bg-muted rounded-xl px-4 py-2.5">
                <span><strong>Estudiante:</strong> {data.respondentName}</span>
                <span><strong>Email:</strong> {data.respondentEmail}</span>
                <span><strong>Respondido:</strong> {new Date(data.respondedAt).toLocaleDateString('es-AR', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}</span>
              </div>
            </div>

            {data.sections.map((section) => (
              <div key={section.order} className="mb-8">
                {section.title && (
                  <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg px-4 py-3 mb-4 print:bg-muted print:border-muted-text">
                    <h2 className="font-display text-lg font-bold text-primary-dark">{section.title}</h2>
                    {section.description && (
                      <p className="text-sm text-muted-text mt-0.5 leading-relaxed">{section.description}</p>
                    )}
                  </div>
                )}
                {section.questions.map((q, i) => (
                  <QuestionCard key={q.id} q={q} idx={i + 1} />
                ))}
                {section.questions.length === 0 && (
                  <p className="text-sm text-muted-text italic text-center py-4">No hay preguntas en esta sección.</p>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          @page { margin: 15mm; }
        }
      `}} />
    </div>
  )
}
