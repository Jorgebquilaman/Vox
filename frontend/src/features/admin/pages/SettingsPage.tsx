import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../../../shared/lib/api'
import type { EmailSettings, DeepSeekSettings } from '../../../shared/types'
import SectionHeading from '../../../shared/components/SectionHeading'

export default function SettingsPage() {
  const [email, setEmail] = useState<EmailSettings>({
    enabled: false, smtpHost: 'smtp.gmail.com', smtpPort: 587, useSsl: true,
    username: '', password: '', fromAddress: '', fromName: 'Vox IUPA'
  })
  const [emailLoaded, setEmailLoaded] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [testTo, setTestTo] = useState('')
  const [testLoading, setTestLoading] = useState(false)

  const [ai, setAi] = useState<DeepSeekSettings>({
    enabled: false, apiKey: '', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat', timeoutSeconds: 120
  })
  const [aiLoaded, setAiLoaded] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    api.get<EmailSettings>('/settings/email')
      .then(r => { setEmail(r.data); setEmailLoaded(true) })
      .catch(() => setEmailLoaded(true))
    api.get<DeepSeekSettings>('/settings/deepseek')
      .then(r => { setAi(r.data); setAiLoaded(true) })
      .catch(() => setAiLoaded(true))
  }, [])

  const handleAi = async (e: React.FormEvent) => {
    e.preventDefault()
    setAiLoading(true)
    try {
      await api.put('/settings/deepseek', ai)
      toast.success('Configuración de IA (DeepSeek) guardada.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar la configuración.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailLoading(true)
    try {
      await api.put('/settings/email', email)
      toast.success('Configuración de correo guardada.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar la configuración.')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleTest = async () => {
    if (!testTo) { toast.error('Ingresá un correo de destino.'); return }
    setTestLoading(true)
    try {
      await api.post('/settings/email/test', { to: testTo })
      toast.success(`Correo de prueba enviado a ${testTo}.`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo enviar el correo de prueba.')
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <SectionHeading title="Configuración" eyebrow="Administración" />

      {/* ── Correo electrónico ── */}
      <Card>
        <CardLabel>Correo electrónico (Gmail / SMTP)</CardLabel>
        <p className="text-sm text-muted-text mt-1 mb-4 leading-relaxed">
          Usado para enviar recuperación de contraseña y confirmación de encuestas completadas.
        </p>

        {!emailLoaded ? (
          <p className="text-sm text-muted-text">Cargando…</p>
        ) : (
          <form onSubmit={handleEmail} className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium text-ink cursor-pointer select-none">
              <input type="checkbox" checked={email.enabled} onChange={e => setEmail({ ...email, enabled: e.target.checked })}
                className="accent-primary w-4 h-4" />
              Habilitar envío de correo
            </label>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Servidor SMTP">
                <input value={email.smtpHost} onChange={e => setEmail({ ...email, smtpHost: e.target.value })} required
                  className="input" placeholder="smtp.gmail.com" />
              </Field>
              <Field label="Puerto">
                <input type="number" value={email.smtpPort} onChange={e => setEmail({ ...email, smtpPort: Number(e.target.value) })} required
                  className="input" />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-ink cursor-pointer select-none">
              <input type="checkbox" checked={email.useSsl} onChange={e => setEmail({ ...email, useSsl: e.target.checked })}
                className="accent-primary w-4 h-4" />
              Usar SSL/TLS (StartTLS)
            </label>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Usuario (email Gmail)">
                <input type="email" value={email.username} onChange={e => setEmail({ ...email, username: e.target.value })} required
                  placeholder="tucuenta@gmail.com" className="input" />
              </Field>
              <Field label="Contraseña de aplicación">
                <input type="password" value={email.password} onChange={e => setEmail({ ...email, password: e.target.value })}
                  placeholder="Dejar en blanco para conservar" className="input" />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Dirección remitente">
                <input type="email" value={email.fromAddress} onChange={e => setEmail({ ...email, fromAddress: e.target.value })} required
                  className="input" placeholder="noreply@iupa.edu.ar" />
              </Field>
              <Field label="Nombre remitente">
                <input value={email.fromName} onChange={e => setEmail({ ...email, fromName: e.target.value })} required
                  className="input" placeholder="Vox IUPA" />
              </Field>
            </div>

            <p className="text-xs text-muted-text leading-relaxed">
              Para Gmail usá una <strong>contraseña de aplicación</strong> (no tu clave normal). Activala en
              tu cuenta Google → Seguridad → Verificación en 2 pasos → Contraseñas de aplicación.
            </p>

            <div className="flex flex-wrap gap-3 pt-1 items-center">
              <button type="submit" disabled={emailLoading}
                className="btn btn-primary text-sm">
                {emailLoading ? 'Guardando…' : 'Guardar configuración'}
              </button>
              <div className="flex items-center gap-2 ml-auto">
                <input type="email" value={testTo} onChange={e => setTestTo(e.target.value)}
                  placeholder="Enviar prueba a…" className="input !w-auto !min-h-[44px]" />
                <button type="button" onClick={handleTest} disabled={testLoading}
                  className="btn btn-outline text-sm whitespace-nowrap">
                  {testLoading ? 'Enviando…' : 'Probar'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Card>

      {/* ── IA / DeepSeek ── */}
      <Card>
        <CardLabel>Inteligencia artificial (DeepSeek)</CardLabel>
        <p className="text-sm text-muted-text mt-1 mb-4 leading-relaxed">
          Permite generar encuestas a partir de un PDF del modelo. Obtené la API key en
          la consola de DeepSeek. La clave queda guardada en el servidor.
        </p>

        {!aiLoaded ? (
          <p className="text-sm text-muted-text">Cargando…</p>
        ) : (
          <form onSubmit={handleAi} className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium text-ink cursor-pointer select-none">
              <input type="checkbox" checked={ai.enabled} onChange={e => setAi({ ...ai, enabled: e.target.checked })}
                className="accent-primary w-4 h-4" />
              Habilitar generación con IA
            </label>

            <Field label="API Key">
              <input type="password" value={ai.apiKey} onChange={e => setAi({ ...ai, apiKey: e.target.value })}
                placeholder="Dejar en blanco para conservar la actual" className="input" />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Base URL">
                <input value={ai.baseUrl} onChange={e => setAi({ ...ai, baseUrl: e.target.value })} required
                  className="input" placeholder="https://api.deepseek.com" />
              </Field>
              <Field label="Modelo">
                <input value={ai.model} onChange={e => setAi({ ...ai, model: e.target.value })} required
                  className="input" placeholder="deepseek-chat" />
              </Field>
            </div>

            <Field label="Tiempo de espera (segundos)">
              <input type="number" value={ai.timeoutSeconds} onChange={e => setAi({ ...ai, timeoutSeconds: Number(e.target.value) })} required
                className="input" />
            </Field>

            <div className="flex flex-wrap gap-3 pt-1">
              <button type="submit" disabled={aiLoading}
                className="btn btn-primary text-sm">
                {aiLoading ? 'Guardando…' : 'Guardar configuración'}
              </button>
            </div>
          </form>
        )}
      </Card>

      {/* ── Cambiar contraseña ── */}
      <Card>
        <CardLabel>Cambiar contraseña</CardLabel>
        <p className="text-sm text-muted-text mt-1 mb-4 leading-relaxed">
          Para cambiar la contraseña de tu cuenta usá la página dedicada.
        </p>
        <a href="/admin/cambiar-contrasena"
          className="btn btn-outline text-sm inline-flex">
          Ir a cambiar contraseña
        </a>
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] text-muted-text uppercase tracking-widest font-semibold mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl shadow-card p-6">{children}</div>
  )
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] text-muted-text uppercase tracking-widest font-semibold">{children}</p>
  )
}
