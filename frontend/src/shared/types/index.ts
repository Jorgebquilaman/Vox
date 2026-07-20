export type QuestionType = 'SingleChoice' | 'MultipleChoice' | 'Dropdown' | 'FreeText' | 'SimpleField' | 'FileUpload' | 'Section' | 'InfoText' | 'StarRating' | 'Thumbs'
export type SurveyStatus = 'Draft' | 'Published' | 'Closed'
export type UserRole = 'Student' | 'Admin'
export type SimpleFieldType = 'Text' | 'Number' | 'Email' | 'Phone' | 'DNI' | 'Date'

export interface LoginRequest { email: string; password: string }
export interface LoginResponse { token: string; role: UserRole; name: string; email: string }

export interface EmailSettings {
  enabled: boolean
  smtpHost: string
  smtpPort: number
  useSsl: boolean
  username: string
  password: string
  fromAddress: string
  fromName: string
}

export interface Alternative { id: number; text: string; score: number; order: number }
export interface CreateAlternative { text: string; score: number; order: number }

export interface Question {
  id: number; type: QuestionType; title: string; description?: string
  order: number; isRequired: boolean; isVisibleInReports: boolean
  isRepeatable: boolean
  fieldType?: SimpleFieldType; placeholder?: string; alternatives?: Alternative[]
  parentAlternativeId?: number
  parentQuestionOrder?: number
  parentAlternativeOrder?: number
}
export interface CreateQuestion {
  type: QuestionType; title: string; description?: string; order: number
  isRequired: boolean; isVisibleInReports: boolean
  isRepeatable: boolean
  fieldType?: SimpleFieldType; placeholder?: string; alternatives?: CreateAlternative[]
  parentAlternativeId?: number
  parentQuestionOrder?: number
  parentAlternativeOrder?: number
}

export interface Survey {
  id: number; title: string; description: string; validFrom: string; validTo: string
  status: SurveyStatus; targetAudience?: string; isAnonymous: boolean; createdAt: string; questions: Question[]
}
export interface SurveySummary {
  id: number; title: string; description: string; validFrom: string; validTo: string
  status: SurveyStatus; questionCount: number; hasResponded: boolean; isAnonymous: boolean
  resultsPublished: boolean
}
export interface UserDto {
  id: number; name: string; email: string; role: UserRole
  isActive: boolean; createdAt: string
}

export interface CreateSurvey {
  title: string; description: string; validFrom: string; validTo: string
  targetAudience?: string; isAnonymous: boolean; questions: CreateQuestion[]
  originalPdfBase64?: string
}

// Respuesta de "generar encuesta desde PDF con IA".
export interface GeneratedSurvey {
  survey: CreateSurvey
  usedAi: boolean
}

// Configuración de la API de IA (DeepSeek) editable desde Configuración.
export interface DeepSeekSettings {
  enabled: boolean
  apiKey: string
  baseUrl: string
  model: string
  timeoutSeconds: number
}

export interface UserDemographics {
  edad?: string; genero?: string; localidad?: string; provincia?: string
  pais?: string; estudiosPrevios?: string; telefono?: string; email?: string
  propuesta?: string; unidadAcademica?: string
}

export interface SubmitAnswer { questionId: number; alternativeId?: number; textValue?: string; groupInstance?: number; fileId?: string; fileName?: string; contentType?: string; alternativeIds?: number[] }
export interface SubmitSurvey { surveyId: number; answers: SubmitAnswer[] }

export interface AnswerDetail {
  questionId: number; questionTitle: string
  selectedAlternative?: string; selectedAlternativeId?: number; score?: number; textValue?: string; isVisible: boolean
  groupInstance?: number
  fileId?: string; fileName?: string; contentType?: string
}
export interface UserResult {
  userId: number; userName: string; totalScore: number
  respondedAt: string; answers: AnswerDetail[]
  demographics?: UserDemographics
}
export interface SurveyResults {
  surveyId: number; surveyTitle: string; totalResponses: number; isAnonymous: boolean; resultsPublished: boolean; rankings: UserResult[]
}

export interface PdfAnswerItem {
  questionOrder: number
  questionTitle: string
  isSection: boolean
  selectedAlternative?: string
  textValue?: string
  score?: number
  fileName?: string
  groupInstance?: number
  pdfPageNumber?: number
  pdfPositionX?: number
  pdfPositionY?: number
}

export interface ResponsePdfData {
  responseId: number
  surveyId: number
  surveyTitle: string
  surveyDescription: string
  respondentName: string
  respondentEmail: string
  respondedAt: string
  originalPdfBase64?: string
  answers: PdfAnswerItem[]
}

export interface FormAlternative {
  id: number; text: string; order: number; isSelected: boolean
}

export interface FormAnswerValue {
  alternativeId?: number; textValue?: string; fileId?: string; fileName?: string; groupInstance?: number
}

export interface FormQuestion {
  id: number; type: string; title: string; description?: string; order: number
  isRequired: boolean; fieldType?: string; placeholder?: string
  alternatives: FormAlternative[]; answers: FormAnswerValue[]
}

export interface FormSection {
  title?: string; description?: string; order: number; isRepeatable: boolean; questions: FormQuestion[]
}

export interface ResponseFormData {
  surveyId: number; surveyTitle: string; surveyDescription: string
  respondentName: string; respondentEmail: string; respondedAt: string
  sections: FormSection[]
}

export interface VerificationInfo {
  responseId: number
  surveyTitle: string
  respondentName: string
  respondedAt: string
  exists: boolean
}

// --- Preinscripción (SIU-Guaraní Preinscripción, perfil alumno) ---
export interface PropuestaElegida {
  id?: number; unidadAcademica: string; propuestaFormativa: string; sede?: string; modalidad?: string; orden: number
}
export interface DocumentoDigital {
  id?: number; requisito: string; fileId?: string; fileName?: string; contentType?: string
}
export interface DocumentoIdentidad {
  id?: number; tipo: string; numero: string; paisEmisor?: string
}
export interface Preinscripcion {
  id?: number; estado: string
  email: string; apellido: string; nombre: string; nacionalidad: string
  paisEmisorDocumento: string; tipoDocumento: string; numeroDocumento: string
  apellidoNombreLegal: string; apellidoNombreElegido?: string; identidadGenero?: string
  emailContacto: string; telefono?: string
  fechaNacimiento?: string | null; lugarNacimiento?: string
  calle?: string; numero?: string; piso?: string; departamento?: string
  localidad?: string; provincia?: string; pais?: string; codigoPostal?: string
  estudiosPrevios?: string; datosSocioeconomicos?: string
  propuestas: PropuestaElegida[]
  documentosDigitales: DocumentoDigital[]
  fechaPresentacion?: string | null; bandaHoraria?: string
  documentosIdentidad: DocumentoIdentidad[]
}
