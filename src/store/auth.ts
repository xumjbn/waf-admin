import { create } from 'zustand'
import type { AuthUser, AuthRole } from '@/types'

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: AuthUser | null
  roles: AuthRole[]
  setAuth: (payload: {
    token: string
    refreshToken?: string
    user: AuthUser
    roles: AuthRole[]
  }) => void
  clear: () => void
  hasRole: (roleName: string) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  roles: [],
  setAuth: ({ token, refreshToken, user, roles }) =>
    set({ token, refreshToken: refreshToken ?? null, user, roles }),
  clear: () => set({ token: null, refreshToken: null, user: null, roles: [] }),
  hasRole: (roleName: string) => get().roles.some(r => r.name === roleName),
}))
