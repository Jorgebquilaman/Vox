import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './shared/hooks/useAuth'
import Layout from './shared/components/Layout'
import AdminLayout from './shared/components/AdminLayout'
import RoleAwareLayout from './shared/components/RoleAwareLayout'
import ProtectedRoute from './shared/components/ProtectedRoute'
import LoginPage from './features/auth/pages/LoginPage'
import ChangePasswordPage from './features/auth/pages/ChangePasswordPage'
import StudentDashboard from './features/surveys/pages/StudentDashboard'
import SurveyResponsePage from './features/surveys/pages/SurveyResponsePage'
import VerifyResponsePage from './features/surveys/pages/VerifyResponsePage'
import PreinscripcionPage from './features/surveys/pages/PreinscripcionPage'
import AdminDashboard from './features/admin/pages/AdminDashboard'
import SurveyListPage from './features/admin/pages/SurveyListPage'
import SurveyBuilderPage from './features/admin/pages/SurveyBuilderPage'
import ResultsPage from './features/admin/pages/ResultsPage'
import ResponseFormPage from './features/admin/pages/ResponseFormPage'
import SurveyAnalyticsPage from './features/admin/pages/SurveyAnalyticsPage'
import UsersPage from './features/admin/pages/UsersPage'
import SettingsPage from './features/admin/pages/SettingsPage'

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } })

function Home() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'Admin') return <Navigate to="/admin" replace />
  return <StudentDashboard />
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/cambiar-contrasena" element={<Layout><ProtectedRoute><ChangePasswordPage /></ProtectedRoute></Layout>} />
            <Route path="/survey/:id" element={<Layout><ProtectedRoute><SurveyResponsePage /></ProtectedRoute></Layout>} />
            <Route path="/verificar/:responseId" element={<Layout><ProtectedRoute><VerifyResponsePage /></ProtectedRoute></Layout>} />
            <Route path="/preinscripcion" element={<Layout><ProtectedRoute><PreinscripcionPage /></ProtectedRoute></Layout>} />
            <Route path="/results/:id" element={<RoleAwareLayout><ProtectedRoute><ResultsPage /></ProtectedRoute></RoleAwareLayout>} />
            <Route path="/survey/:id/analytics" element={<AdminLayout><ProtectedRoute roles={['Admin']}><SurveyAnalyticsPage /></ProtectedRoute></AdminLayout>} />

            <Route path="/admin" element={<AdminLayout><ProtectedRoute roles={['Admin']}><AdminDashboard /></ProtectedRoute></AdminLayout>} />
            <Route path="/admin/surveys" element={<AdminLayout><ProtectedRoute roles={['Admin']}><SurveyListPage /></ProtectedRoute></AdminLayout>} />
            <Route path="/admin/users" element={<AdminLayout><ProtectedRoute roles={['Admin']}><UsersPage /></ProtectedRoute></AdminLayout>} />
            <Route path="/admin/cambiar-contrasena" element={<AdminLayout><ProtectedRoute roles={['Admin']}><ChangePasswordPage /></ProtectedRoute></AdminLayout>} />
            <Route path="/admin/settings" element={<AdminLayout><ProtectedRoute roles={['Admin']}><SettingsPage /></ProtectedRoute></AdminLayout>} />
            <Route path="/survey/new" element={<AdminLayout><ProtectedRoute roles={['Admin']}><SurveyBuilderPage /></ProtectedRoute></AdminLayout>} />
            <Route path="/survey/:id/edit" element={<AdminLayout><ProtectedRoute roles={['Admin']}><SurveyBuilderPage /></ProtectedRoute></AdminLayout>} />
            <Route path="/surveys/:surveyId/responses/:userId/form" element={<AdminLayout><ProtectedRoute roles={['Admin']}><ResponseFormPage /></ProtectedRoute></AdminLayout>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-center" toastOptions={{ duration: 3000, style: { borderRadius: '12px', fontSize: '14px' } }} />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
