import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { usePermission } from '@/hooks/usePermission'
import type { PropsWithChildren } from 'react'

export const RequireAuth = ({ children }: PropsWithChildren) => {
  const token = useAuthStore(s => s.token)
  const location = useLocation()
  const { canAccess } = usePermission()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const currentPath = location.pathname
  const module = currentPath.split('/')[1]

  if (module && !canAccess(module)) {
    return <Navigate to="/aggregation" replace />
  }

  return <>{children}</>
}
