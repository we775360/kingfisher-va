import { create } from 'zustand'
import { login as apiLogin, getMe } from '../lib/api'

export interface Pilot {
  id: string; pilotId: string; firstName: string; lastName: string; rank: string; totalHours: number; status: string
}

export interface User {
  id: string; email: string; role: string; pilot: Pilot
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean

  login: (email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<boolean>
  setAuth: (user: User, token: string) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('kf_token'),
  isAuthenticated: false,
  loading: false,

  setAuth: (user, token) => {
    localStorage.setItem('kf_token', token)
    set({ user, token, isAuthenticated: true, loading: false })
  },

  login: async (email, password) => {
    set({ loading: true })
    try {
      const data = await apiLogin(email, password)
      get().setAuth(data.user, data.token)
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem('kf_token')
    set({ user: null, token: null, isAuthenticated: false })
  },

  checkAuth: async () => {
    const token = get().token
    if (!token) return false
    try {
      const user = await getMe()
      set({ user, isAuthenticated: true })
      return true
    } catch {
      localStorage.removeItem('kf_token')
      set({ token: null, isAuthenticated: false })
      return false
    }
  },
}))
