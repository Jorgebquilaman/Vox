import { useRef, useState } from 'react'
import type { Question } from '../types'
import api from '../lib/api'
import { Star, ThumbsUp, ThumbsDown } from '@phosphor-icons/react'

interface Props {
  question: Question
  value: { alternativeId?: number; textValue?: string; fileId?: string; fileName?: string; contentType?: string; alternativeIds?: number[] }
  onChange: (v: { alternativeId?: number; textValue?: string; fileId?: string; fileName?: string; contentType?: string; alternativeIds?: number[] }) => void
  error?: string
}

function FileUploadInput({ value, onChange }: { value?: string; onChange: (v: { fileId?: string; fileName?: string; contentType?: string }) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post('/files/upload', form)
      onChange({ fileId: res.data.fileId, fileName: res.data.fileName, contentType: res.data.contentType })
    } catch {
      onChange({})
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input ref={inputRef} type="file" onChange={handleFile} className="hidden" />
      {value ? (
        <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-xl">
          <span className="text-sm text-success font-medium">Archivo subido ✓</span>
          <button type="button" onClick={() => onChange({})}
            className="ml-auto text-xs text-error hover:underline font-medium">Eliminar</button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="w-full px-4 py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-text hover:border-primary hover:text-primary transition-all min-h-[44px] font-medium">
          {uploading ? 'Subiendo…' : 'Seleccionar archivo'}
        </button>
      )}
    </div>
  )
}

export default function QuestionRenderer({ question: q, value, onChange, error }: Props) {

  if (q.type === 'Section') {
    return (
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">Sección</span>
        <h3 className="font-display text-base font-bold text-ink mt-0.5">{q.title}</h3>
        {q.description && <p className="text-sm text-muted-text mt-1.5 leading-relaxed">{q.description}</p>}
      </div>
    )
  }

  if (q.type === 'InfoText') {
    return (
      <div>
        {q.title && <h4 className="font-display text-sm font-bold text-accent dark:text-accent">{q.title}</h4>}
        {q.description && <p className="text-sm text-muted-text mt-1 leading-relaxed">{q.description}</p>}
      </div>
    )
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink mb-3">
        {q.title}
        {q.isRequired && <span className="text-error ml-0.5">*</span>}
      </legend>

      {(q.type === 'SingleChoice' || q.type === 'MultipleChoice') && (
        <div className="space-y-2">
          {q.alternatives?.map(a => {
            const checked = q.type === 'MultipleChoice'
              ? (value.alternativeIds ?? []).includes(a.id)
              : value.alternativeId === a.id
            return (
              <label key={a.id}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all min-h-[44px] ${
                  checked
                    ? 'border-primary bg-primary-light shadow-sm'
                    : 'border-border hover:border-primary/40 hover:bg-muted/60'
                }`}>
                <input
                  type={q.type === 'SingleChoice' ? 'radio' : 'checkbox'}
                  name={`q-${q.id}`}
                  checked={checked}
                  onChange={() => {
                    if (q.type === 'MultipleChoice') {
                      const selected = value.alternativeIds ?? []
                      const next = checked
                        ? selected.filter(x => x !== a.id)
                        : [...selected, a.id]
                      onChange({ alternativeIds: next })
                    } else {
                      onChange({ alternativeId: a.id })
                    }
                  }}
                  className="accent-primary w-4 h-4 shrink-0"
                />
                <span className="text-sm text-ink">{a.text}</span>
              </label>
            )
          })}
        </div>
      )}

      {q.type === 'Dropdown' && (
        <select
          value={value.alternativeId ?? ''}
          onChange={e => onChange({ alternativeId: e.target.value ? Number(e.target.value) : undefined })}
          className="input appearance-none bg-no-repeat">
          <option value="">— Seleccionar —</option>
          {q.alternatives?.map(a => (
            <option key={a.id} value={a.id}>{a.text}</option>
          ))}
        </select>
      )}

      {q.type === 'FreeText' && (
        <textarea
          value={value.textValue || ''}
          onChange={e => onChange({ textValue: e.target.value })}
          placeholder={q.placeholder || 'Escribí tu respuesta…'}
          rows={4}
          className="input resize-none min-h-[100px]"
        />
      )}

      {q.type === 'SimpleField' && (
        <input
          value={value.textValue || ''}
          onChange={e => onChange({ textValue: e.target.value })}
          placeholder={q.placeholder || ''}
          type={q.fieldType === 'Number' ? 'number' : q.fieldType === 'Email' ? 'email' : q.fieldType === 'Phone' ? 'tel' : q.fieldType === 'Date' ? 'date' : 'text'}
          step={q.fieldType === 'Number' ? 'any' : undefined}
          inputMode={q.fieldType === 'Number' ? 'decimal' : q.fieldType === 'DNI' ? 'numeric' : q.fieldType === 'Email' ? 'email' : q.fieldType === 'Phone' ? 'tel' : 'text'}
          className="input"
        />
      )}

      {q.type === 'FileUpload' && (
        <FileUploadInput
          value={value.fileId}
          onChange={v => onChange({ fileId: v.fileId, fileName: v.fileName, contentType: v.contentType })}
        />
      )}

      {q.type === 'StarRating' && (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(n => {
            const active = parseInt(value.textValue || '0') >= n
            return (
              <button key={n} type="button" onClick={() => onChange({ textValue: String(n) })}
                className={`p-1 rounded-lg transition-all hover:scale-110 ${active ? 'text-accent' : 'text-muted-text'}`}>
                <Star size={32} weight={active ? 'fill' : 'regular'} />
              </button>
            )
          })}
          {value.textValue && (
            <span className="ml-2 text-sm text-muted-text font-medium">
              {value.textValue}/5
            </span>
          )}
        </div>
      )}

      {q.type === 'Thumbs' && (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onChange({ textValue: 'up' })}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-semibold transition-all min-h-[44px] ${
              value.textValue === 'up'
                ? 'border-success/50 bg-success/10 text-success'
                : 'border-border text-muted-text hover:border-primary/40 hover:bg-muted/60'
            }`}>
            <ThumbsUp size={20} weight={value.textValue === 'up' ? 'fill' : 'regular'} /> Me gusta
          </button>
          <button type="button" onClick={() => onChange({ textValue: 'down' })}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-semibold transition-all min-h-[44px] ${
              value.textValue === 'down'
                ? 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'border-border text-muted-text hover:border-primary/40 hover:bg-muted/60'
            }`}>
            <ThumbsDown size={20} weight={value.textValue === 'down' ? 'fill' : 'regular'} /> No me gusta
          </button>
        </div>
      )}

      {error && <p className="text-error text-xs mt-1.5">{error}</p>}
    </fieldset>
  )
}
