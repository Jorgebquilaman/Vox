import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import api from '../../../shared/lib/api'

export default function ChangePasswordPage() {
  const nav = useNavigate()
  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)

  const mutation = useMutation({
    mutationFn: (d: { currentPassword: string; newPassword: string }) =>
      api.post('/auth/change-password', d),
    onSuccess: () => {
      toast.success('Contraseña actualizada correctamente')
      nav('/')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al cambiar contraseña')
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPass.length < 6) { toast.error('La nueva contraseña debe tener al menos 6 caracteres'); return }
    if (newPass !== confirm) { toast.error('Las contraseñas nuevas no coinciden'); return }
    mutation.mutate({ currentPassword: current, newPassword: newPass })
  }

  return (
    <div className="max-w-md">
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">Cambiar contraseña</h1>
        <div className="flex items-center gap-3 mt-2.5 mb-3" aria-hidden>
          <span className="h-px flex-1 max-w-[120px] bg-border" />
          <span className="h-px flex-1 max-w-[120px] bg-border" />
        </div>
        <p className="text-sm text-muted-text">Ingresá tu contraseña actual y una nueva.</p>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl shadow-card p-6 space-y-4">
        <div>
          <label className="block text-[11px] text-muted-text uppercase tracking-widest font-semibold mb-1.5">Contraseña actual</label>
          <div className="relative">
            <input type={show ? 'text' : 'password'} value={current}
              onChange={e => setCurrent(e.target.value)} required
              className="input pr-10" placeholder="••••••••" />
            <button type="button" onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-accent transition-colors">
              {show ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-muted-text uppercase tracking-widest font-semibold mb-1.5">Nueva contraseña</label>
          <input type={show ? 'text' : 'password'} value={newPass}
            onChange={e => setNewPass(e.target.value)} required minLength={6}
            className="input" placeholder="Mínimo 6 caracteres" />
        </div>

        <div>
          <label className="block text-[11px] text-muted-text uppercase tracking-widest font-semibold mb-1.5">Confirmar nueva contraseña</label>
          <input type={show ? 'text' : 'password'} value={confirm}
            onChange={e => setConfirm(e.target.value)} required minLength={6}
            className="input" placeholder="Repetí la nueva contraseña" />
        </div>

        <button type="submit" disabled={mutation.isPending}
          className="btn btn-primary w-full text-sm">
          {mutation.isPending ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  )
}
