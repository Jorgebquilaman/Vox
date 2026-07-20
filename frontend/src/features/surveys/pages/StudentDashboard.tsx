import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ClipboardText, CheckCircle } from '@phosphor-icons/react'
import api from '../../../shared/lib/api'
import type { SurveySummary } from '../../../shared/types'
import { formatDate, statusColor } from '../../../shared/lib/utils'
import Spinner from '../../../shared/components/Spinner'
import EmptyState from '../../../shared/components/EmptyState'
import SectionHeading from '../../../shared/components/SectionHeading'

function fetchAvailable(): Promise<SurveySummary[]> {
  return api.get('/surveys/available').then(r => r.data)
}
function fetchResponded(): Promise<SurveySummary[]> {
  return api.get('/surveys/responded').then(r => r.data)
}

export default function StudentDashboard() {
  const [tab, setTab] = useState<'pending' | 'done'>('pending')

  const { data: available, isLoading: aLoad } = useQuery({ queryKey: ['surveys-available'], queryFn: fetchAvailable })
  const { data: responded, isLoading: rLoad } = useQuery({ queryKey: ['surveys-responded'], queryFn: fetchResponded })

  const list = tab === 'pending' ? available : responded
  const loading = tab === 'pending' ? aLoad : rLoad

  return (
    <div>
      <SectionHeading
        title="Encuestas"
        eyebrow="Panel del estudiante"
        description="Completá las encuestas pendientes o revisá tus respuestas."
      />

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-muted/70 dark:bg-muted/40 rounded-xl p-1 my-6">
        <button onClick={() => setTab('pending')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all min-h-[44px] flex items-center justify-center gap-1.5 ${
            tab === 'pending'
              ? 'bg-surface dark:bg-surface shadow-card text-ink font-semibold'
              : 'text-muted-text hover:text-ink'
          }`}>
          <ClipboardText size={16} weight={tab === 'pending' ? 'fill' : 'duotone'} />
          Pendientes
          {available && available.length > 0 && (
            <span className="text-xs bg-primary text-white rounded-full px-1.5 py-0.5 font-bold tabular-nums">{available.length}</span>
          )}
        </button>
        <button onClick={() => setTab('done')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all min-h-[44px] flex items-center justify-center gap-1.5 ${
            tab === 'done'
              ? 'bg-surface dark:bg-surface shadow-card text-ink font-semibold'
              : 'text-muted-text hover:text-ink'
          }`}>
          <CheckCircle size={16} weight={tab === 'done' ? 'fill' : 'duotone'} />
          Respondidas
          {responded && responded.length > 0 && (
            <span className="text-xs bg-success/15 text-success rounded-full px-1.5 py-0.5 font-bold tabular-nums">{responded.length}</span>
          )}
        </button>
      </div>

      {/* ── Cards ── */}
      {loading ? <Spinner /> : !list || list.length === 0 ? (
        <EmptyState message={tab === 'pending' ? 'No tenés encuestas pendientes' : 'Aún no respondiste ninguna encuesta'} />
      ) : (
        <div className="space-y-3">
          {list.map((s, idx) => {
            const isOpen = s.status === 'Published' && new Date(s.validTo) >= new Date()
            const linkTo = tab === 'pending' ? `/survey/${s.id}` : isOpen ? `/survey/${s.id}` : `/results/${s.id}`
            return (
            <Link key={s.id}
              to={linkTo}
              className={`card p-4 sm:p-5 block animate-fade-up transition-all hover:-translate-y-0.5 hover:shadow-md ${
                tab === 'pending' ? 'border-l-[3px] border-l-primary' : isOpen ? 'border-l-[3px] border-l-accent/60' : ''
              }`}
              style={{ animationDelay: `${Math.min(idx * 30, 200)}ms` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-bold text-ink truncate">{s.title}</h3>
                  {s.description && (
                    <p className="text-sm text-muted-text mt-1 line-clamp-2 leading-relaxed">{s.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-xs text-muted-text">
                    <span className="font-medium">{s.questionCount} pregunta{s.questionCount !== 1 ? 's' : ''}</span>
                    <span className="opacity-40">·</span>
                    {tab === 'pending' && (
                      <>
                        <span>Vence el {formatDate(s.validTo)}</span>
                        <span className="opacity-40">·</span>
                      </>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold tracking-wide ${statusColor(s.status)}`}>
                      {s.status === 'Published' ? 'Disponible' : s.status === 'Closed' ? 'Cerrada' : 'Borrador'}
                    </span>
                  </div>
                  {tab === 'done' && isOpen && (
                    <p className="inline-flex items-center gap-1 text-xs text-accent dark:text-accent font-medium mt-2 bg-accent-light dark:bg-accent-light/30 px-2 py-0.5 rounded-full">
                      Podés modificar tu respuesta
                    </p>
                  )}
                </div>
              </div>
            </Link>
          )})}
        </div>
      )}
    </div>
  )
}
