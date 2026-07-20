import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Plus, PencilSimple, ChartBar, ChartPieSlice, Eye, Archive, Trash, MagnifyingGlass, Copy,
  CaretLeft, CaretRight, Sparkle
} from '@phosphor-icons/react'
import api from '../../../shared/lib/api'
import type { SurveySummary } from '../../../shared/types'
import { formatDate } from '../../../shared/lib/utils'
import Spinner from '../../../shared/components/Spinner'
import SectionHeading from '../../../shared/components/SectionHeading'

export default function SurveyListPage() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 5

  const { data: surveys, isLoading } = useQuery({
    queryKey: ['admin-surveys'],
    queryFn: () => api.get<SurveySummary[]>('/surveys').then(r => r.data)
  })

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/surveys/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-surveys'] }); toast.success('Eliminada') }
  })

  const pub = useMutation({
    mutationFn: (id: number) => api.post(`/surveys/${id}/publish`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-surveys'] }); toast.success('Publicada') }
  })

  const cls = useMutation({
    mutationFn: (id: number) => api.post(`/surveys/${id}/close`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-surveys'] }); toast.success('Cerrada') }
  })

  const cloneMut = useMutation({
    mutationFn: (id: number) => api.post(`/surveys/${id}/clone`).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin-surveys'] })
      toast.success('Encuesta clonada')
      nav(`/survey/${data.id}/edit`)
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al clonar')
  })

  const filtered = (surveys ?? [])
    .filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime())

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function statusBar(s: SurveySummary) {
    if (s.status === 'Draft') return 'border-muted'
    if (s.status === 'Published') return 'border-accent'
    return 'border-border'
  }

  return (
    <div>
      <SectionHeading
        title="Encuestas"
        eyebrow="Administración"
        actions={
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" weight="duotone" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Buscar encuesta…"
                className="input pl-9" />
            </div>
            <button onClick={() => nav('/survey/new')}
              className="btn btn-primary text-sm shrink-0">
              <Plus size={16} weight="bold" /> Nueva
            </button>
            <button onClick={() => nav('/survey/new?ai=1')}
              className="btn btn-outline text-sm shrink-0 whitespace-nowrap">
              <Sparkle size={16} weight="duotone" /> Generar con IA
            </button>
          </div>
        }
      />

      {isLoading ? <Spinner /> : filtered.length === 0 ? (
        search ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-text">No hay coincidencias para <strong>&ldquo;{search}&rdquo;</strong></p>
            <button onClick={() => setSearch('')} className="text-xs text-primary hover:underline mt-2 font-medium">
              Limpiar búsqueda
            </button>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-sm text-muted-text">Todavía no creaste ninguna encuesta.</p>
            <button onClick={() => nav('/survey/new')}
              className="mt-4 btn btn-primary text-sm">
              <Plus size={16} weight="bold" /> Crear primera encuesta
            </button>
          </div>
        )
      ) : (
        <div className="space-y-0 divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {paged.map((s, idx) => (
            <div key={s.id}
              className={`animate-fade-up flex items-start justify-between gap-4 px-5 py-4 transition-all hover:bg-muted/60 border-l-[3px] ${statusBar(s)}`}
              style={{ animationDelay: `${Math.min(idx * 30, 200)}ms` }}>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-bold text-ink truncate">{s.title}</h3>
                {s.description && (
                  <p className="text-sm text-muted-text mt-0.5 line-clamp-1 leading-relaxed">{s.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-text">
                  <span className="font-medium">{s.questionCount} pregunta{s.questionCount !== 1 ? 's' : ''}</span>
                  <span className="text-border">·</span>
                  <span className="tabular-nums">{formatDate(s.validFrom)} – {formatDate(s.validTo)}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 shrink-0">
                <ActionBtn onClick={() => nav(`/survey/${s.id}/edit`)}
                  disabled={s.status !== 'Draft'} icon={PencilSimple} label="Editar" />
                <ActionBtn onClick={() => nav(`/results/${s.id}`)} icon={ChartBar} label="Resultados" />
                <ActionBtn onClick={() => nav(`/survey/${s.id}/analytics`)} icon={ChartPieSlice} label="Análisis" />
                {s.status === 'Draft' && (
                  <ActionBtn onClick={() => pub.mutate(s.id)} icon={Eye} label="Publicar" highlight />
                )}
                {s.status === 'Published' && (
                  <ActionBtn onClick={() => cls.mutate(s.id)} icon={Archive} label="Cerrar" highlight />
                )}
                <ActionBtn onClick={() => cloneMut.mutate(s.id)} icon={Copy} label="Clonar" />
                <ActionBtn onClick={() => { if (confirm('¿Eliminar?')) del.mutate(s.id) }}
                  icon={Trash} label="Eliminar" danger />
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex items-center justify-between mt-5 text-sm">
          <span className="text-[11px] text-muted-text uppercase tracking-widest">
            {filtered.length} encuesta{filtered.length !== 1 && 's'} · página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-[11px] font-semibold text-muted-text uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-all">
              <CaretLeft size={13} weight="bold" /> Anterior
            </button>
            <span className="text-[11px] text-muted-text tabular-nums">{currentPage} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-[11px] font-semibold text-muted-text uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-all">
              Siguiente <CaretRight size={13} weight="bold" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionBtn({ onClick, disabled, icon: Icon, label, highlight, danger }: {
  onClick: () => void; disabled?: boolean; icon: any; label: string; highlight?: boolean; danger?: boolean
}) {
  const base = 'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all min-h-[32px]'
  if (disabled) {
    return (
      <button disabled
        className={`${base} border-border text-muted-text/40 cursor-not-allowed`}>
        <Icon size={13} weight="duotone" /> {label}
      </button>
    )
  }
  if (highlight) {
    return (
      <button onClick={onClick}
        className={`${base} border-accent/30 text-accent hover:bg-accent-light`}>
        <Icon size={13} weight="duotone" /> {label}
      </button>
    )
  }
  if (danger) {
    return (
      <button onClick={onClick}
        className={`${base} border-border text-muted-text hover:border-error/30 hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20`}>
        <Icon size={13} weight="duotone" /> {label}
      </button>
    )
  }
  return (
    <button onClick={onClick}
      className={`${base} border-border text-muted-text hover:bg-muted hover:text-ink`}>
      <Icon size={13} weight="duotone" /> {label}
    </button>
  )
}
