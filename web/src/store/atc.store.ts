import { create } from 'zustand'

interface ATCUser {
  id: string
  email: string
  firstName: string
  lastName: string
  position: string
  rating: string
  status: string
}

interface ATCStore {
  user: ATCUser | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: ATCUser, token: string) => void
  logout: () => void
}

export const useATCStore = create<ATCStore>((set) => ({
  user: (() => {
    try {
      const raw = localStorage.getItem('kf_atc_user')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })(),
  token: localStorage.getItem('kf_atc_token'),
  isAuthenticated: !!localStorage.getItem('kf_atc_token'),

  setAuth: (user, token) => {
    localStorage.setItem('kf_atc_token', token)
    localStorage.setItem('kf_atc_user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('kf_atc_token')
    localStorage.removeItem('kf_atc_user')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))
