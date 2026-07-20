import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Sparkle } from '@phosphor-icons/react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../../shared/lib/api'
import type { Survey, CreateQuestion, CreateAlternative, SubmitAnswer, QuestionType, SimpleFieldType } from '../../../shared/types'
import Spinner from '../../../shared/components/Spinner'
import QuestionRenderer from '../../../shared/components/QuestionRenderer'
import GenerateWithAIModal from './GenerateWithAIModal'

const Q_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'Section', label: 'Sección' },
  { value: 'InfoText', label: 'Texto informativo' },
  { value: 'SingleChoice', label: 'Opción única' },
  { value: 'MultipleChoice', label: 'Opción múltiple' },
  { value: 'Dropdown', label: 'Desplegable' },
  { value: 'StarRating', label: 'Valoración (estrellas)' },
  { value: 'Thumbs', label: 'Pulgar arriba/abajo' },
  { value: 'FreeText', label: 'Texto libre' },
  { value: 'SimpleField', label: 'Campo simple' },
  { value: 'FileUpload', label: 'Subir archivo' },
]
const F_TYPES: SimpleFieldType[] = ['Text', 'Number', 'Email', 'Phone', 'DNI', 'Date']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-muted-text uppercase tracking-widest font-semibold mb-1.5">{label}</span>
      {children}
    </label>
  )
}

