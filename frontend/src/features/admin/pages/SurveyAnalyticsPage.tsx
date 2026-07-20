import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid, ResponsiveContainer } from 'recharts'
import { Download, Funnel } from '@phosphor-icons/react'
import api from '../../../shared/lib/api'
import type { SurveyResults, Survey, Question } from '../../../shared/types'
import { useAuth } from '../../../shared/hooks/useAuth'
import Spinner from '../../../shared/components/Spinner'
import EmptyState from '../../../shared/components/EmptyState'
import SectionHeading from '../../../shared/components/SectionHeading'

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#4f46e5', '#ca8a04']
const COLORS_ALT = ['#1d4ed8', '#6d28d9', '#047857', '#b45309', '#b91c1c', '#0e7490', '#4338ca', '#a16207']

interface DistItem { alternativeId: number; label: string; count: number; percentage: number; score: number | null }

type DemoField = 'genero' | 'edad' | 'propuesta' | 'unidadAcademica' | 'localidad' | 'estudiosPrevios' | 'provincia' | 'pais'

interface DemoDim {
  field: DemoField
  label: string
  bucket?: 'age'
}

// Orden de interés para el reporte censal.
const DEMO_DIMS: DemoDim[] = [
  { field: 'genero', label: 'Sexo / identidad de género' },
  { field: 'edad', label: 'Edad', bucket: 'age' },
  { field: 'propuesta', label: 'Propuesta formativa' },
  { field: 'unidadAcademica', label: 'Unidad académica' },
  { field: 'localidad', label: 'Localidad' },
  { field: 'estudiosPrevios', label: 'Estudios previos' },
  { field: 'provincia', label: 'Provincia' },
  { field: 'pais', label: 'País' }
]

function bucketAge(v?: string): string {
  if (!v) return 'Sin dato'
  const n = parseInt(v, 10)
  if (isNaN(n)) return 'Sin dato'
  if (n <= 17) return '≤17'
  if (n <= 20) return '18–20'
  if (n <= 24) return '21–24'
  if (n <= 30) return '25–30'
  return '31+'
}

interface DemoReport {
  dim: DemoDim
  data: { name: string; value: number }[]
  total: number
}

interface Analytics {
  questions: Question[]
  distributions: Record<number, DistItem[]>
  rankings: SurveyResults['rankings']
  totalResponses: number
  avgScore: number
  npsScore: number | null
}

function computeAnalytics(rankings: SurveyResults['rankings'], survey: Survey): Analytics {
  const totalResponses = rankings.length
  const avgScore = totalResponses > 0 ? rankings.reduce((s, r) => s + r.totalScore, 0) / totalResponses : 0
  const distributions: Record<number, DistItem[]> = {}

  for (const q of survey.questions) {
    if (q.type !== 'SingleChoice' && q.type !== 'MultipleChoice') continue
    const answersForQ = rankings.flatMap(r => r.answers.filter(a => a.questionId === q.id))
    const total = answersForQ.length
    distributions[q.id] = (q.alternatives || []).map(alt => ({
      alternativeId: alt.id,
      label: alt.text,
      count: answersForQ.filter(a => a.selectedAlternativeId === alt.id).length,
      percentage: total > 0 ? Math.round(answersForQ.filter(a => a.selectedAlternativeId === alt.id).length / total * 100) : 0,
      score: alt.score
    }))
  }

  let npsScore: number | null = null
  const scaleQ = survey.questions.find(q => q.type === 'SingleChoice' && q.alternatives && q.alternatives.length === 11)
  if (scaleQ && totalResponses > 0) {
    let p = 0, d = 0
    for (const r of rankings) {
      const a = r.answers.find(x => x.questionId === scaleQ.id)
      if (!a) continue
      const alt = scaleQ.alternatives!.find(x => x.id === a.selectedAlternativeId)
      if (!alt) continue
      if (alt.score >= 9) p++
      else if (alt.score <= 6) d++
    }
    const total = p + d
    npsScore = total > 0 ? Math.round((p - d) / (p + d) * 100) : null
  }

  return { questions: survey.questions, distributions, rankings, totalResponses, avgScore, npsScore }
}

