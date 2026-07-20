import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  ChartPieSlice, ClipboardText, Users, GearSix, SignOut, Sun, Moon, Lock
} from '@phosphor-icons/react'
import { useTheme } from '../hooks/useTheme'
import logoSvg from '/vox-icon.svg'

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: ChartPieSlice },
  { label: 'Encuestas', path: '/admin/surveys', icon: ClipboardText },
  { label: 'Usuarios', path: '/admin/users', icon: Users },
  { label: 'Contraseña', path: '/admin/cambiar-contrasena', icon: Lock },
  { label: 'Configuración', path: '/admin/settings', icon: GearSix },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const nav = useNavigate()
  const loc = useLocation()

  return (
    <div className="min-h-dvh bg-muted flex transition-colors">
      <aside className="w-60 fixed inset-y-0 left-0 z-30 flex flex-col shrink-0
        bg-surface border-r border-border transition-all">
        {/* ── Brand ── */}
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-border">
          <img src={logoSvg} alt="" className="h-7 w-7" />
          <span className="font-display font-bold text-lg tracking-tight text-primary">VoxIUPA</span>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const active = item.path === '/admin'
              ? loc.pathname === '/admin'
              : loc.pathname.startsWith(item.path)
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary-light dark:bg-primary/15 text-primary font-semibold border-l-[3px] border-l-accent rounded-r-xl pl-[9px]'
                    : 'text-muted-text hover:text-ink hover:bg-muted transition-colors'
                }`}
              >
                <Icon size={18} weight={active ? 'fill' : 'duotone'} className={active ? 'text-accent' : ''} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* ── Theme toggle ── */}
        <div className="px-3 py-2 border-t border-border space-y-1">
          <button
            onClick={toggle}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-muted-text hover:text-ink hover:bg-muted transition-all"
          >
            {theme === 'light' ? <Moon size={18} weight="duotone" /> : <Sun size={18} weight="duotone" />}
            {theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
          </button>
        </div>

        {/* ── User ── */}
        <div className="px-4 py-3 border-t border-border flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-light dark:bg-primary/20 flex items-center justify-center text-primary font-display font-bold text-sm shrink-0">
            {(user?.name || '?')[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate leading-tight">{user?.name}</p>
            <p className="text-[11px] text-muted-text uppercase tracking-wider font-semibold">{user?.role}</p>
          </div>
          <button
            onClick={() => { logout(); nav('/login') }}
            className="text-muted-text hover:text-accent transition-colors p-1 rounded-lg hover:bg-accent-light"
            title="Salir"
          >
            <SignOut size={16} />
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-60 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-6 sm:py-8">{children}</div>
      </main>
    </div>
  )
}
