import { useState } from 'react'
import { useAuth } from '../../../shared/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../../shared/lib/api'
import logoSvg from '/vox-icon.svg'

type Mode = 'login' | 'forgot' | 'reset'

export default function LoginPage() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState<Mode>('login')

  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [load, setLoad] = useState(false)

  // reset
  const [token, setToken] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setLoad(true)
    try {
      await login({ email, password: pass })
      nav('/')
    } catch { setErr('Email o contraseña incorrectos') }
    finally { setLoad(false) }
  }

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoad(true)
    try {
      await api.post('/auth/forgot-password', { email })
      toast.success('Si el correo está registrado, recibirás instrucciones.')
      setMode('login')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al solicitar recuperación.')
    } finally { setLoad(false) }
  }

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPass.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres.'); return }
    if (newPass !== confirmPass) { toast.error('Las contraseñas no coinciden.'); return }
    setLoad(true)
    try {
      await api.post('/auth/reset-password', { email, token, newPassword: newPass })
      toast.success('Contraseña restablecida. Iniciá sesión.')
      setMode('login')
      setNewPass(''); setConfirmPass(''); setToken('')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'No se pudo restablecer la contraseña.')
    } finally { setLoad(false) }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <img src={logoSvg} alt="" className="h-8 w-8 brightness-0 invert" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">VoxIUPA</h1>
          <div className="flex items-center justify-center gap-3 mt-2.5" aria-hidden>
            <span className="h-px w-[60px] bg-border" />
            <span className="h-px w-[60px] bg-border" />
          </div>
          <p className="text-[11px] text-muted-text uppercase tracking-widest font-semibold mt-3">Panel institucional</p>
        </div>

        {mode === 'login' && (
          <form onSubmit={submit} className="bg-surface border border-border border-t-2 border-t-accent/60 rounded-xl shadow-card p-6 space-y-5">
            {err && (
              <p className="text-sm text-center bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 rounded-xl p-3 font-medium text-error">
                {err}
              </p>
            )}
            <div>
              <label className="block text-[11px] text-muted-text uppercase tracking-widest font-semibold mb-1.5">Email institucional</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="email" placeholder="nombre@iupa.edu.ar" className="input" />
            </div>
            <div>
              <label className="block text-[11px] text-muted-text uppercase tracking-widest font-semibold mb-1.5">Contraseña</label>
              <input type="password" required value={pass} onChange={e => setPass(e.target.value)}
                autoComplete="current-password" placeholder="••••••••" className="input" />
            </div>
            <button type="submit" disabled={load} className="btn btn-primary w-full">
              {load ? 'Ingresando…' : 'Ingresar'}
            </button>
            <button type="button" onClick={() => { setErr(''); setMode('forgot') }}
              className="w-full text-center text-sm text-primary hover:underline pt-1">
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={submitForgot} className="bg-surface border border-border border-t-2 border-t-accent/60 rounded-xl shadow-card p-6 space-y-5">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink mb-1">Recuperar contraseña</h2>
              <p className="text-sm text-muted-text">Ingresá tu email y te enviaremos un enlace para restablecerla.</p>
            </div>
            <div>
              <label className="block text-[11px] text-muted-text uppercase tracking-widest font-semibold mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input" />
            </div>
            <button type="submit" disabled={load} className="btn btn-primary w-full">
              {load ? 'Enviando…' : 'Enviar instrucciones'}
            </button>
            <button type="button" onClick={() => setMode('login')}
              className="w-full text-center text-sm text-muted-text hover:text-ink pt-1">
              Volver al inicio de sesión
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={submitReset} className="bg-surface border border-border border-t-2 border-t-accent/60 rounded-xl shadow-card p-6 space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink mb-1">Restablecer contraseña</h2>
              <p className="text-sm text-muted-text">Completá los datos del enlace que recibiste por correo.</p>
            </div>
            <div>
              <label className="block text-[11px] text-muted-text uppercase tracking-widest font-semibold mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-[11px] text-muted-text uppercase tracking-widest font-semibold mb-1.5">Token</label>
              <input required value={token} onChange={e => setToken(e.target.value)} placeholder="Pegá el token del correo" className="input" />
            </div>
            <div>
              <label className="block text-[11px] text-muted-text uppercase tracking-widest font-semibold mb-1.5">Nueva contraseña</label>
              <input type="password" required value={newPass} onChange={e => setNewPass(e.target.value)} minLength={6} className="input" />
            </div>
            <div>
              <label className="block text-[11px] text-muted-text uppercase tracking-widest font-semibold mb-1.5">Confirmar contraseña</label>
              <input type="password" required value={confirmPass} onChange={e => setConfirmPass(e.target.value)} minLength={6} className="input" />
            </div>
            <button type="submit" disabled={load} className="btn btn-primary w-full">
              {load ? 'Restableciendo…' : 'Restablecer contraseña'}
            </button>
            <button type="button" onClick={() => setMode('login')}
              className="w-full text-center text-sm text-muted-text hover:text-ink pt-1">
              Volver al inicio de sesión
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
