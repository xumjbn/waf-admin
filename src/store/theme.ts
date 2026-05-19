import { create } from 'zustand'

interface ThemeState {
  isDark: boolean
  toggle: () => void
  setTheme: (isDark: boolean) => void
}

const THEME_STORAGE_KEY = 'theme'

const getStoredTheme = (): string | null => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(THEME_STORAGE_KEY)
}

const persistTheme = (isDark: boolean): void => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light')
}

const getInitialTheme = (): boolean => getStoredTheme() === 'dark'

export const useThemeStore = create<ThemeState>(set => ({
  isDark: getInitialTheme(),
  toggle: () =>
    set(state => {
      const isDark = !state.isDark
      persistTheme(isDark)
      return { isDark }
    }),
  setTheme: (isDark: boolean) => {
    persistTheme(isDark)
    set({ isDark })
  },
}))

