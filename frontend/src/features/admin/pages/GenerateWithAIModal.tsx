import { useState, useRef, useEffect } from 'react'
import type { DragEvent } from 'react'
import toast from 'react-hot-toast'
import { FilePdf } from '@phosphor-icons/react'
import { generateSurveyFromPdf } from '../../../shared/lib/api'
import type { CreateSurvey } from '../../../shared/types'

const STATUS_STEPS = [
  'Subiendo PDF…',
  'Extrayendo texto…',
  'Analizando contenido…',
  'Generando encuesta…'
]

interface Props {
  onGenerated: (survey: CreateSurvey, usedAi: boolean, originalPdfBase64?: string) => void
  onClose: () => void
}

export default function GenerateWithAIModal({ onGenerated, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusIdx, setStatusIdx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading) { setStatusIdx(0); return }
    const interval = setInterval(() => {
      setStatusIdx(p => Math.min(p + 1, STATUS_STEPS.length - 1))
    }, 2500)
    return () => clearInterval(interval)
  }, [loading])

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f && f.type === 'application/pdf') setFile(f)
    else if (f) toast.error('Solo se admiten archivos PDF.')
  }

  const handle = async () => {
    if (!file) { toast.error('Seleccioná un PDF.'); return }
    setLoading(true)
    try {
      const res = await generateSurveyFromPdf(file)

      const reader = new FileReader()
      const base64 = await new Promise<string | undefined>((resolve) => {
        reader.onload = () => resolve((reader.result as string)?.split(',')[1])
        reader.onerror = () => resolve(undefined)
        reader.readAsDataURL(file)
      })

      onGenerated(res.survey, res.usedAi, base64)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'No se pudo generar la encuesta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-surface rounded-xl shadow-2xl border border-border overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display text-lg font-bold text-ink">Generar encuesta con IA</h2>
          <button onClick={onClose} className="text-muted-text hover:text-ink text-xl leading-none p-1" disabled={loading}>✕</button>
        </div>

        <div className="p-5 space-y-4">
          {loading ? (
            <div className="rounded-xl border border-border bg-muted/30 p-6 text-center relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-border">
                <div className="h-full w-full bg-gradient-to-r from-accent via-accent/60 to-accent rounded-full
                  animate-[scan-progress_2.5s_ease-in-out_infinite]" />
              </div>

              <div className="relative mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-accent/10 animate-ping" />
                <div className="absolute inset-1 rounded-full bg-accent/20 animate-pulse" />
                <FilePdf size={32} weight="duotone" className="relative text-accent z-10" />
                <div className="absolute inset-0 overflow-hidden rounded-full">
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent
                    absolute top-1/2 -translate-y-1/2 animate-[scan-beam_2s_linear_infinite]" />
                </div>
              </div>

              <p className="text-sm font-medium text-ink mb-1 truncate">{file?.name}</p>
              <p className="text-xs text-muted-text animate-pulse">{STATUS_STEPS[statusIdx]}</p>

              <div className="mt-5 flex items-center justify-center gap-1.5">
                {[0, 1, 2, 3].map(i => (
                  <div key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      i <= statusIdx ? 'bg-accent scale-110' : 'bg-border'
                    }`} />
                ))}
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-text leading-relaxed">
                Subí el PDF con el modelo de la encuesta que querés crear. La IA leerá el documento y
                armará las preguntas, tipos y opciones. Después podés revisar y editar todo antes de guardar.
              </p>

              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                  dragging ? 'border-accent bg-accent-light/40' : 'border-border hover:bg-muted/60'
                }`}
              >
                <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
                  onChange={e => setFile(e.target.files?.[0] ?? null)} />
                <FilePdf size={32} weight="duotone" className="mx-auto text-accent mb-2" />
                {file ? (
                  <p className="text-sm font-medium text-ink">{file.name}</p>
                ) : (
                  <p className="text-sm text-muted-text">Arrastrá un PDF aquí o hacé clic para seleccionar</p>
                )}
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button onClick={onClose} disabled={loading}
              className="btn btn-outline text-sm disabled:opacity-40">Cancelar</button>
            <button onClick={handle} disabled={loading || !file}
              className="btn btn-primary text-sm min-w-[140px]">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-white/70 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="inline-block w-2 h-2 bg-white/70 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="inline-block w-2 h-2 bg-white/70 rounded-full animate-bounce [animation-delay:300ms]" />
                  Procesando
                </span>
              ) : 'Generar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
