import { create } from 'zustand'

interface Pilot {
  id: string
  pilotId: string
  firstName: string
  lastName: string
  rank: string
  totalHours: number
  status: string
  simbriefUsername?: string
}

interface User {
  id: string
  email: string
  role: string
  pilot: Pilot
}

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('kf_token'),
  isAuthenticated: !!localStorage.getItem('kf_token'),

  setAuth: (user, token) => {
    localStorage.setItem('kf_token', token)
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('kf_token')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))