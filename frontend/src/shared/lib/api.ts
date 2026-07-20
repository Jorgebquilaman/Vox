import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('vox_token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  e => {
    if (e.response?.status === 401) {
      localStorage.removeItem('vox_token')
      localStorage.removeItem('vox_user')
      window.location.href = '/login'
    }
    return Promise.reject(e)
  }
)

export default api

import type { GeneratedSurvey } from '../types'

// Genera una encuesta a partir de un PDF usando IA (DeepSeek).
export async function generateSurveyFromPdf(file: File): Promise<GeneratedSurvey> {
  const form = new FormData()
  form.append('file', file)
  const r = await api.post<GeneratedSurvey>('/surveys/generate-from-pdf', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return r.data
}
