import { useEffect } from 'react'
import { useThemeStore } from '@/store/theme'

export function useThemeEffect() {
  const isDark = useThemeStore(s => s.isDark)

  useEffect(() => {
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])
}