function KpiCard({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="bg-surface rounded-xl border border-border border-t-2 border-t-accent/50 p-4">
      <p className="text-[11px] uppercase tracking-widest text-muted-text font-semibold mb-1.5">{label}</p>
      <p className="font-display text-2xl font-bold text-ink leading-none">{value}{suffix && <span className="text-base font-normal text-muted-text ml-1">{suffix}</span>}</p>
    </div>
  )
}

export default function SurveyAnalyticsPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'

  const { data: survey } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => api.get<Survey>(`/surveys/${id}`).then(r => r.data),
    enabled: !!id
  })

  const { data: results, isLoading } = useQuery({
    queryKey: ['results', id],
    queryFn: () => api.get<SurveyResults>(`/surveys/${id}/results`).then(r => r.data),
    enabled: !!id
  })

  const [filters, setFilters] = useState<Record<number, number | null>>({})
  const [searchText, setSearchText] = useState('')
  const [openTab, setOpenTab] = useState<'charts' | 'texts' | 'report'>('charts')
  const [filterQuestion, setFilterQuestion] = useState<number | ''>('')
  const [filterValue, setFilterValue] = useState<number | ''>('')
  const [crossQ1, setCrossQ1] = useState<number | ''>('')
  const [crossQ2, setCrossQ2] = useState<number | ''>('')

  useEffect(() => { setFilters({}) }, [id])

  const analytics = useMemo(() => {
    if (!results || !survey) return null
    return computeAnalytics(results.rankings, survey)
  }, [results, survey])

  // Filtered rankings
  const filteredRankings = useMemo(() => {
    if (!analytics) return []
    const activeFilters = Object.entries(filters).filter(([, v]) => v != null) as [string, number][]
    if (activeFilters.length === 0) return analytics.rankings
    return analytics.rankings.filter(r =>
      activeFilters.every(([qId, altId]) =>
        r.answers.some(a => a.questionId === Number(qId) && a.selectedAlternativeId === altId)
      )
    )
  }, [analytics, filters])

  const filteredAnalytics = useMemo(() => {
    if (!analytics || !survey) return null
    return computeAnalytics(filteredRankings, { ...survey, questions: analytics.questions })
  }, [analytics, survey, filteredRankings])

  // Open text responses with search
  const openTexts = useMemo(() => {
    if (!results) return []
    const texts: { questionTitle: string; userName: string; text: string }[] = []
    for (const r of results.rankings) {
      for (const a of r.answers) {
        if (a.textValue && !a.selectedAlternative) {
          const q = analytics?.questions.find(x => x.id === a.questionId)
          texts.push({ questionTitle: q?.title || '', userName: r.userName, text: a.textValue })
        }
      }
    }
    return searchText ? texts.filter(t => t.text.toLowerCase().includes(searchText.toLowerCase()) || t.userName.toLowerCase().includes(searchText.toLowerCase())) : texts
  }, [results, analytics?.questions, searchText])

  // Cross-tabulation
  const crossData = useMemo(() => {
    if (crossQ1 === '' || crossQ2 === '' || !results) return null
    const q1 = analytics?.questions.find(q => q.id === Number(crossQ1))
    const q2 = analytics?.questions.find(q => q.id === Number(crossQ2))
    if (!q1?.alternatives || !q2?.alternatives) return null

    const matrix: Record<number, Record<number, number>> = {}
    for (const r of results.rankings) {
      const a1 = r.answers.find(x => x.questionId === q1.id)
      const a2 = r.answers.find(x => x.questionId === q2.id)
      if (!a1?.selectedAlternativeId || !a2?.selectedAlternativeId) continue
      if (!matrix[a1.selectedAlternativeId]) matrix[a1.selectedAlternativeId] = {}
      matrix[a1.selectedAlternativeId][a2.selectedAlternativeId] = (matrix[a1.selectedAlternativeId][a2.selectedAlternativeId] || 0) + 1
    }
    const max = Math.max(...Object.values(matrix).flatMap(r => Object.values(r)), 1)
    return { q1, q2, matrix, max }
  }, [crossQ1, crossQ2, results, analytics?.questions])

  // Demographic report (solo encuestas no anónimas)
  const demoReport = useMemo<DemoReport[] | null>(() => {
    if (!results || survey?.isAnonymous) return null
    const source = filteredRankings.length ? filteredRankings : results.rankings
    if (source.length === 0) return []

    return DEMO_DIMS.map(dim => {
      const counts = new Map<string, number>()
      let total = 0
      for (const r of source) {
        const raw = r.demographics?.[dim.field]
        const key = dim.bucket === 'age' ? bucketAge(raw) : (raw && raw.trim() ? raw.trim() : 'Sin dato')
        if (key === 'Sin dato' && !raw) {
          // cuenta como sin dato para el total de la dimensión
        } else if (key === 'Sin dato') {
          // valor explícitamente vacío
        }
        counts.set(key, (counts.get(key) || 0) + 1)
        total++
      }
      const order = dim.bucket === 'age'
        ? ['≤17', '18–20', '21–24', '25–30', '31+', 'Sin dato']
        : null
      const entries = [...counts.entries()]
        .sort((a, b) => {
          if (order) return order.indexOf(a[0]) - order.indexOf(b[0])
          return b[1] - a[1]
        })
      return {
        dim,
        total,
        data: entries.map(([name, value]) => ({ name, value }))
      }
    })
  }, [results, survey?.isAnonymous, filteredRankings])

  if (!isAdmin) return <EmptyState message="Solo administradores" icon="🔒" />
  if (isLoading) return <Spinner />
  if (!results || !survey || !analytics || !filteredAnalytics) return <EmptyState message="Sin datos" icon="📊" />

  const filterableQuestions = analytics.questions.filter(q =>
    q.type === 'SingleChoice' && !q.parentAlternativeId && (q.alternatives?.length ?? 0) > 0
  )

  const addFilter = () => {
    if (filterQuestion === '' || filterValue === '') return
    setFilters(p => ({ ...p, [filterQuestion]: Number(filterValue) }))
    setFilterQuestion('')
    setFilterValue('')
  }

  const removeFilter = (qId: number) => {
    setFilters(p => { const n = { ...p }; delete n[qId]; return n })
  }

  const chartQ = filteredAnalytics.questions.filter(q => q.type !== 'FileUpload')

  // PDF export with jsPDF
  const exportPdf = () => {
    toast.error('PDF export coming soon')
  }

  const title = `${survey.title} — Análisis`

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <SectionHeading
        title={title}
        eyebrow="Análisis de resultados"
        actions={
          <button onClick={exportPdf}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-xl hover:bg-muted transition-all min-h-[36px] text-muted-text">
            <Download size={15} /> Exportar PDF
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Respuestas" value={filteredAnalytics.totalResponses} />
        <KpiCard label="Puntaje promedio" value={Math.round(filteredAnalytics.avgScore * 100) / 100} suffix="/ 100" />
        {filteredAnalytics.npsScore != null && <KpiCard label="NPS" value={filteredAnalytics.npsScore} suffix="pts" />}
        <KpiCard label="Preguntas" value={filteredAnalytics.questions.length} />
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <Funnel size={16} /> Filtros
        </div>

        {Object.keys(filters).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([qId, altId]) => {
              const q = analytics.questions.find(x => x.id === Number(qId))
              const alt = q?.alternatives?.find(x => x.id === altId)
              return (
                <span key={qId} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-light text-primary text-xs rounded-full">
                  {q?.title}: {alt?.text}
                  <button onClick={() => removeFilter(Number(qId))} className="ml-0.5 hover:text-error">✕</button>
                </span>
              )
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-muted-text font-semibold mb-1">Pregunta</label>
            <select value={filterQuestion} onChange={e => setFilterQuestion(e.target.value === '' ? '' : Number(e.target.value))}
              className="input !w-auto">
              <option value="">—</option>
              {filterableQuestions.map(q => (
                <option key={q.id} value={q.id}>{q.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-muted-text font-semibold mb-1">Valor</label>
            <select value={filterValue} onChange={e => setFilterValue(e.target.value === '' ? '' : Number(e.target.value))}
              className="input !w-auto">
              <option value="">—</option>
              {filterQuestion !== '' && analytics.questions.find(q => q.id === filterQuestion)?.alternatives?.map(a => (
                <option key={a.id} value={a.id}>{a.text}</option>
              ))}
            </select>
          </div>
          <button onClick={addFilter} disabled={filterQuestion === '' || filterValue === ''}
            className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-40 min-h-[32px]">Aplicar</button>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-5">
        <div className="flex gap-2">
          <button onClick={() => setOpenTab('charts')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${openTab === 'charts' ? 'bg-primary text-white' : 'bg-muted text-muted-text hover:bg-muted/70'}`}>Gráficos</button>
          <button onClick={() => setOpenTab('texts')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${openTab === 'texts' ? 'bg-primary text-white' : 'bg-muted text-muted-text hover:bg-muted/70'}`}>Respuestas abiertas</button>
          {!survey.isAnonymous && (
            <button onClick={() => setOpenTab('report')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${openTab === 'report' ? 'bg-primary text-white' : 'bg-muted text-muted-text hover:bg-muted/70'}`}>Reporte de alumnos</button>
          )}
        </div>

        {openTab === 'charts' ? (
          <>
            {filterableQuestions.slice(0, 2).map(q => (
              <div key={q.id} className="bg-surface rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold text-ink mb-3">{q.title}</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={q.alternatives!.map(a => ({ name: a.text, value: filteredAnalytics.distributions[q.id]?.find((d: DistItem) => d.alternativeId === a.id)?.count || 0 }))}
                      dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {(q.alternatives || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, color: 'inherit' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ))}

            {/* Bar charts for each closed question */}
            {chartQ.filter(q => filteredAnalytics.distributions[q.id]).map(q => {
              const dist = filteredAnalytics.distributions[q.id]!
              return (
              <div key={q.id} className="bg-surface rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold text-ink mb-3">{q.title}</h3>
                <ResponsiveContainer width="100%" height={dist.length > 5 ? 300 : 220}>
                  <BarChart data={dist.map(d => ({ name: d.label, Respuestas: d.count, Porcentaje: d.percentage }))} margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} interval={0} angle={dist.length > 4 ? -20 : 0} textAnchor={dist.length > 4 ? 'end' : 'middle'} height={50} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, color: 'inherit' }} cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
                    <Bar dataKey="Respuestas" radius={[4, 4, 0, 0]}>
                      {dist.map((_, i) => <Cell key={i} fill={COLORS_ALT[i % COLORS_ALT.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )})}

            {/* Cross-tabulation heatmap */}
            <div className="bg-surface rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold text-ink mb-3">Cruce de variables</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <select value={crossQ1} onChange={e => setCrossQ1(e.target.value === '' ? '' : Number(e.target.value))}
                  className="input !w-auto">
                  <option value="">Variable 1</option>
                  {chartQ.filter(q => filteredAnalytics.distributions[q.id]).map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                </select>
                <select value={crossQ2} onChange={e => setCrossQ2(e.target.value === '' ? '' : Number(e.target.value))}
                  className="input !w-auto">
                  <option value="">Variable 2</option>
                  {chartQ.filter(q => filteredAnalytics.distributions[q.id]).map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                </select>
              </div>
              {crossData && (
                <div className="overflow-x-auto">
                  <table className="text-xs border-collapse w-full min-w-[400px]">
                    <thead>
                      <tr>
                        <th className="p-1.5 text-left text-muted-text font-medium border border-border bg-muted">{crossData.q1.title}</th>
                        {crossData.q2.alternatives!.map(a => (
                          <th key={a.id} className="p-1.5 text-center text-muted-text font-medium border border-border bg-muted">{a.text}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {crossData.q1.alternatives!.map(a1 => (
                        <tr key={a1.id}>
                          <td className="p-1.5 border border-border font-medium text-ink">{a1.text}</td>
                          {crossData.q2.alternatives!.map(a2 => {
                            const v = crossData.matrix[a1.id]?.[a2.id] || 0
                            const intensity = v / crossData.max
                            return (
                              <td key={a2.id} className="p-1.5 border border-border text-center font-semibold"
                                style={{ backgroundColor: `rgba(96, 165, 250, ${intensity * 0.35})`, color: intensity > 0.6 ? '#fff' : 'inherit' }}>
                                {v || '-'}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : openTab === 'texts' ? (
          <>
            {/* Open text table */}
            <div className="bg-surface rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-ink">Respuestas abiertas ({openTexts.length})</h3>
                <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Buscar…"
                  className="px-3 py-1.5 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary w-48" />
              </div>
              {openTexts.length === 0 ? (
                <p className="text-xs text-muted-text py-4 text-center">Sin respuestas abiertas.</p>
              ) : (
                <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                  {openTexts.map((t, i) => (
                    <div key={i} className="py-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-ink">{t.userName}</span>
                        <span className="text-xs text-muted-text">{t.questionTitle}</span>
                      </div>
                      <p className="text-sm text-ink/80">{t.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Reporte demográfico de alumnos */}
            <div className="bg-surface rounded-xl border border-border p-5">
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <h3 className="text-base font-semibold text-ink">Reporte censal de alumnos</h3>
                <span className="text-xs text-muted-text">{filteredRankings.length} alumno{filteredRankings.length !== 1 ? 's' : ''} en el reporte</span>
              </div>
              <div className="flex items-center gap-3 mb-5" aria-hidden>
                <span className="h-px flex-1 max-w-[60px] bg-border" />
                <span className="h-px flex-1 max-w-[60px] bg-border" />
              </div>

              {demoReport && demoReport.filter(r => r.data.length > 0).length === 0 ? (
                <p className="text-sm text-muted-text py-6 text-center">No hay datos demográficos registrados para esta encuesta.</p>
              ) : demoReport ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {demoReport.map(r => {
                    if (r.data.length === 0) return null
                    const hasSinDato = r.data.some(d => d.name === 'Sin dato')
                    return (
                      <div key={r.dim.field} className="rounded-xl border border-border p-4">
                        <div className="flex items-baseline justify-between mb-3">
                          <h4 className="text-sm font-semibold text-ink">{r.dim.label}</h4>
                          <span className="text-[11px] text-muted-text uppercase tracking-widest">{r.total} respuestas</span>
                        </div>
                        <ResponsiveContainer width="100%" height={Math.max(140, r.data.length * 34 + 20)}>
                          <BarChart data={r.data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                            <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
                            <Tooltip
                              cursor={{ fill: 'rgba(148,163,184,0.1)' }}
                              contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, color: 'inherit' }}
                              formatter={(v: number) => [`${v} alumno${v !== 1 ? 's' : ''}`, 'Cantidad']}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                              {r.data.map((_, i) => <Cell key={i} fill={COLORS_ALT[i % COLORS_ALT.length]} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        {hasSinDato && (
                          <p className="text-[11px] text-muted-text mt-2">"Sin dato" agrupa alumnos sin esa información en su preinscripción.</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-text py-6 text-center">Esta encuesta es anónima: no se muestran datos de alumnos.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
