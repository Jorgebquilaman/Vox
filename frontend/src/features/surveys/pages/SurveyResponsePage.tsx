import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../../shared/lib/api'
import type { Survey, SurveySummary, SubmitAnswer, ResponsePdfData } from '../../../shared/types'
import Spinner from '../../../shared/components/Spinner'
import QuestionRenderer from '../../../shared/components/QuestionRenderer'
import { Plus, Trash, FilePdf } from '@phosphor-icons/react'
import generateResponsePdf from '../../../shared/lib/generateResponsePdf'

export default function SurveyResponsePage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()

  const { data: survey, isLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => api.get<Survey>(`/surveys/${id}`).then(r => r.data),
    enabled: !!id
  })

  const { data: responded } = useQuery({
    queryKey: ['surveys-responded'],
    queryFn: () => api.get<SurveySummary[]>('/surveys/responded').then(r => r.data)
  })

  const [answers, setAnswers] = useState<Record<string, SubmitAnswer>>({})
  const [groupInstances, setGroupInstances] = useState<Record<number, number>>({})
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!survey) return
    const init: Record<number, number> = {}
    for (const q of survey.questions) {
      if (q.type === 'Section' && q.isRepeatable) init[q.id] = 1
    }
    setGroupInstances(init)
  }, [survey])

  const mutation = useMutation({
    mutationFn: (data: { surveyId: number; answers: SubmitAnswer[] }) =>
      api.post(`/surveys/${data.surveyId}/respond`, data),
    onSuccess: () => { setDone(true); toast.success('Respuestas enviadas') },
    onError: (e: any) => toast.error(e.response?.data?.message || e.response?.data?.error || 'Error al enviar')
  })

  const alreadyResponded = responded?.some(s => s.id === Number(id))

  const { data: myAnswers } = useQuery({
    queryKey: ['my-answers', id],
    queryFn: () => api.get<SubmitAnswer[]>(`/surveys/${id}/my-answers`).then(r => r.data),
    enabled: !!id && alreadyResponded
  })

  useEffect(() => {
    if (!myAnswers || !survey) return
    const init: Record<string, SubmitAnswer> = {}
    const instCounts: Record<number, number> = {}
    const qTypes = new Map(survey.questions.map(q => [q.id, q.type]))
    for (const a of myAnswers) {
      const key = a.groupInstance != null ? `${a.questionId}-${a.groupInstance}` : String(a.questionId)
      if (qTypes.get(a.questionId) === 'MultipleChoice' && a.alternativeId != null) {
        if (!init[key]) {
          init[key] = { ...a, alternativeIds: [a.alternativeId], alternativeId: undefined }
        } else {
          init[key].alternativeIds!.push(a.alternativeId)
        }
      } else {
        init[key] = a
      }
      if (a.groupInstance != null) {
        let sectionId: number | null = null
        for (const q of survey.questions) {
          if (q.id === a.questionId) break
          if (q.type === 'Section' && q.isRepeatable) sectionId = q.id
        }
        if (sectionId != null)
          instCounts[sectionId] = Math.max(instCounts[sectionId] ?? 0, a.groupInstance + 1)
      }
    }
    setAnswers(init)
    if (Object.keys(instCounts).length > 0)
      setGroupInstances(p => ({ ...p, ...instCounts }))
  }, [myAnswers, survey])

  const downloadPdf = useCallback(async () => {
    if (!id) return
    const res = await api.get<ResponsePdfData>(`/surveys/${id}/my-response/pdf-data`)
    await generateResponsePdf(res.data)
    toast.success('PDF descargado')
  }, [id])

  if (isLoading || !survey) return (
    <div className="min-h-dvh flex items-center justify-center bg-muted"><Spinner /></div>
  )

  const isOpen = survey.status === 'Published' && new Date(survey.validTo) >= new Date()
  const isEditing = alreadyResponded && isOpen

  if (alreadyResponded && !isOpen) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-muted px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-success/10 border border-success/30 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <span className="text-3xl text-success font-bold">✓</span>
          </div>
          <h2 className="font-display text-xl font-bold text-ink mb-2 tracking-tight">Ya respondiste esta encuesta</h2>
          <p className="text-muted-text text-sm">No podés volver a responderla porque ya cerró.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <button onClick={downloadPdf}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border border-border text-ink hover:bg-muted transition-all shadow-sm">
              <FilePdf size={18} weight="duotone" /> Descargar PDF
            </button>
            <button onClick={() => nav('/')} className="btn btn-ghost text-sm">Volver al inicio</button>
          </div>
        </div>
      </div>
    )
  }

  if (done) return (
      <div className="min-h-dvh flex items-center justify-center bg-muted px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-success/10 border border-success/30 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <span className="text-3xl text-success font-bold">✓</span>
          </div>
          <h2 className="font-display text-xl font-bold text-ink mb-2 tracking-tight">¡Completaste la encuesta!</h2>
          <p className="text-muted-text text-sm">Gracias por tu participación.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <button onClick={downloadPdf}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border border-border text-ink hover:bg-muted transition-all shadow-sm">
              <FilePdf size={18} weight="duotone" /> Descargar PDF
            </button>
            <button onClick={() => nav('/')} className="btn btn-ghost text-sm">Volver al inicio</button>
          </div>
        </div>
      </div>
  )

  const questions = [...survey.questions].sort((a, b) => a.order - b.order)

  const selectedAltIds = new Set<number>()
  for (const a of Object.values(answers)) {
    if (a.alternativeId != null) selectedAltIds.add(a.alternativeId)
    if (a.alternativeIds) a.alternativeIds.forEach(x => selectedAltIds.add(x))
  }

  const visibleQuestions = questions.filter(q => {
    if (!q.parentAlternativeId) return true
    return selectedAltIds.has(q.parentAlternativeId)
  })

  type G = { section: typeof questions[0]; children: typeof questions[0][]; isRepeatable: boolean }
  const groups: (G | typeof questions[0])[] = []
  for (let i = 0; i < visibleQuestions.length; i++) {
    const q = visibleQuestions[i]
    if (q.type === 'Section') {
      const children: typeof questions[0][] = []
      let j = i + 1
      while (j < visibleQuestions.length && visibleQuestions[j].type !== 'Section' && visibleQuestions[j].type !== 'InfoText') {
        children.push(visibleQuestions[j])
        j++
      }
      groups.push({ section: q, children, isRepeatable: q.isRepeatable })
      i = j - 1
    } else {
      groups.push(q)
    }
  }

  const repeatableGroups: Record<number, { children: typeof questions }> = {}
  for (const g of groups) {
    if ('section' in g && g.isRepeatable) repeatableGroups[g.section.id] = { children: g.children }
  }

  const renderList: { key: string; question: typeof questions[0]; groupInstance?: number }[] = []
  for (const g of groups) {
    if ('section' in g) {
      if (g.isRepeatable) {
        const instanceCount = groupInstances[g.section.id] ?? 1
        for (let inst = 0; inst < instanceCount; inst++) {
          for (const child of g.children) {
            renderList.push({ key: `${child.id}-${inst}`, question: child, groupInstance: inst })
          }
        }
      } else {
        for (const child of g.children) {
          renderList.push({ key: String(child.id), question: child })
        }
      }
    } else {
      renderList.push({ key: String(g.id), question: g })
    }
  }

  const addInstance = (qId: number) => {
    setGroupInstances(p => ({ ...p, [qId]: (p[qId] ?? 1) + 1 }))
  }

  const removeLastInstance = (qId: number) => {
    const current = groupInstances[qId] ?? 1
    if (current <= 1) return
    const removed = current - 1
    setGroupInstances(p => ({ ...p, [qId]: current - 1 }))
    setAnswers(p => {
      const next = { ...p }
      const children = repeatableGroups[qId]?.children ?? []
      for (const child of children) {
        delete next[`${child.id}-${removed}`]
      }
      return next
    })
  }

  const setVal = (key: string, groupInstance?: number) => (v: Partial<SubmitAnswer>) =>
    setAnswers(p => ({ ...p, [key]: { ...p[key], questionId: Number(key.split('-')[0]), groupInstance, ...v } }))

  const flattenMulti = (items: SubmitAnswer[]): SubmitAnswer[] => {
    const out: SubmitAnswer[] = []
    for (const a of items) {
      if (a.alternativeIds && a.alternativeIds.length > 0) {
        for (const altId of a.alternativeIds) {
          out.push({ questionId: a.questionId, alternativeId: altId, groupInstance: a.groupInstance })
        }
      } else {
        out.push(a)
      }
    }
    return out
  }

  const allRequiredOk = renderList.every(item => {
    if (item.question.type === 'Section' || item.question.type === 'InfoText') return true
    if (!item.question.isRequired) return true
    const a = answers[item.key]
    if (!a) return false
    if (item.question.type === 'MultipleChoice')
      return (a.alternativeIds?.length ?? 0) > 0
    return a.alternativeId != null || (a.textValue?.trim() ?? '') !== '' || a.fileId != null
  })

  return (
    <div className="min-h-dvh bg-muted py-6 sm:py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
            {survey.title}
          </h1>
          {survey.description && (
            <p className="text-muted-text text-sm mt-2 max-w-md mx-auto leading-relaxed">{survey.description}</p>
          )}
        </div>

        <div className="space-y-5">
          {groups.map((item, idx) => {
            if ('section' in item) {
              const children = item.children
              if (item.isRepeatable) {
                const instanceCount = groupInstances[item.section.id] ?? 1
                return (
                  <div key={`rs-${item.section.id}`} className="card p-5 animate-fade-up border-t-2 border-t-accent/60">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-[11px] font-semibold text-accent dark:text-accent uppercase tracking-widest">Sección repetible</span>
                        <h3 className="font-display text-base font-bold text-ink mt-0.5">{item.section.title}</h3>
                      </div>
                      <div className="flex gap-2">
                        {instanceCount > 1 && (
                          <button onClick={() => removeLastInstance(item.section.id)}
                            className="btn-ghost text-error hover:bg-red-50 dark:hover:bg-red-900/30 !min-h-[36px] !px-2.5 !py-1.5 !text-xs flex items-center gap-1.5 rounded-lg border border-border hover:border-red-200 dark:hover:border-red-700">
                            <Trash size={14} /> Quitar
                          </button>
                        )}
                        <button onClick={() => addInstance(item.section.id)}
                          className="btn-ghost text-primary hover:bg-primary-light !min-h-[36px] !px-2.5 !py-1.5 !text-xs flex items-center gap-1.5 rounded-lg border border-border hover:border-primary/40">
                          <Plus size={14} /> Agregar otro
                        </button>
                      </div>
                    </div>
                    {Array.from({ length: instanceCount }, (_, idx) => (
                      <div key={idx} className="bg-muted/60 dark:bg-muted/40 rounded-xl p-4 space-y-4 mb-3 last:mb-0">
                        <p className="text-[11px] font-semibold text-muted-text uppercase tracking-wider">
                          #{idx + 1}
                        </p>
                        {children.map(child => (
                          <div key={`${child.id}-${idx}`} className="card p-4 border-l-[3px] !rounded-xl"
                            style={{ borderLeftColor: child.isRequired ? 'var(--color-primary)' : 'var(--color-border)' }}>
                            <QuestionRenderer
                              question={child}
                              value={answers[`${child.id}-${idx}`] || { questionId: child.id }}
                              onChange={setVal(`${child.id}-${idx}`, idx)}
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )
              }
              return (
                <div key={`s-${item.section.id}`} className="card p-5 animate-fade-up border-l-[3px] border-l-primary bg-muted/40 dark:bg-muted/30"
                  style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}>
                  <div className="mb-4">
                    <span className="text-[11px] font-semibold text-primary uppercase tracking-widest">Sección</span>
                    <h3 className="font-display text-base font-bold text-ink mt-0.5">{item.section.title}</h3>
                    {item.section.description && (
                      <p className="text-sm text-muted-text mt-1.5 leading-relaxed">{item.section.description}</p>
                    )}
                  </div>
                  <div className="space-y-4">
                    {children.map(child => (
                      <div key={child.id} className="card p-4 border-l-[3px] !rounded-xl"
                        style={{ borderLeftColor: child.isRequired ? 'var(--color-primary)' : 'var(--color-border)' }}>
                        <QuestionRenderer
                          question={child}
                          value={answers[child.id] || { questionId: child.id }}
                          onChange={setVal(String(child.id))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
            const q = item
            const isInfo = q.type === 'InfoText'
            const accent = isInfo ? 'border-l-accent/60' : 'border-l-border'
            const softBg = isInfo ? 'bg-muted/40 dark:bg-muted/30' : ''
            return (
              <div key={q.id} className={`card p-4 sm:p-5 border-l-[3px] ${accent} animate-fade-up ${softBg}`}
                style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}>
                {isInfo ? (
                  <div>
                    {q.title && <h4 className="font-display text-sm font-bold text-ink mb-1">{q.title}</h4>}
                    {q.description && <p className="text-sm text-muted-text leading-relaxed">{q.description}</p>}
                  </div>
                ) : (
                  <QuestionRenderer
                    question={q}
                    value={answers[q.id] || { questionId: q.id }}
                    onChange={setVal(String(q.id))}
                  />
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
          <button onClick={() => nav('/')} className="btn btn-ghost text-sm">
            Cancelar
          </button>
          <button onClick={() => mutation.mutate({ surveyId: survey.id, answers: flattenMulti(Object.values(answers)) })}
            disabled={mutation.isPending || !allRequiredOk}
            className="btn btn-primary text-sm">
            {mutation.isPending ? 'Enviando…' : isEditing ? 'Actualizar respuestas' : 'Enviar respuestas'}
          </button>
        </div>
      </div>
    </div>
  )
}
