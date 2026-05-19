import { Suspense } from 'react'
import { useRoutes } from 'react-router-dom'
import { routes } from '@/routes'
import ErrorBoundary from '@/components/ErrorBoundary'
import PageLoading from '@/components/PageLoading'
import { useThemeEffect } from '@/hooks/useThemeEffect'
import '@/i18n'

const App = () => {
  const element = useRoutes(routes)
  // Apply theme attribute at the root so /login (outside BasicLayout) also
  // respects the stored preference; default isDark=false means light mode.
  useThemeEffect()

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoading />}>{element}</Suspense>
    </ErrorBoundary>
  )
}

export default App
