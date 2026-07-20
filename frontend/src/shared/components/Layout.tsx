import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { SignOut, Lock } from '@phosphor-icons/react'
import logoSvg from '/vox-icon.svg'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const isLogin = loc.pathname === '/login'

  if (isLogin) return <>{children}</>

  return (
    <div className="min-h-dvh bg-muted flex flex-col">
      <header className="bg-surface/80 dark:bg-surface/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-light flex items-center justify-center">
              <img src={logoSvg} alt="" className="h-5 w-5" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-primary dark:text-primary">VoxIUPA</span>
          </Link>
          {user && (
            <div className="flex items-center gap-3 text-sm">
              {user.role !== 'Admin' && (
                <Link to="/preinscripcion"
                  className="text-muted-text hover:text-ink text-sm font-medium transition-colors">
                  Mis Datos
                </Link>
              )}
              <Link to="/cambiar-contrasena"
                className="text-muted-text hover:text-ink transition-colors p-1"
                title="Cambiar contraseña">
                <Lock size={16} />
              </Link>
              <span className="text-muted-text hidden sm:block truncate max-w-[140px]">{user.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide ${
                user.role === 'Admin' ? 'bg-primary-light dark:bg-primary/15 text-primary' : 'bg-accent-light dark:bg-accent-light/30 text-accent dark:text-accent'
              }`}>{user.role === 'Admin' ? 'Admin' : 'Alumno'}</span>
              <button onClick={() => { logout(); nav('/login') }}
                className="text-muted-text hover:text-ink transition-colors p-1"
                title="Salir">
                <SignOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto px-4 py-6 sm:py-8 w-full">{children}</main>
    </div>
  )
}
