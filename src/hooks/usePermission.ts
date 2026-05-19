import { useAuthStore } from '@/store/auth'

// 与 src/mocks/identity.ts 的 role.key 对齐，但保留宽松匹配（lowercase + includes）
const ADMIN_KEYS = ['system_admin', 'service_admin', 'superadmin']
const AUDITOR_KEYS = ['auditor']
const READONLY_KEYS = ['readonly']

const hasKey = (roleName: string | undefined, keys: string[]) => {
  if (!roleName) return false
  const lower = roleName.toLowerCase()
  return keys.some(k => lower === k || lower.includes(k))
}

export function usePermission() {
  const user = useAuthStore(s => s.user)
  const roles = useAuthStore(s => s.roles)

  // admin/admin 兜底：用户名为 admin 一律视为系统管理员，避免后端角色信息缺失/拼写差异导致整个导航空白
  const isAdminByUsername = user?.name === 'admin'

  const isAdmin =
    isAdminByUsername || (roles ?? []).some(r => hasKey(r.name, ADMIN_KEYS) || r.modules === '*')

  const isAuditor = (roles ?? []).some(r => hasKey(r.name, AUDITOR_KEYS))
  const isReadonly =
    !isAdmin && (roles ?? []).some(r => hasKey(r.name, READONLY_KEYS) || r.readonly === true)

  // 合并所有角色的 modules，'*' 短路为全部
  const allowedModules: Set<string> | '*' = (() => {
    if (isAdmin) return '*'
    const set = new Set<string>()
    for (const r of roles ?? []) {
      if (r.modules === '*') return '*'
      if (Array.isArray(r.modules)) r.modules.forEach(m => set.add(m))
    }
    return set
  })()

  const canAccess = (module: string): boolean => {
    if (allowedModules === '*') return true
    return allowedModules.has(module)
  }

  const canEdit = (module?: string): boolean => {
    if (isAdmin) return true
    if (isReadonly || isAuditor) return false
    if (module && !canAccess(module)) return false
    return true
  }

  const canDelete = (module?: string): boolean => {
    if (!isAdmin) return false
    if (module && !canAccess(module)) return false
    return true
  }

  return {
    user,
    isAdmin,
    isAuditor,
    isReadonly,
    canAccess,
    canEdit,
    canDelete,
  }
}
