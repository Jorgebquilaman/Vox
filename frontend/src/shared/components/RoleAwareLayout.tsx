import { useAuth } from '../hooks/useAuth'
import Layout from './Layout'
import AdminLayout from './AdminLayout'

export default function RoleAwareLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (user?.role === 'Admin') return <AdminLayout>{children}</AdminLayout>
  return <Layout>{children}</Layout>
}
