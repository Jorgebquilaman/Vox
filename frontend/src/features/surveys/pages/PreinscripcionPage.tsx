import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../../shared/lib/api'
import type { Preinscripcion, DocumentoDigital, DocumentoIdentidad, PropuestaElegida } from '../../../shared/types'

const NACIONALIDADES = ['Argentino', 'Extranjero', 'Naturalizado']
const TIPOS_AR = ['CUIL/CUIT', 'DNI']
const TIPOS_EX = ['Cédula', 'Pasaporte']
const IDENTIDADES = ['Femenino', 'Masculino', 'No binario', 'Otra', 'Prefiere no decir']
const REQUISITOS = ['DNI frontal', 'DNI dorso', 'Título secundario', 'Foto carnet', 'Certificado de estudios']

function tipoDocumentoOptions(nac: string) {
  if (nac === 'Argentino' || nac === 'Naturalizado') return TIPOS_AR
  if (nac === 'Extranjero') return TIPOS_EX
  return [...TIPOS_AR, ...TIPOS_EX]
}

const SECCIONES = [
  { key: 'datos', label: '1. Datos censales' },
  { key: 'censales', label: '2. Nacimiento y domicilio' },
  { key: 'propuestas', label: '3. Propuesta formativa' },
]

function emptyForm(): Preinscripcion {
  return {
    estado: 'Borrador', email: '', apellido: '', nombre: '', nacionalidad: 'Argentino',
    paisEmisorDocumento: 'Argentina', tipoDocumento: 'DNI', numeroDocumento: '',
    apellidoNombreLegal: '', apellidoNombreElegido: '', identidadGenero: '', emailContacto: '', telefono: '',
    fechaNacimiento: null, fechaPresentacion: null,
    propuestas: [{ unidadAcademica: '', propuestaFormativa: '', orden: 1 }],
    documentosDigitales: REQUISITOS.map(r => ({ requisito: r })),
    documentosIdentidad: [{ tipo: '', numero: '' }]
  }
}

// Convierte strings vacíos a null para los campos de fecha (el backend no acepta "").
function toPayload(f: Preinscripcion): Preinscripcion {
  return {
    ...f,
    fechaNacimiento: f.fechaNacimiento ? f.fechaNacimiento : null,
    fechaPresentacion: f.fechaPresentacion ? f.fechaPresentacion : null
  }
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-text flex items-center gap-1">
        {label}
        {required && <span className="text-error text-sm leading-none">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  )
}
const inputCls = "input"