export default function SurveyBuilderPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const isEdit = Boolean(id)

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => api.get<Survey>(`/surveys/${id}`).then(r => r.data),
    enabled: isEdit
  })

  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [audience, setAudience] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [questions, setQuestions] = useState<CreateQuestion[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewAnswers, setPreviewAnswers] = useState<Record<number, SubmitAnswer>>({})
  const [conditionalsOpen, setConditionalsOpen] = useState<Record<number, boolean>>({})
  const [fabOpen, setFabOpen] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [originalPdfBase64, setOriginalPdfBase64] = useState<string | undefined>()
  const fabRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!fabOpen) return
    const close = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) setFabOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [fabOpen])

  useEffect(() => {
    if (existing) {
      setTitle(existing.title)
      setDesc(existing.description)
      setFrom(existing.validFrom.slice(0, 16))
      setTo(existing.validTo.slice(0, 16))
      setAudience(existing.targetAudience || '')
      setIsAnonymous(existing.isAnonymous)
      setQuestions(existing.questions.map(q => ({
        type: q.type, title: q.title, description: q.description, order: q.order,
        isRequired: q.isRequired, isVisibleInReports: q.isVisibleInReports, isRepeatable: q.isRepeatable,
        fieldType: q.fieldType, placeholder: q.placeholder,
        alternatives: q.alternatives?.map(a => ({ text: a.text, score: a.score, order: a.order })),
        parentQuestionOrder: q.parentQuestionOrder,
        parentAlternativeOrder: q.parentAlternativeOrder
      })))
    }
  }, [existing])

  const saveMutation = useMutation({
    mutationFn: (data: any) => isEdit ? api.put(`/surveys/${id}`, data) : api.post('/surveys', data),
    onSuccess: () => { toast.success(isEdit ? 'Encuesta actualizada' : 'Encuesta creada'); nav('/admin/surveys') },
    onError: (e: any) => toast.error(e.response?.data?.message || e.response?.data?.error || 'Error al guardar')
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const orderMap = new Map(questions.map((q, i) => [q.order, i + 1]))
    saveMutation.mutate({
      title, description: desc,
      validFrom: new Date(from).toISOString(),
      validTo: new Date(to).toISOString(),
      targetAudience: audience || undefined,
      isAnonymous,
      ...(!isEdit && originalPdfBase64 ? { originalPdfBase64 } : {}),
      questions: questions.map((q, i) => ({
        ...q,
        order: i + 1,
        parentQuestionOrder: q.parentQuestionOrder != null
          ? (orderMap.get(q.parentQuestionOrder) ?? q.parentQuestionOrder)
          : undefined
      }))
    })
  }

  const addQ = (type: QuestionType = 'FreeText', afterIndex?: number) => setQuestions(p => {
    const q = { type, title: '', order: p.length + 1, isRequired: false, isVisibleInReports: true, isRepeatable: false }
    if (afterIndex == null) return [...p, q]
    return [...p.slice(0, afterIndex + 1), q, ...p.slice(afterIndex + 1)].map((x, i) => ({ ...x, order: i + 1 }))
  })
  const updQ = (i: number, q: Partial<CreateQuestion>) => setQuestions(p => p.map((x, j) => j === i ? { ...x, ...q } : x))
  const delQ = (i: number) => {
    const deletedOrder = questions[i].order
    setQuestions(p => p.filter((_, j) => j !== i).map((q, j) => ({
      ...q,
      order: j + 1,
      parentQuestionOrder: q.parentQuestionOrder == null ? undefined
        : q.parentQuestionOrder === deletedOrder ? undefined
        : q.parentQuestionOrder > deletedOrder ? q.parentQuestionOrder - 1
        : q.parentQuestionOrder
    })))
  }
  const addA = (qi: number) => updQ(qi, { alternatives: [...(questions[qi].alternatives || []), { text: '', score: 0, order: (questions[qi].alternatives?.length || 0) + 1 }] })
  const updA = (qi: number, ai: number, a: Partial<CreateAlternative>) => updQ(qi, {
    alternatives: (questions[qi].alternatives || []).map((x, j) => j === ai ? { ...x, ...a } : x)
  })
  const delA = (qi: number, ai: number) => updQ(qi, {
    alternatives: (questions[qi].alternatives || []).filter((_, j) => j !== ai).map((a, j) => ({ ...a, order: j + 1 }))
  })
  const moveQ = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= questions.length) return
    const copy = [...questions]
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
    setQuestions(copy.map((q, k) => {
      let pQO = q.parentQuestionOrder
      if (pQO != null) {
        if (pQO === i + 1) pQO = j + 1
        else if (pQO === j + 1) pQO = i + 1
      }
      return { ...q, order: k + 1, parentQuestionOrder: pQO }
    }))
  }

  if (isEdit && loadingExisting) return <Spinner />

  return (<>
    <div className="max-w-3xl mx-auto pb-24">
      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            {isEdit ? 'Editar encuesta' : 'Nueva encuesta'}
          </h1>
          <div className="flex items-center gap-3 mt-2.5" aria-hidden>
            <span className="h-px flex-1 max-w-[120px] bg-border" />
            <span className="h-px flex-1 max-w-[120px] bg-border" />
          </div>
        </div>
        {!isEdit && (
          <button type="button" onClick={() => setAiModalOpen(true)}
            className="btn btn-outline text-sm shrink-0 whitespace-nowrap">
            <Sparkle size={16} weight="duotone" /> Generar con IA
          </button>
        )}
      </div>

      <form id="survey-form" onSubmit={submit} className="space-y-6">
        {/* ── Settings card ── */}
        <section className="bg-surface border border-border rounded-xl shadow-card p-5 space-y-4">
          <p className="text-[11px] text-muted-text uppercase tracking-widest font-semibold">Configuración</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Título">
              <input required value={title} onChange={e => setTitle(e.target.value)}
                className="input" placeholder="Nombre de la encuesta" />
            </Field>
            <Field label="Destinatarios">
              <input value={audience} onChange={e => setAudience(e.target.value)} placeholder="Ej: Todos"
                className="input" />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer select-none">
            <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)}
              className="accent-primary w-4 h-4" />
            Encuesta anónima — no se registrará quién responde
          </label>
          <Field label="Descripción">
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              className="input" placeholder="Descripción opcional de la encuesta" />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Desde">
              <input type="datetime-local" required value={from} onChange={e => setFrom(e.target.value)}
                className="input" />
            </Field>
            <Field label="Hasta">
              <input type="datetime-local" required value={to} onChange={e => setTo(e.target.value)}
                className="input" />
            </Field>
          </div>
        </section>

        {/* ── Questions ── */}
        <div className="space-y-4">
          <p className="text-[11px] text-muted-text uppercase tracking-widest font-semibold">Preguntas</p>

          {(() => {
            type G = { section: typeof questions[number]; si: number; children: { q: typeof questions[number]; ci: number }[] }
            const groups: G[] = []
            let cur: G | null = null
            for (let i = 0; i < questions.length; i++) {
              const q = questions[i]
              if (q.type === 'Section') {
                cur = { section: q, si: i, children: [] }
                groups.push(cur)
              } else if (cur) {
                cur.children.push({ q, ci: i })
              } else {
                groups.push({ section: null as any, si: -1, children: [{ q, ci: i }] })
              }
            }

            const renderQ = (q: typeof questions[number], qi: number, isNested: boolean) => (
              <div key={qi} className={`rounded-xl border p-4 space-y-3 ${q.type === 'InfoText' ? 'bg-accent-light/40 dark:bg-accent-light/20 border-accent/30' : 'bg-surface border-border'} ${isNested ? 'border-l-2 border-l-primary/30' : ''}`}>
                <div className="flex items-start gap-2">
                  <div className="flex flex-col gap-0.5 mt-1">
                    <button type="button" onClick={() => moveQ(qi, -1)} disabled={qi === 0}
                      className="text-muted-text hover:text-ink disabled:opacity-20 text-xs leading-none p-0.5">▲</button>
                    <span className="text-xs text-muted-text font-mono text-center">{qi + 1}</span>
                    <button type="button" onClick={() => moveQ(qi, 1)} disabled={qi === questions.length - 1}
                      className="text-muted-text hover:text-ink disabled:opacity-20 text-xs leading-none p-0.5">▼</button>
                  </div>
                  <div className="flex-1 space-y-2">
                    {q.type === 'InfoText' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-accent dark:text-accent uppercase tracking-wider">Texto informativo</span>
                        </div>
                        <input value={q.title} onChange={e => updQ(qi, { title: e.target.value })}
                          placeholder="Título del bloque (opcional)" className="font-semibold text-accent dark:text-accent w-full px-3 py-2 rounded-xl border border-accent/30 text-sm focus:ring-2 focus:ring-accent outline-none bg-surface/80" />
                        <textarea value={q.description || ''} onChange={e => updQ(qi, { description: e.target.value })}
                          placeholder="Escribí aquí las aclaraciones o instrucciones..." rows={3}
                          className="w-full px-3 py-2 rounded-xl border border-accent/30 text-sm focus:ring-2 focus:ring-accent outline-none bg-surface/80 text-muted-text" />
                      </>
                    ) : (
                      <>
                        <input value={q.title} onChange={e => updQ(qi, { title: e.target.value })} placeholder="Texto de la pregunta"
                          className="input" />
                        <div className="bg-accent-light/40 dark:bg-accent-light/20 border border-accent/30 rounded-lg">
                          <button type="button" onClick={() => setConditionalsOpen(p => ({ ...p, [qi]: !p[qi] }))}
                            className="flex items-center justify-between w-full p-2.5 text-xs font-medium text-accent dark:text-accent">
                            <span>Condicional (opcional)</span>
                            <span className="text-accent text-xs">{conditionalsOpen[qi] ? '▲' : '▼'}</span>
                          </button>
                          {conditionalsOpen[qi] && (
                            <div className="p-2.5 pt-0 space-y-1.5">
                              <p className="text-xs text-accent dark:text-accent leading-tight">Esta pregunta solo se mostrará al encuestado si se selecciona una respuesta específica de una pregunta anterior.</p>
                              <select
                                value={q.parentQuestionOrder != null ? `${q.parentQuestionOrder}-${q.parentAlternativeOrder}` : ''}
                                onChange={e => {
                                  if (!e.target.value) {
                                    updQ(qi, { parentQuestionOrder: undefined, parentAlternativeOrder: undefined })
                                  } else {
                                    const [pqo, pao] = e.target.value.split('-').map(Number)
                                    updQ(qi, { parentQuestionOrder: pqo, parentAlternativeOrder: pao })
                                  }
                                }}
                                className="w-full px-3 py-1.5 border border-accent/40 rounded-lg text-sm outline-none bg-surface"
                              >
                                <option value="">— Mostrar siempre (sin condición) —</option>
                                {questions.slice(0, qi).map((pq, pj) =>
                                  (pq.alternatives || []).map(pa => (
                                    <option key={`${pj}-${pa.order}`} value={`${pj + 1}-${pa.order}`}>
                                      Pregunta {pj + 1} › {pa.text || '(sin texto)'}
                                    </option>
                                  ))
                                )}
                              </select>
                              {qi === 0 && (
                                <p className="text-xs text-accent dark:text-accent italic">No hay preguntas anteriores. Agregá otra pregunta arriba de esta para poder condicionarla.</p>
                              )}
                              {qi > 0 && questions.slice(0, qi).every(pq => (pq.alternatives?.length ?? 0) === 0) && (
                                <p className="text-xs text-accent dark:text-accent italic">Ninguna pregunta anterior tiene alternativas. Agregale alternativas a una pregunta anterior para poder condicionar esta.</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <select value={q.type} onChange={e => {
                            const t = e.target.value as QuestionType
                            updQ(qi, { type: t, alternatives: t === 'SingleChoice' || t === 'MultipleChoice' || t === 'Dropdown' ? [] : undefined })
                          }} className="input !w-auto">
                            {Q_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          {q.type === 'SimpleField' && (
                            <select value={q.fieldType || 'Text'} onChange={e => updQ(qi, { fieldType: e.target.value as SimpleFieldType })}
                              className="input !w-auto">
                              {F_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          )}
                          {q.type === 'FreeText' && (
                            <input value={q.placeholder || ''} onChange={e => updQ(qi, { placeholder: e.target.value })} placeholder="Placeholder"
                              className="input !w-auto min-w-[120px] flex-1" />
                          )}
                          <label className="flex items-center gap-1.5 text-sm text-muted-text px-2 py-2 border border-border rounded-xl">
                            <input type="checkbox" checked={q.isRequired} onChange={e => updQ(qi, { isRequired: e.target.checked })} className="accent-primary" />
                            Oblig.
                          </label>
                          <label className="flex items-center gap-1.5 text-sm text-muted-text px-2 py-2 border border-border rounded-xl">
                            <input type="checkbox" checked={q.isVisibleInReports} onChange={e => updQ(qi, { isVisibleInReports: e.target.checked })} className="accent-primary" />
                            Visible
                          </label>
                          <button type="button" onClick={() => delQ(qi)}
                            className="px-2 py-2 text-sm text-error hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl min-h-[44px]">✕</button>
                        </div>

                        {(q.type === 'SingleChoice' || q.type === 'MultipleChoice' || q.type === 'Dropdown') && (
                          <div className="border-l-2 border-primary/20 pl-3 space-y-1.5">
                            {(q.alternatives || []).map((a, ai) => (
                              <div key={ai} className="flex items-center gap-1.5">
                                <input value={a.text} onChange={e => updA(qi, ai, { text: e.target.value })} placeholder="Texto"
                                  className="flex-1 px-2 py-1.5 border border-border rounded-lg text-sm !bg-transparent focus:ring-2 focus:ring-primary outline-none" />
                                <input value={a.score} onChange={e => updA(qi, ai, { score: Number(e.target.value) })} type="number" step="0.5" placeholder="Pts"
                                  className="w-16 px-2 py-1.5 border border-border rounded-lg text-sm !bg-transparent focus:ring-2 focus:ring-primary outline-none" />
                                <button type="button" onClick={() => delA(qi, ai)}
                                  className="text-error hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded-lg text-xs">✕</button>
                              </div>
                            ))}
                            <button type="button" onClick={() => addA(qi)}
                              className="text-xs text-primary hover:underline px-1 py-1 inline-block">+ Alternativa</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )

            return groups.flatMap(g => {
              if (g.section) {
                const lastChildIdx = g.children.length > 0 ? g.children[g.children.length - 1].ci : g.si
                return [(
                  <div key={`s-${g.si}`} className="rounded-xl border p-4 space-y-4 bg-primary-light/40 dark:bg-primary/10 border-primary/30">
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col gap-0.5 mt-1">
                        <button type="button" onClick={() => moveQ(g.si, -1)} disabled={g.si === 0}
                          className="text-muted-text hover:text-ink disabled:opacity-20 text-xs leading-none p-0.5">▲</button>
                        <span className="text-xs text-muted-text font-mono text-center">{g.si + 1}</span>
                        <button type="button" onClick={() => moveQ(g.si, 1)} disabled={g.si === questions.length - 1}
                          className="text-muted-text hover:text-ink disabled:opacity-20 text-xs leading-none p-0.5">▼</button>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Sección</span>
                          {g.section.title && <span className="text-primary/60 text-xs">—</span>}
                        </div>
                        <input value={g.section.title} onChange={e => updQ(g.si, { title: e.target.value })}
                          placeholder="Nombre de la sección" className="text-lg font-bold text-primary dark:text-primary w-full px-3 py-2 rounded-xl border border-primary/30 text-sm focus:ring-2 focus:ring-primary outline-none bg-surface/80" />
                        <textarea value={g.section.description || ''} onChange={e => updQ(g.si, { description: e.target.value })}
                          placeholder="Descripción de la sección (opcional)" rows={2}
                          className="w-full px-3 py-2 rounded-xl border border-primary/30 text-sm focus:ring-2 focus:ring-primary outline-none bg-surface/80 text-muted-text" />
                        <label className="flex items-center gap-1.5 text-xs text-primary dark:text-primary">
                          <input type="checkbox" checked={g.section.isRepeatable} onChange={e => updQ(g.si, { isRepeatable: e.target.checked })} className="accent-primary" />
                          Sección repetible — el usuario puede agregar varias instancias
                        </label>
                      </div>
                    </div>
                    <button type="button" onClick={() => addQ('FreeText', lastChildIdx)}
                      className="text-xs text-primary hover:text-primary dark:hover:text-primary font-medium flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-primary-light dark:hover:bg-primary/10 transition-all">
                      + Agregar pregunta a esta sección
                    </button>
                    {g.children.length > 0 && (
                      <div className="ml-2 space-y-3">
                        {g.children.map(({ q, ci }) => renderQ(q, ci, true))}
                      </div>
                    )}
                  </div>
                )]
              }
              return g.children.map(({ q, ci }) => renderQ(q, ci, false))
            })
          })()}
        </div>

      </form>
    </div>

    {/* Floating action button with popover */}
    <div ref={fabRef} className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-2">
      {fabOpen && (
        <div className="bg-surface rounded-xl shadow-xl border border-border overflow-hidden min-w-[180px]">
          <button type="button" onClick={() => { addQ('FreeText'); setFabOpen(false) }}
            className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-muted flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">?</span>
            Pregunta
          </button>
          <button type="button" onClick={() => { addQ('Section'); setFabOpen(false) }}
            className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-muted flex items-center gap-2 border-t border-border">
            <span className="w-6 h-6 rounded bg-primary-light dark:bg-primary/15 text-primary dark:text-primary flex items-center justify-center text-xs font-bold">≡</span>
            Sección
          </button>
          <button type="button" onClick={() => { addQ('InfoText'); setFabOpen(false) }}
            className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-muted flex items-center gap-2 border-t border-border">
            <span className="w-6 h-6 rounded bg-accent-light dark:bg-accent-light/30 text-accent dark:text-accent flex items-center justify-center text-xs font-bold">i</span>
            Texto informativo
          </button>
        </div>
      )}
      <button type="button" onClick={() => setFabOpen(p => !p)}
        className="w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:opacity-90 transition-all flex items-center justify-center text-2xl leading-none">
        {fabOpen ? '✕' : '+'}
      </button>
    </div>

    <div className="fixed bottom-0 left-60 right-0 z-30 px-4 sm:px-6 py-4 bg-surface/95 backdrop-blur border-t border-border flex justify-end gap-3">
      <button type="button" onClick={() => nav('/admin/surveys')}
        className="btn btn-outline text-sm">Cancelar</button>
      <button type="button" onClick={() => { setPreviewAnswers({}); setShowPreview(true) }}
        className="btn btn-outline text-sm !border-primary/40 !text-primary hover:!bg-primary-light">Vista previa</button>
      <button type="submit" form="survey-form"
        disabled={saveMutation.isPending}
        className="btn btn-primary text-sm">
        {saveMutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear encuesta'}
      </button>
    </div>

    {showPreview && (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 pb-8 overflow-y-auto bg-black/40" onClick={() => setShowPreview(false)}>
        <div className="w-full max-w-xl mx-4 bg-surface rounded-xl shadow-xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-base font-semibold text-ink">Vista previa — {title || 'Sin título'}</h2>
            <button onClick={() => setShowPreview(false)} className="text-muted-text hover:text-ink text-xl leading-none p-1">✕</button>
          </div>
          <div className="p-5 space-y-6">
            {(() => {
              const shown: number[] = []
              for (let i = 0; i < questions.length; i++) {
                const q = questions[i]
                if (q.parentQuestionOrder != null && q.parentAlternativeOrder != null) {
                  const pIdx = questions.findIndex(pq => pq.order === q.parentQuestionOrder)
                  if (pIdx !== -1 && shown.includes(pIdx)) {
                    const pAlt = questions[pIdx].alternatives?.find(a => a.order === q.parentAlternativeOrder)
                    if (pAlt != null) {
                      const pAltIdx = questions[pIdx].alternatives!.indexOf(pAlt)
                      if (previewAnswers[pIdx]?.alternativeId !== pAltIdx) continue
                    }
                  } else continue
                }
                shown.push(i)
              }
              if (shown.length === 0) return <p className="text-sm text-muted-text text-center py-8">No hay preguntas para mostrar.</p>
              return shown.map((qi, vi) => (
                <div key={qi}>
                  <p className="text-xs text-muted-text mb-1">Pregunta {vi + 1}</p>
                  <QuestionRenderer
                    question={{
                      id: qi,
                      type: questions[qi].type,
                      title: questions[qi].title,
                      description: questions[qi].description,
                      order: questions[qi].order,
                      isRequired: questions[qi].isRequired,
                      isVisibleInReports: questions[qi].isVisibleInReports,
                      isRepeatable: questions[qi].isRepeatable,
                      fieldType: questions[qi].fieldType,
                      placeholder: questions[qi].placeholder,
                      alternatives: questions[qi].alternatives?.map((a, ai) => ({
                        id: ai,
                        text: a.text,
                        score: a.score,
                        order: a.order
                      })),
                      parentAlternativeId: questions[qi].parentQuestionOrder != null ? 0 : undefined
                    }}
                    value={previewAnswers[qi] || { questionId: qi }}
                    onChange={v => setPreviewAnswers(p => ({ ...p, [qi]: { questionId: qi, ...v } }))}
                  />
                </div>
              ))
            })()}
          </div>
        </div>
      </div>
    )}
      {aiModalOpen && (
        <GenerateWithAIModal
          onClose={() => setAiModalOpen(false)}
          onGenerated={(s, usedAi, pdfBase64) => {
            setTitle(s.title)
            setDesc(s.description)
            setFrom(s.validFrom.slice(0, 16))
            setTo(s.validTo.slice(0, 16))
            setAudience(s.targetAudience || '')
            setIsAnonymous(s.isAnonymous)
            setOriginalPdfBase64(pdfBase64)
            setQuestions(s.questions.map((q, i) => ({
              ...q,
              order: i + 1,
              alternatives: q.alternatives?.map((a, ai) => ({ ...a, order: ai + 1 }))
            })))
            setAiModalOpen(false)
            window.scrollTo({ top: 0, behavior: 'smooth' })
            toast.success(
              usedAi
                ? 'Encuesta generada con IA. Revisala antes de guardar.'
                : 'Encuesta de ejemplo cargada (IA desactivada). Revisala antes de guardar.'
            )
          }}
        />
      )}
    </>
  )
}
