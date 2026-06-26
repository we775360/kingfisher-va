import { create } from 'zustand'

interface SettingsState {
  autoAnnouncements: boolean
  ambientSounds: boolean
  volume: number
  theme: 'dark' | 'light'

  toggleAutoAnnouncements: () => void
  toggleAmbientSounds: () => void
  setVolume: (vol: number) => void
  setTheme: (theme: 'dark' | 'light') => void
}

const load = () => {
  try {
    const raw = localStorage.getItem('kf_acars_settings')
    if (raw) return JSON.parse(raw)
  } catch { }
  return {}
}

const persist = (state: Partial<SettingsState>) => {
  const existing = load()
  localStorage.setItem('kf_acars_settings', JSON.stringify({ ...existing, ...state }))
}

export const useSettingsStore = create<SettingsState>((set) => {
  const saved = load()
  return {
    autoAnnouncements: saved.autoAnnouncements ?? true,
    ambientSounds: saved.ambientSounds ?? false,
    volume: saved.volume ?? 0.7,
    theme: saved.theme ?? 'dark',

    toggleAutoAnnouncements: () => set((s) => {
      const v = !s.autoAnnouncements
      persist({ autoAnnouncements: v })
      return { autoAnnouncements: v }
    }),

    toggleAmbientSounds: () => set((s) => {
      const v = !s.ambientSounds
      persist({ ambientSounds: v })
      return { ambientSounds: v }
    }),

    setVolume: (vol) => {
      persist({ volume: vol })
      set({ volume: vol })
    },

    setTheme: (theme) => {
      persist({ theme })
      set({ theme })
    },
  }
})
