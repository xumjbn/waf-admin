import type { ReactNode } from 'react'
import { usePermission } from '@/hooks/usePermission'

interface AuthorizedProps {
  authority: string | string[]
  children: ReactNode
  fallback?: ReactNode
}

export const Authorized = ({ authority, children, fallback = null }: AuthorizedProps) => {
  const { canAccess } = usePermission()

  const authorities = Array.isArray(authority) ? authority : [authority]
  const hasPermission = authorities.some(auth => canAccess(auth))

  return hasPermission ? <>{children}</> : <>{fallback}</>
}
