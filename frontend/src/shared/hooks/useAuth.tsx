import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { LoginResponse, LoginRequest } from '../types'
import api from '../lib/api'
import { getStoredUser } from '../lib/utils'

interface AuthCtx {
  user: LoginResponse | null
  login: (d: LoginRequest) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginResponse | null>(getStoredUser)

  useEffect(() => { setUser(getStoredUser()) }, [])

  const login = async (d: LoginRequest) => {
    const { data } = await api.post<LoginResponse>('/auth/login', d)
    localStorage.setItem('vox_token', data.token)
    localStorage.setItem('vox_user', JSON.stringify(data))
    setUser(data)
  }

  const logout = () => {
    localStorage.removeItem('vox_token')
    localStorage.removeItem('vox_user')
    setUser(null)
  }

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
