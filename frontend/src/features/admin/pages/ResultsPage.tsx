import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowClockwise, FileXls, FilePdf, Download, Eye, ClipboardText, EyeSlash } from '@phosphor-icons/react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import api from '../../../shared/lib/api'
import type { SurveyResults, ResponsePdfData } from '../../../shared/types'
import { useAuth } from '../../../shared/hooks/useAuth'
import Spinner from '../../../shared/components/Spinner'
import EmptyState from '../../../shared/components/EmptyState'
import generateResponsePdf from '../../../shared/lib/generateResponsePdf'

function FileLink({ fileId, fileName, contentType }: { fileId: string; fileName?: string; contentType?: string }) {
  const [showPreview, setShowPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const isImage = contentType?.startsWith('image/')
  const isPdf = contentType === 'application/pdf'
  const label = fileName || 'Archivo'

  const download = useCallback(async () => {
    const res = await api.get(`/files/${fileId}`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || 'archivo'
    a.click()
    URL.revokeObjectURL(url)
  }, [fileId, fileName])

  const openPreview = useCallback(async () => {
    if (!isImage && !isPdf) return
    const res = await api.get(`/files/${fileId}`, { responseType: 'blob' })
    setPreviewUrl(URL.createObjectURL(res.data))
    setShowPreview(true)
  }, [fileId, isImage, isPdf])

  return (
    <>
      <div className="flex items-center gap-1">
        <button onClick={download}
          className="text-primary hover:underline text-xs flex items-center gap-1">
          <Download size={12} /> {label}
        </button>
        {(isImage || isPdf) && (
          <button onClick={openPreview} className="text-muted-text hover:text-ink p-0.5"
            title="Vista previa"><Eye size={14} /></button>
        )}
      </div>
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setShowPreview(false); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }}>
          <div className="max-w-3xl max-h-[90vh] bg-surface rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="text-sm font-medium text-ink truncate">{label}</span>
              <button onClick={() => { setShowPreview(false); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }} className="text-muted-text hover:text-ink text-lg leading-none p-1">✕</button>
            </div>
            <div className="p-2 overflow-auto max-h-[80vh]">
              {previewUrl && isImage ? (
                <img src={previewUrl} alt={label} className="max-w-full h-auto rounded" />
              ) : previewUrl && isPdf ? (
                <iframe src={previewUrl} className="w-[800px] h-[600px] max-w-full" title={label} />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const DEMO_HEADERS = ['Edad', 'Género', 'Propuesta', 'Unidad académica', 'Localidad', 'Email', 'Teléfono']
const DEMO_FIELDS = ['edad', 'genero', 'propuesta', 'unidadAcademica', 'localidad', 'email', 'telefono'] as const

function buildMatrix(results: SurveyResults) {
  const questions = results.rankings[0]?.answers ?? []
  const headers = ['#', 'Nombre', 'Puntaje']
  if (!results.isAnonymous) headers.push(...DEMO_HEADERS)
  for (const q of questions) {
    headers.push(q.questionTitle, q.questionTitle + ' (Pts)')
  }
  const rows: string[][] = results.rankings.map((r, i) => {
    const row = [String(i + 1), r.userName, String(r.totalScore)]
    if (!results.isAnonymous) {
      for (const f of DEMO_FIELDS) row.push(r.demographics?.[f as keyof typeof r.demographics] ?? '-')
    }
    for (const a of r.answers) {
      row.push(a.selectedAlternative || a.textValue || a.fileName || '-')
      row.push(a.score != null ? String(a.score) : '-')
    }
    return row
  })
  return { headers, rows }
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  useEffect(() => { setPage(0) }, [id])

  const { data: results, isLoading } = useQuery({
    queryKey: ['results', id],
    queryFn: () => api.get<SurveyResults>(`/surveys/${id}/results`).then(r => r.data),
    enabled: !!id
  })

  const resetMutation = useMutation({
    mutationFn: (userId: number) => api.delete(`/surveys/${id}/responses/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results', id] })
      qc.invalidateQueries({ queryKey: ['admin-surveys'] })
      toast.success('Respuesta eliminada - el usuario puede volver a responder')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al resetear')
  })

  const toggleResultsMutation = useMutation({
    mutationFn: () => api.post(`/surveys/${id}/toggle-results`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results', id] })
      toast.success(results?.resultsPublished ? 'Resultados ocultados' : 'Resultados publicados')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })

  const downloadXlsx = useCallback(() => {
    if (!results) return
    const { headers, rows } = buildMatrix(results)
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    ws['!cols'] = headers.map(() => ({ wch: 22 }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados')
    XLSX.writeFile(wb, `resultados-${results.surveyTitle.replace(/\s+/g, '-')}.xlsx`)
    toast.success('Archivo XLSX descargado')
  }, [results])

  const downloadPdf = useCallback(() => {
    if (!results) return
    const { headers, rows } = buildMatrix(results)
    const doc = new jsPDF({ orientation: rows[0]?.length > 5 ? 'landscape' : 'portrait' })
    doc.text(results.surveyTitle, 14, 16)
    doc.setFontSize(10)
    doc.text(`Total de respuestas: ${results.totalResponses}`, 14, 23)
    autoTable(doc, {
      startY: 28,
      head: [headers],
      body: rows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [24, 95, 165] }
    })
    doc.save(`resultados-${results.surveyTitle.replace(/\s+/g, '-')}.pdf`)
    toast.success('Archivo PDF descargado')
  }, [results])

  if (isLoading) return <Spinner />
  if (!results) return <EmptyState message="Sin resultados" icon="📊" />

  const totalPages = Math.ceil(results.rankings.length / PAGE_SIZE)
  const pageRankings = results.rankings.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const maxScore = Math.max(1, ...results.rankings.map(r => r.totalScore))

  const topThree = results.rankings.slice(0, 3)
  const showPodium = results.rankings.length >= 3 && page === 0

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Hero ── */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-4" aria-hidden>
              <span className="h-px flex-1 max-w-[80px] bg-border" />
              <span className="h-px flex-1 max-w-[80px] bg-border" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink leading-tight tracking-tight">
              {results.surveyTitle}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-text flex-wrap mt-3">
              <span className="flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-bold text-primary leading-none">{results.totalResponses}</span>
                <span className="text-muted-text ml-0.5">
                  respuesta{results.totalResponses !== 1 ? 's' : ''}
                </span>
              </span>
              {!results.resultsPublished && !isAdmin && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-light dark:bg-accent-light/30 text-accent dark:text-accent text-xs font-medium">
                  <EyeSlash size={14} /> No publicados
                </span>
              )}
            </div>
          </div>
          {results.rankings.length > 0 && (
            <div className="flex gap-2 flex-wrap shrink-0">
              {isAdmin && (
                <button onClick={() => toggleResultsMutation.mutate()}
                  disabled={toggleResultsMutation.isPending}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border rounded-xl transition-all min-h-[36px] ${
                    results.resultsPublished
                      ? 'border-border text-muted-text hover:bg-muted'
                      : 'border-accent/50 text-accent hover:bg-accent-light dark:hover:bg-accent-light/30'
                  }`}>
                  {results.resultsPublished ? <Eye size={15} weight="duotone" /> : <EyeSlash size={15} weight="duotone" />}
                  {results.resultsPublished ? 'Ocultar' : 'Publicar'}
                </button>
              )}
              {!isAdmin && (
                <button onClick={async () => {
                  try {
                    const res = await api.get<ResponsePdfData>(`/surveys/${id}/my-response/pdf-data`)
                    await generateResponsePdf(res.data)
                    toast.success('PDF descargado')
                  } catch { toast.error('Error al generar PDF') }
                }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-primary/30 text-primary rounded-xl hover:bg-primary/5 transition-all min-h-[36px]">
                  <FilePdf size={15} weight="duotone" /> Mi PDF
                </button>
              )}
              {(isAdmin || results.resultsPublished) && (
                <>
                  <button onClick={downloadXlsx}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-border rounded-xl hover:bg-muted transition-all min-h-[36px] text-muted-text">
                    <FileXls size={15} weight="duotone" /> XLSX
                  </button>
                  <button onClick={downloadPdf}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-border rounded-xl hover:bg-muted transition-all min-h-[36px] text-muted-text">
                    <FilePdf size={15} weight="duotone" /> PDF
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {!isAdmin && !results.resultsPublished && results.rankings.length > 0 && (
        <div className="bg-accent-light dark:bg-accent-light/30 border border-accent/30 rounded-xl px-5 py-3.5 text-sm text-accent dark:text-accent flex items-center gap-2 mb-6">
          <EyeSlash size={16} weight="duotone" className="shrink-0" />
          Solo podés ver tus propias respuestas. Los resultados se publicarán cuando el administrador lo autorice.
        </div>
      )}

      {results.rankings.length === 0 ? (
        <div className="mt-8"><EmptyState message="Aún no hay respuestas" icon="📊" /></div>
      ) : (
        <>

          {/* ── Podium top 3 ── */}
          {showPodium && (
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 items-end">
              {[1, 0, 2].map(pos => {
                const r = topThree[pos]
                const rank = pos + 1
                const isFirst = rank === 1
                return (
                  <div key={r.userId}
                    className={`rounded-xl border text-center transition-all hover:-translate-y-0.5 ${
                      isFirst
                        ? 'bg-gradient-to-b from-accent-light to-surface dark:from-accent-light/30 dark:to-surface border-accent/30 shadow-md pt-6 pb-5 px-4'
                        : 'bg-surface border-border pt-4 pb-4 px-3 shadow-sm'
                    }`}>
                    <div className={`font-display font-bold leading-none mx-auto rounded-full flex items-center justify-center ${
                      isFirst
                        ? 'text-accent dark:text-accent text-3xl w-12 h-12 bg-accent-light dark:bg-accent-light/40 mb-2'
                        : 'text-muted-text text-xl w-9 h-9 bg-muted mb-1.5'
                    }`}>
                      {rank}
                    </div>
                    <p className={`font-display font-semibold truncate px-1 ${
                      isFirst ? 'text-lg text-ink' : 'text-sm text-muted-text'
                    }`}>
                      {r.userName}
                    </p>
                    <p className={`font-display font-bold mt-1 ${
                      isFirst ? 'text-2xl text-accent dark:text-accent' : 'text-lg text-primary'
                    }`}>
                      {r.totalScore}
                    </p>
                    <p className="text-[10px] text-muted-text uppercase tracking-wider mt-0.5">puntos</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Results table ── */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="text-left text-[11px] font-semibold text-muted-text uppercase tracking-wider">
                    <th className="px-4 py-3 w-12 text-center">#</th>
                    <th className="px-4 py-3">Participante</th>
                    {!results.isAnonymous && DEMO_HEADERS.map(h => (
                      <th key={h} className="px-3 py-3 max-w-[100px]">{h}</th>
                    ))}
                    {results.rankings[0].answers.map(a => (
                      <th key={a.questionId} className="px-3 py-3 max-w-[160px]">
                        <span className="block truncate" title={a.questionTitle}>{a.questionTitle}</span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center w-16">Puntaje</th>
                    {isAdmin && <th className="px-3 py-3 w-14 text-center">Acción</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageRankings.map((r, i) => {
                    const globalRank = page * PAGE_SIZE + i + 1
                    const rankColor = globalRank === 1
                      ? 'bg-accent-light dark:bg-accent-light/40 text-accent dark:text-accent'
                      : globalRank === 2
                      ? 'bg-muted text-muted-text'
                      : globalRank === 3
                      ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                      : 'bg-muted text-muted-text'
                    const isTop3 = globalRank <= 3

                    return (
                    <tr key={r.userId}
                      className={`transition-colors ${
                        isTop3
                          ? 'bg-accent-light/40 dark:bg-accent-light/10'
                          : 'hover:bg-muted/60'
                      } align-top`}>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold font-display ${rankColor}`}>
                          {globalRank}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-ink">{r.userName}</span>
                        <div className="mt-1.5 h-1.5 w-full max-w-[140px] rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isTop3 ? 'bg-accent' : 'bg-primary/40'}`}
                            style={{ width: `${(r.totalScore / maxScore) * 100}%` }}
                          />
                        </div>
                      </td>
                      {!results.isAnonymous && DEMO_FIELDS.map(f => (
                        <td key={f} className="px-3 py-3 text-muted-text text-xs whitespace-nowrap">
                          {r.demographics?.[f as keyof typeof r.demographics] ?? '—'}
                        </td>
                      ))}
                      {r.answers.map(a => (
                        <td key={a.questionId} className={`px-3 py-3 text-ink/80 text-xs leading-relaxed ${!a.isVisible && !isAdmin ? 'opacity-40' : ''}`}>
                          <div className="max-w-[160px] break-words">
                            {a.fileId ? (
                              <FileLink fileId={a.fileId} fileName={a.fileName} contentType={a.contentType} />
                            ) : (
                              a.selectedAlternative || a.textValue || '—'
                            )}
                          </div>
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-md text-sm font-bold font-display ${
                          isTop3 ? 'text-primary bg-primary-light' : 'text-muted-text bg-muted'
                        }`}>
                          {r.totalScore}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-0.5">
                            <Link to={`/surveys/${id}/responses/${r.userId}/form`}
                              title="Ver formulario"
                              className="p-1.5 text-muted-text hover:text-primary transition-colors rounded-lg hover:bg-primary-light/50 inline-flex"
                            >
                              <ClipboardText size={14} />
                            </Link>
                            <button
                              onClick={async () => {
                                try {
                                  const res = await api.get<ResponsePdfData>(`/surveys/${id}/responses/${r.userId}/pdf-data`)
                                  await generateResponsePdf(res.data)
                                  toast.success('PDF descargado')
                                } catch { toast.error('Error al generar PDF') }
                              }}
                              title="PDF"
                              className="p-1.5 text-muted-text hover:text-primary transition-colors rounded-lg hover:bg-primary-light/50 inline-flex"
                            >
                              <FilePdf size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Resetear la respuesta de ${r.userName}? Podrá volver a responder.`))
                                  resetMutation.mutate(r.userId)
                              }}
                              disabled={resetMutation.isPending}
                              title="Resetear"
                              className="p-1.5 text-muted-text hover:text-accent transition-colors rounded-lg hover:bg-accent-light dark:hover:bg-accent-light/20 inline-flex disabled:opacity-40"
                            >
                              <ArrowClockwise size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-border text-sm">
                <span className="text-muted-text text-xs">
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, results.rankings.length)} de {results.rankings.length}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    className="px-3 py-1.5 rounded-lg border border-border text-muted-text disabled:opacity-40 hover:bg-muted transition-all text-xs font-medium min-h-[36px]">← Anterior</button>
                  <span className="text-xs text-muted-text tabular-nums">{page + 1} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 rounded-lg border border-border text-muted-text disabled:opacity-40 hover:bg-muted transition-all text-xs font-medium min-h-[36px]">Siguiente →</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
