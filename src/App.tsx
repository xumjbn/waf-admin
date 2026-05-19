import { Suspense } from 'react'
import { useRoutes } from 'react-router-dom'
import { routes } from '@/routes'
import ErrorBoundary from '@/components/ErrorBoundary'
import PageLoading from '@/components/PageLoading'
import '@/i18n'

const App = () => {
  const element = useRoutes(routes)

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoading />}>{element}</Suspense>
    </ErrorBoundary>
  )
}

export default App
