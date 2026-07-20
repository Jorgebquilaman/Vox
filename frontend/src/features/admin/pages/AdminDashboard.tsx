import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import api from '../../../shared/lib/api'
import type { SurveySummary, SurveyResults, UserDto } from '../../../shared/types'
import { formatDate } from '../../../shared/lib/utils'
import Spinner from '../../../shared/components/Spinner'
import SectionHeading from '../../../shared/components/SectionHeading'

export default function AdminDashboard() {
  const nav = useNavigate()

  const { data: surveys, isLoading: sLoad } = useQuery({
    queryKey: ['admin-surveys'],
    queryFn: () => api.get<SurveySummary[]>('/surveys').then(r => r.data)
  })

  const { data: results } = useQuery({
    queryKey: ['admin-all-results'],
    queryFn: () => api.get<SurveyResults[]>('/surveys/results').then(r => r.data)
  })

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get<UserDto[]>('/users').then(r => r.data)
  })

  if (sLoad) return <Spinner className="py-20" />

  const totalSurveys = surveys?.length ?? 0
  const published = surveys?.filter(s => s.status === 'Published').length ?? 0
  const closed = surveys?.filter(s => s.status === 'Closed').length ?? 0
  const draft = surveys?.filter(s => s.status === 'Draft').length ?? 0
  const totalResponses = results?.reduce((s, r) => s + r.totalResponses, 0) ?? 0
  const totalUsers = users?.length ?? 0

  const upcoming = surveys
    ?.filter(s => s.status === 'Published')
    .sort((a, b) => new Date(a.validTo).getTime() - new Date(b.validTo).getTime())
    .slice(0, 5) ?? []

  const recent = surveys
    ?.filter(s => s.status === 'Published' || s.status === 'Closed')
    .sort((a, b) => new Date(b.validTo).getTime() - new Date(a.validTo).getTime())
    .slice(0, 5) ?? []

  return (
    <div className="space-y-6">
      <SectionHeading title="Panel de control" eyebrow="Administración" />

      {/* ── Stat cards with animated counters ── */}

      {/* ── Stat cards with animated counters ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard value={totalSurveys} label="Total encuestas" />
        <StatCard value={published} label="Publicadas" accent />
        <StatCard value={closed} label="Cerradas" />
        <StatCard value={totalUsers} label="Usuarios" />
      </div>

      {/* ── Middle row: total + donut ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardLabel>Respuestas totales</CardLabel>
          <div className="flex items-baseline gap-2 mt-1">
            <AnimatedNumber value={totalResponses}
              className="font-display text-3xl sm:text-4xl font-bold text-ink leading-none tabular-nums" />
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          </div>
          <p className="text-[11px] text-muted-text uppercase tracking-widest mt-2">en todas las encuestas</p>
        </Card>

        <Card>
          <CardLabel>Distribución por estado</CardLabel>
          <div className="flex items-center gap-5 mt-3">
            <DonutChart
              segments={[
                { value: published, color: 'var(--color-accent)', label: 'Publicadas' },
                { value: draft, color: 'var(--color-border)', label: 'Borrador' },
                { value: closed, color: 'var(--color-muted-text)', label: 'Cerradas' },
              ]}
              size={96}
            />
            <div className="space-y-2 flex-1">
              <DonutLegend color="var(--color-accent)" label="Publicadas" count={published} />
              <DonutLegend color="var(--color-border)" label="Borrador" count={draft} />
              <DonutLegend color="var(--color-muted-text)" label="Cerradas" count={closed} />
            </div>
          </div>
        </Card>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <CardLabel>Próximas a vencer</CardLabel>
            <button onClick={() => nav('/admin/surveys')}
              className="text-[11px] text-primary hover:text-primary/70 uppercase tracking-widest font-semibold flex items-center gap-1 transition-colors">
              Ver todas <ArrowRight size={12} weight="bold" />
            </button>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-text py-5 text-center leading-relaxed">
              Todavía no hay encuestas activas.<br />
              Publicá una desde el listado para que los estudiantes puedan responder.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {upcoming.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                  <span className="text-sm text-ink truncate min-w-0 flex-1 mr-3">{s.title}</span>
                  <span className="text-[11px] text-muted-text uppercase tracking-widest shrink-0 tabular-nums">
                    {formatDate(s.validTo)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardLabel>Actividad reciente</CardLabel>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-text py-5 text-center leading-relaxed">
              La actividad aparecerá acá a medida<br />
              que los estudiantes respondan las encuestas.
            </p>
          ) : (
            <div className="divide-y divide-border mt-3">
              {recent.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                  <span className="text-sm text-ink truncate min-w-0 flex-1 mr-3">{s.title}</span>
                  <span className={`text-[11px] uppercase tracking-widest font-semibold shrink-0 ${
                    s.status === 'Published' ? 'text-accent' : 'text-muted-text'
                  }`}>
                    {s.status === 'Published' ? 'Publicada' : 'Cerrada'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

/* ── Animated counter ── */

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0)
  const done = useRef(false)

  useEffect(() => {
    if (value === 0) { setDisplay(0); return }
    done.current = false
    const startTime = performance.now()
    const duration = 700
    const raf = requestAnimationFrame(function tick(now) {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.floor(eased * value))
      if (t < 1) requestAnimationFrame(tick)
      else done.current = true
    })
    return () => cancelAnimationFrame(raf)
  }, [value])

  return <span className={className}>{display}</span>
}

/* ── Animated donut chart (SVG) ── */

function DonutChart({ segments, size = 96 }: {
  segments: { value: number; color: string; label: string }[]
  size?: number
}) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 200)
    return () => clearTimeout(t)
  }, [])

  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return <div className="rounded-full bg-muted" style={{ width: size, height: size }} />

  const stroke = 14
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const cx = size / 2
  const cy = size / 2

  let offset = 0
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      {segments.map((seg, i) => {
        const len = (seg.value / total) * circ
        const dash = ready ? len : 0
        const gap = circ - dash
        const segOffset = -offset
        offset += len
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={segOffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        )
      })}
      <circle cx={cx} cy={cy} r={r - stroke * 0.7} fill="var(--color-surface)" />
    </svg>
  )
}

/* ── Donut legend row ── */

function DonutLegend({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-xs text-muted-text uppercase tracking-wider flex-1">{label}</span>
      <span className="text-xs font-semibold text-ink tabular-nums">{count}</span>
    </div>
  )
}

/* ── Generic card wrappers ── */

/* ── Stat card with counter ── */

function StatCard({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm">
      <AnimatedNumber value={value}
        className={`font-display text-2xl sm:text-3xl font-bold leading-none tabular-nums ${accent ? 'text-accent' : 'text-ink'}`} />
      <p className="text-[11px] text-muted-text uppercase tracking-widest mt-1.5">{label}</p>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-5">{children}</div>
  )
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] text-muted-text uppercase tracking-widest font-semibold">{children}</p>
  )
}
