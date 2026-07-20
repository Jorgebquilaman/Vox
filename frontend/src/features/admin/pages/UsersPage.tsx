import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Trash, User, FileText } from '@phosphor-icons/react'
import api from '../../../shared/lib/api'
import type { UserDto, UserRole, Preinscripcion } from '../../../shared/types'
import { formatDate } from '../../../shared/lib/utils'
import Spinner from '../../../shared/components/Spinner'
import SectionHeading from '../../../shared/components/SectionHeading'

export default function UsersPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('Student')

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get<UserDto[]>('/users').then(r => r.data)
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; email: string; password: string; role: string }) =>
      api.post('/users', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setShowForm(false)
      setName(''); setEmail(''); setPassword(''); setRole('Student')
      toast.success('Usuario creado')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || e.response?.data?.error || 'Error al crear')
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Usuario desactivado')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al desactivar')
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({ name, email, password, role })
  }

  const activeUsers = users?.filter(u => u.isActive) ?? []
  const inactiveUsers = users?.filter(u => !u.isActive) ?? []

  const [censalesUser, setCensalesUser] = useState<UserDto | null>(null)
  const { data: censales, isFetching: censalesLoading } = useQuery({
    queryKey: ['censales', censalesUser?.id],
    queryFn: () => api.get<Preinscripcion>(`/preinscripciones/admin/${censalesUser!.id}`).then(r => r.data),
    enabled: !!censalesUser
  })

  return (
    <div>
      <SectionHeading
        title="Usuarios"
        eyebrow="Administración"
        actions={
          <button onClick={() => setShowForm(!showForm)}
            className="btn btn-primary text-sm shrink-0">
            <Plus size={16} weight="bold" /> {showForm ? 'Cancelar' : 'Nuevo'}
          </button>
        }
      />

      {censalesUser && (
        <CensalesModal
          user={censalesUser}
          data={censales}
          loading={censalesLoading}
          onClose={() => setCensalesUser(null)}
        />
      )}

      {showForm && (
        <form onSubmit={submit}
          className="bg-surface border border-border rounded-2xl shadow-card p-6 mb-6 space-y-4 transition-all">
          <h2 className="font-display text-base font-bold text-ink">Nuevo usuario</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">Nombre</label>
              <input required value={name} onChange={e => setName(e.target.value)}
                className="input" placeholder="Nombre completo" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">Email</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="nombre@iupa.edu.ar" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">Contraseña</label>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input" placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">Rol</label>
              <select value={role} onChange={e => setRole(e.target.value as UserRole)}
                className="input">
                <option value="Student">Estudiante</option>
                <option value="Admin">Administrador</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={createMutation.isPending}
              className="btn btn-primary text-sm">
              {createMutation.isPending ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? <Spinner /> : !users || users.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-text">Todavía no hay usuarios registrados.</p>
          <button onClick={() => setShowForm(true)}
            className="mt-4 btn btn-primary text-sm">
            <Plus size={16} weight="bold" /> Crear primer usuario
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="text-[11px] text-muted-text uppercase tracking-widest font-semibold mb-2 px-1">
              Activos ({activeUsers.length})
            </h2>
            <div className="bg-surface rounded-xl border border-border divide-y divide-border overflow-hidden">
              {activeUsers.map(u => (
                <UserRow key={u.id} user={u} active
                  onViewCensales={() => setCensalesUser(u)}
                  onDeactivate={() => {
                    if (confirm(`¿Desactivar a ${u.name}?`)) deactivateMutation.mutate(u.id)
                  }} />
              ))}
            </div>
          </section>

          {inactiveUsers.length > 0 && (
            <section>
              <h2 className="text-[11px] text-muted-text uppercase tracking-widest font-semibold mb-2 px-1">
                Inactivos ({inactiveUsers.length})
              </h2>
              <div className="bg-surface rounded-xl border border-border divide-y divide-border overflow-hidden">
                {inactiveUsers.map(u => (
                  <UserRow key={u.id} user={u} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function UserRow({ user, onDeactivate, onViewCensales, active }: {
  user: UserDto; onDeactivate?: () => void; onViewCensales?: () => void; active?: boolean
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60 ${!active ? 'text-muted-text/60' : ''}`}>
      {/* Status dot */}
      <span className={`w-2 h-2 rounded-full shrink-0 ${active ? 'bg-accent' : 'border border-muted'}`} />

      <div className="flex-1 min-w-0 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
          <User size={16} className="text-primary" weight={active ? 'fill' : 'duotone'} />
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${active ? 'text-ink' : 'text-muted-text'}`}>
            {user.name}
            {!active && <span className="text-muted-text/50 ml-2 text-xs">(inactivo)</span>}
          </p>
          <p className="text-xs text-muted-text truncate">{user.email}</p>
        </div>
      </div>

      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider shrink-0 ${
        user.role === 'Admin'
          ? 'bg-primary-light text-primary'
          : 'bg-muted text-muted-text'
      }`}>
        {user.role === 'Admin' ? 'Admin' : 'Estudiante'}
      </span>

      <span className="text-xs text-muted-text shrink-0 hidden sm:block tabular-nums">{formatDate(user.createdAt)}</span>

      {onViewCensales && (
        <button onClick={onViewCensales}
          className="p-1.5 shrink-0 rounded-lg text-muted-text hover:text-primary hover:bg-primary-light transition-colors"
          title="Ver datos censales">
          <FileText size={16} />
        </button>
      )}
      {onDeactivate && user.isActive && (
        <button onClick={onDeactivate}
          className="p-1.5 shrink-0 rounded-lg text-muted-text hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Desactivar">
          <Trash size={16} />
        </button>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-text shrink-0">{label}</span>
      <span className="text-sm text-ink text-right truncate">{value}</span>
    </div>
  )
}

function CensalesModal({ user, data, loading, onClose }: {
  user: UserDto; data?: Preinscripcion; loading: boolean; onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-surface rounded-2xl w-full max-w-lg max-h-[85vh] overflow-auto shadow-dropdown" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface z-10">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-ink">Datos censales</h3>
            <p className="text-xs text-muted-text truncate">{user.name} · {user.email}</p>
          </div>
          <button onClick={onClose}
            className="text-muted-text hover:text-ink transition-colors p-1 shrink-0 rounded-lg hover:bg-muted"
            aria-label="Cerrar">✕</button>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="text-center text-muted-text py-8">Cargando…</div>
          ) : !data ? (
            <div className="text-center text-muted-text py-8 leading-relaxed">
              El usuario aún no completó<br />los datos censales.
            </div>
          ) : (
            <div className="space-y-5">
              <Section label="Cuenta">
                <Row label="Email" value={data.email} />
                <Row label="Apellido" value={data.apellido} />
                <Row label="Nombre" value={data.nombre} />
                <Row label="Nacionalidad" value={data.nacionalidad} />
                <Row label="País emisor doc." value={data.paisEmisorDocumento} />
                <Row label="Tipo doc." value={data.tipoDocumento} />
                <Row label="Nº documento" value={data.numeroDocumento} />
              </Section>
              <Section label="Datos del aspirante">
                <Row label="Apellido y nombre legal" value={data.apellidoNombreLegal} />
                <Row label="Nombre elegido" value={data.apellidoNombreElegido} />
                <Row label="Identidad de género" value={data.identidadGenero} />
                <Row label="Email contacto" value={data.emailContacto} />
                <Row label="Teléfono" value={data.telefono} />
                {data.documentosIdentidad?.map((d, i) => (
                  <Row key={i} label={`Doc. identidad ${i + 1}`} value={`${d.tipo} ${d.numero}${d.paisEmisor ? ` (${d.paisEmisor})` : ''}`} />
                ))}
              </Section>
              <Section label="Nacimiento y domicilio">
                <Row label="Fecha nacimiento" value={data.fechaNacimiento} />
                <Row label="Lugar nacimiento" value={data.lugarNacimiento} />
                <Row label="Domicilio" value={[data.calle, data.numero, data.piso, data.departamento].filter(Boolean).join(' ')} />
                <Row label="Localidad" value={data.localidad} />
                <Row label="Provincia" value={data.provincia} />
                <Row label="País" value={data.pais} />
                <Row label="Código postal" value={data.codigoPostal} />
                <Row label="Estudios previos" value={data.estudiosPrevios} />
                <Row label="Datos socioeconómicos" value={data.datosSocioeconomicos} />
              </Section>
              <Section label="Propuestas formativas">
                {data.propuestas?.length ? data.propuestas.map((p, i) => (
                  <Row key={i} label={`Preferencia ${i + 1}`} value={[p.unidadAcademica, p.propuestaFormativa, p.sede, p.modalidad].filter(Boolean).join(' · ')} />
                )) : <p className="text-xs text-muted-text">Sin propuestas.</p>}
              </Section>
              <p className="text-xs text-muted-text pt-1">Estado: <strong className="text-ink">{data.estado}</strong></p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-muted-text uppercase tracking-widest font-semibold mb-2">{label}</p>
      {children}
    </div>
  )
}
