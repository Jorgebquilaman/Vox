import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../../shared/lib/api'
import type { VerificationInfo } from '../../../shared/types'
import Spinner from '../../../shared/components/Spinner'

export default function VerifyResponsePage() {
  const { responseId } = useParams<{ responseId: string }>()
  const nav = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['verify-response', responseId],
    queryFn: () => api.get<VerificationInfo>(`/responses/${responseId}/verify`).then(r => r.data),
    enabled: !!responseId
  })

  return (
    <div className="min-h-dvh flex items-center justify-center bg-muted px-4">
      <div className="max-w-sm w-full text-center">
        {isLoading ? (
          <Spinner />
        ) : !data?.exists ? (
          <>
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-error font-bold">✕</span>
            </div>
            <h2 className="font-display text-xl font-bold text-ink mb-2">Respuesta no encontrada</h2>
            <p className="text-muted-text text-sm mb-6">
              No se encontró ninguna respuesta con ese código de verificación.
            </p>
            <button onClick={() => nav('/')} className="btn btn-ghost text-sm">Volver al inicio</button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-success font-bold">✓</span>
            </div>
            <h2 className="font-display text-xl font-bold text-ink mb-2">Respuesta verificada</h2>
            <p className="text-muted-text text-sm mb-4">
              Esta respuesta existe en el sistema.
            </p>
            <div className="card p-4 text-left space-y-2 text-sm">
              <div>
                <span className="text-muted-text text-xs">Encuesta</span>
                <p className="font-semibold text-ink">{data.surveyTitle}</p>
              </div>
              <div>
                <span className="text-muted-text text-xs">Estudiante</span>
                <p className="font-semibold text-ink">{data.respondentName}</p>
              </div>
              <div>
                <span className="text-muted-text text-xs">Fecha de respuesta</span>
                <p className="font-semibold text-ink">
                  {new Date(data.respondedAt).toLocaleDateString('es-AR', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <button onClick={() => nav('/')} className="btn btn-ghost mt-6">Volver al inicio</button>
          </>
        )}
      </div>
    </div>
  )
}
