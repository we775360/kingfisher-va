import { create } from 'zustand'

interface ThemeStore {
  isDark: boolean
  toggle: () => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  isDark: localStorage.getItem('kf_theme') !== 'light',
  toggle: () => set((state) => {
    const newDark = !state.isDark
    localStorage.setItem('kf_theme', newDark ? 'dark' : 'light')
    if (newDark) {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    }
    return { isDark: newDark }
  }),
}))