export default function PreinscripcionPage() {
  const [form, setForm] = useState<Preinscripcion>(emptyForm())
  const [active, setActive] = useState('cuenta')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [finalizado, setFinalizado] = useState(false)
  const loadedRef = useRef(false)

  const { data, isLoading } = useQuery({
    queryKey: ['preinscripcion'],
    queryFn: () => api.get<Preinscripcion>('/preinscripciones/mine').then((r: any) => r.data),
  })

  useEffect(() => {
    if (data && !loadedRef.current) {
      loadedRef.current = true
      const base = emptyForm()
      setForm({
        ...base,
        ...data,
        documentosDigitales: data.documentosDigitales?.length ? data.documentosDigitales : base.documentosDigitales,
        propuestas: data.propuestas?.length ? data.propuestas : base.propuestas,
        documentosIdentidad: data.documentosIdentidad?.length ? data.documentosIdentidad : base.documentosIdentidad
      })
      setFinalizado(data.estado === 'Finalizado' || data.estado === 'Presentado')
    }
  }, [data])

  const update = (patch: Partial<Preinscripcion>) => setForm((p: Preinscripcion) => ({ ...p, ...patch }))

  const saveMutation = useMutation({
    mutationFn: (f: Preinscripcion) => api.post<Preinscripcion>('/preinscripciones/draft', toPayload(f)).then((r: any) => r.data),
    onSuccess: () => { setSavedAt(new Date()) },
    onError: () => toast.error('No se pudo guardar el borrador')
  })

  // Autoguardado con debounce al cambiar de sección o editar
  const didMount = useRef(true)
  useEffect(() => {
    if (didMount.current) { didMount.current = false; return }
    if (finalizado) return
    setSaving(true)
    const t = setTimeout(() => {
      saveMutation.mutate(form, { onSettled: () => setSaving(false) })
    }, 1200)
    return () => clearTimeout(t)
  }, [form])

  const finalizeMutation = useMutation({
    mutationFn: (f: Preinscripcion) => api.post<Preinscripcion>('/preinscripciones/finalize', toPayload(f)).then((r: any) => r.data),
    onSuccess: (d: Preinscripcion) => { setFinalizado(true); setForm(d); toast.success('Preinscripción finalizada. Podés imprimir el comprobante.') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'No se pudo finalizar')
  })

  const onFile = async (reqIndex: number, file: File) => {
    const fd = new FormData(); fd.append('file', file)
    const res = await api.post('/files/upload', fd) as any
    setForm((p: Preinscripcion) => {
      const docs = [...p.documentosDigitales]
      docs[reqIndex] = { ...docs[reqIndex], fileId: res.data.fileId, fileName: res.data.fileName, contentType: res.data.contentType }
      return { ...p, documentosDigitales: docs }
    })
  }

  if (isLoading) return <div className="text-center py-20 text-muted-text">Cargando…</div>

  const requeridosOk = !!form.email && !!form.apellido && !!form.nombre && !!form.tipoDocumento &&
    !!form.numeroDocumento && !!form.apellidoNombreLegal && !!form.emailContacto &&
    form.propuestas.length > 0 && form.documentosIdentidad.length > 0

  const missing: string[] = []
  if (!form.email) missing.push('Email')
  if (!form.apellido) missing.push('Apellido')
  if (!form.nombre) missing.push('Nombre')
  if (!form.tipoDocumento) missing.push('Tipo de documento')
  if (!form.numeroDocumento) missing.push('Número de documento')
  if (!form.apellidoNombreLegal) missing.push('Apellido y nombre legal')
  if (!form.emailContacto) missing.push('Email de contacto')
  if (form.propuestas.length === 0) missing.push('Al menos una propuesta')
  if (form.documentosIdentidad.length === 0) missing.push('Al menos un documento de identidad')

  return (
    <div className="max-w-3xl mx-auto">
      {/* ── Hero ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">Datos censales</h1>
          <div className="h-px w-12 bg-gradient-to-r from-primary to-transparent mt-2" />
        </div>
        <span className="text-xs text-muted-text font-medium">
          {saving ? 'Guardando…' : savedAt ? `Guardado ${savedAt.toLocaleTimeString()}` : ''}
        </span>
      </div>

      {finalizado && (
        <div className="mb-5 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl text-sm text-green-700 dark:text-green-300 flex items-center justify-between">
          <span>Preinscripción finalizada. Estado: <b>{form.estado}</b></span>
          <button onClick={() => toast.promise(api.get('/preinscripciones/export').then((r: any) => r.data), { loading: 'Exportando…', success: (data: any) => { downloadJson(data); return 'Exportado'; }, error: 'Error' })}
            className="text-primary hover:underline font-medium">Exportar a Guaraní</button>
        </div>
      )}

      <div className="flex flex-wrap gap-1 mb-6 bg-muted/70 dark:bg-muted/40 rounded-xl p-1">
        {SECCIONES.map(s => (
          <button key={s.key} onClick={() => setActive(s.key)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${active === s.key ? 'bg-surface dark:bg-surface shadow-card text-ink font-semibold' : 'text-muted-text hover:text-ink'}`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
        {active === 'datos' && (
          <>
            <Field label="Email" required><input className={inputCls} type="email" value={form.email} onChange={e => update({ email: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Apellido" required><input className={inputCls} value={form.apellido} onChange={e => update({ apellido: e.target.value })} /></Field>
              <Field label="Nombre" required><input className={inputCls} value={form.nombre} onChange={e => update({ nombre: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nacionalidad" required>
                <select className={inputCls} value={form.nacionalidad} onChange={e => { const n = e.target.value; update({ nacionalidad: n, tipoDocumento: tipoDocumentoOptions(n)[0] }) }}>
                  {NACIONALIDADES.map(n => <option key={n}>{n}</option>)}
                </select>
              </Field>
              <Field label="País emisor del documento"><input className={inputCls} value={form.paisEmisorDocumento} onChange={e => update({ paisEmisorDocumento: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo de documento" required>
                <select className={inputCls} value={form.tipoDocumento} onChange={e => update({ tipoDocumento: e.target.value })}>
                  {tipoDocumentoOptions(form.nacionalidad).map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Número de documento" required><input className={inputCls} value={form.numeroDocumento} onChange={e => update({ numeroDocumento: e.target.value })} /></Field>
            </div>
            <Field label="Apellido y nombre legal" required><input className={inputCls} value={form.apellidoNombreLegal} onChange={e => update({ apellidoNombreLegal: e.target.value })} /></Field>
            <Field label="Apellido y nombre elegido (identidad de género)"><input className={inputCls} value={form.apellidoNombreElegido || ''} onChange={e => update({ apellidoNombreElegido: e.target.value })} /></Field>
            <Field label="Identidad de género">
              <select className={inputCls} value={form.identidadGenero || ''} onChange={e => update({ identidadGenero: e.target.value })}>
                <option value="">—</option>{IDENTIDADES.map(i => <option key={i}>{i}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email de contacto" required><input className={inputCls} type="email" value={form.emailContacto} onChange={e => update({ emailContacto: e.target.value })} /></Field>
              <Field label="Teléfono"><input className={inputCls} value={form.telefono || ''} onChange={e => update({ telefono: e.target.value })} /></Field>
            </div>

            <div className="pt-2">
              <p className="text-xs font-semibold text-ink mb-2">Documentos de identificación (puede haber más de uno)</p>
              {form.documentosIdentidad.map((d: DocumentoIdentidad, i: number) => (
                <div key={i} className="flex gap-2 mb-2 items-end">
                  <input className={`${inputCls} w-1/3`} placeholder="Tipo" value={d.tipo} onChange={e => { const x = [...form.documentosIdentidad]; x[i] = { ...x[i], tipo: e.target.value }; update({ documentosIdentidad: x }) }} />
                  <input className={`${inputCls} w-1/3`} placeholder="Número" value={d.numero} onChange={e => { const x = [...form.documentosIdentidad]; x[i] = { ...x[i], numero: e.target.value }; update({ documentosIdentidad: x }) }} />
                  <input className={`${inputCls} w-1/4`} placeholder="País emisor" value={d.paisEmisor || ''} onChange={e => { const x = [...form.documentosIdentidad]; x[i] = { ...x[i], paisEmisor: e.target.value }; update({ documentosIdentidad: x }) }} />
                  <button onClick={() => update({ documentosIdentidad: form.documentosIdentidad.filter((_: DocumentoIdentidad, j: number) => j !== i) })} className="text-error text-xs">✕</button>
                </div>
              ))}
              <button onClick={() => update({ documentosIdentidad: [...form.documentosIdentidad, { tipo: '', numero: '' }] })}
                className="text-primary text-xs hover:underline">+ Agregar documento</button>
            </div>
          </>
        )}

        {active === 'censales' && (
            <details open className="space-y-4">
            <summary className="text-xs font-semibold text-ink cursor-pointer">Nacimiento y domicilio</summary>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Field label="Fecha de nacimiento"><input className={inputCls} type="date" value={form.fechaNacimiento || ''} onChange={e => update({ fechaNacimiento: e.target.value })} /></Field>
              <Field label="Lugar de nacimiento"><input className={inputCls} value={form.lugarNacimiento || ''} onChange={e => update({ lugarNacimiento: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Calle"><input className={inputCls} value={form.calle || ''} onChange={e => update({ calle: e.target.value })} /></Field>
              <Field label="Número"><input className={inputCls} value={form.numero || ''} onChange={e => update({ numero: e.target.value })} /></Field>
              <Field label="Piso"><input className={inputCls} value={form.piso || ''} onChange={e => update({ piso: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Departamento"><input className={inputCls} value={form.departamento || ''} onChange={e => update({ departamento: e.target.value })} /></Field>
              <Field label="Localidad"><input className={inputCls} value={form.localidad || ''} onChange={e => update({ localidad: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Provincia"><input className={inputCls} value={form.provincia || ''} onChange={e => update({ provincia: e.target.value })} /></Field>
              <Field label="País"><input className={inputCls} value={form.pais || ''} onChange={e => update({ pais: e.target.value })} /></Field>
              <Field label="Código postal"><input className={inputCls} value={form.codigoPostal || ''} onChange={e => update({ codigoPostal: e.target.value })} /></Field>
            </div>
            <Field label="Estudios previos / título secundario"><input className={inputCls} value={form.estudiosPrevios || ''} onChange={e => update({ estudiosPrevios: e.target.value })} /></Field>
            <Field label="Datos socioeconómicos y familiares"><textarea className={inputCls} rows={3} value={form.datosSocioeconomicos || ''} onChange={e => update({ datosSocioeconomicos: e.target.value })} /></Field>
          </details>
        )}

        {active === 'propuestas' && (
          <div className="space-y-3">
            {form.propuestas.map((p: PropuestaElegida, i: number) => (
              <div key={i} className="border border-border rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-text">Preferencia {i + 1}</span>
                  <button onClick={() => update({ propuestas: form.propuestas.filter((_: PropuestaElegida, j: number) => j !== i) })} className="text-error text-xs">✕</button>
                </div>
                <input className={inputCls} placeholder="Unidad académica" value={p.unidadAcademica} onChange={e => { const x = [...form.propuestas]; x[i] = { ...x[i], unidadAcademica: e.target.value, orden: i + 1 }; update({ propuestas: x }) }} />
                <input className={inputCls} placeholder="Propuesta formativa (carrera)" value={p.propuestaFormativa} onChange={e => { const x = [...form.propuestas]; x[i] = { ...x[i], propuestaFormativa: e.target.value }; update({ propuestas: x }) }} />
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputCls} placeholder="Sede" value={p.sede || ''} onChange={e => { const x = [...form.propuestas]; x[i] = { ...x[i], sede: e.target.value }; update({ propuestas: x }) }} />
                  <input className={inputCls} placeholder="Modalidad" value={p.modalidad || ''} onChange={e => { const x = [...form.propuestas]; x[i] = { ...x[i], modalidad: e.target.value }; update({ propuestas: x }) }} />
                </div>
              </div>
            ))}
            <button onClick={() => update({ propuestas: [...form.propuestas, { unidadAcademica: '', propuestaFormativa: '', orden: form.propuestas.length + 1 }] })}
              className="text-primary text-xs hover:underline">+ Agregar propuesta</button>
            <p className="text-xs text-muted-text">Podés elegir más de una (máx. según configuración de la institución).</p>
          </div>
        )}

        {active === 'documentos' && (
          <div className="space-y-3">
            {form.documentosDigitales.map((d: DocumentoDigital, i: number) => (
              <div key={i} className="border border-border rounded-xl p-3 flex items-center gap-3">
                <span className="text-sm text-ink flex-1">{d.requisito}</span>
                {d.fileId ? (
                  <span className="text-xs text-green-700 dark:text-green-300">Archivo: {d.fileName} <button onClick={() => { const x = [...form.documentosDigitales]; x[i] = { ...x[i], fileId: undefined, fileName: undefined, contentType: undefined }; update({ documentosDigitales: x }) }} className="text-error ml-1">✕</button></span>
                ) : (
                  <input type="file" accept="image/*,application/pdf" className="text-xs"
                    onChange={e => e.target.files?.[0] && onFile(i, e.target.files[0])} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {active === 'propuestas' && missing.length > 0 && (
        <p className="text-xs text-error mt-4">Faltan campos obligatorios: {missing.join(', ')}</p>
      )}

      <div className="flex justify-between mt-6 pt-5 border-t border-border">
        <button onClick={() => setActive(SECCIONES[Math.max(0, SECCIONES.findIndex(s => s.key === active) - 1)].key)}
          disabled={SECCIONES.findIndex(s => s.key === active) === 0}
          className="px-5 py-2 text-sm font-medium text-muted-text disabled:opacity-40 min-h-[44px] border border-border rounded-xl hover:bg-muted transition-all">← Anterior</button>
        {active !== 'propuestas' ? (
          <button onClick={() => setActive(SECCIONES[SECCIONES.findIndex(s => s.key === active) + 1].key)}
            className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all min-h-[44px]">Siguiente →</button>
        ) : (
          <button onClick={() => finalizeMutation.mutate(form)} disabled={!requeridosOk || finalizado}
            className="px-6 py-2 bg-success text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all min-h-[44px]">
            {finalizado ? 'Finalizada ✓' : 'Finalizar carga'}
          </button>
        )}
      </div>
    </div>
  )
}

function downloadJson(data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'preinscripcion-guarani.json'; a.click()
  URL.revokeObjectURL(url)
}
