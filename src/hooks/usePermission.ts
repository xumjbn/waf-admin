import { useAuthStore } from '@/store/auth'

export function usePermission() {
  const user = useAuthStore(s => s.user)
  const roles = useAuthStore(s => s.roles)

  const ADMIN_ROLE_NAMES = ['admin', 'service_admin', 'system_admin', 'superadmin']
  const AUDITOR_ROLE_NAMES = ['auditor', 'service_auditor']
  const isAdmin = roles?.some(r => ADMIN_ROLE_NAMES.includes(r.name)) ?? false
  const isAuditor = roles?.some(r => AUDITOR_ROLE_NAMES.includes(r.name)) ?? false

  const canAccess = (module: string): boolean => {
    if (isAdmin) return true
    const auditorModules = ['aggregation', 'log', 'report']
    return auditorModules.includes(module)
  }

  const canEdit = (): boolean => isAdmin
  const canDelete = (): boolean => isAdmin

  return {
    user,
    isAdmin,
    isAuditor,
    canAccess,
    canEdit,
    canDelete,
  }
}
