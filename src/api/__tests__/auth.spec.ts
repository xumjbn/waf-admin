import { describe, it, expect, vi, beforeEach } from 'vitest'
import { login, logout } from '../auth'
import { useAuthStore } from '@/store/auth'

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios')
  return {
    ...actual,
    default: {
      ...actual.default,
      post: vi.fn(),
      get: vi.fn(),
      create: actual.default.create,
    },
  }
})

describe('auth API - /api/v1/identity', () => {
  beforeEach(() => {
    useAuthStore.getState().clear()
    vi.clearAllMocks()
  })

  it('login 应调用 POST /api/v1/identity/login 并保存 token', async () => {
    const axios = (await import('axios')).default
    ;(axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        access_token: 'fake-access-token',
        refresh_token: 'fake-refresh-token',
        expires_in: 900,
      },
    })
    ;(axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        id: 'user-admin',
        username: 'admin',
        real_name: '管理员',
        roles: [{ id: 1, name: 'service_admin' }],
      },
    })

    await login({ username: 'admin', password: 'secret' })

    expect(axios.post).toHaveBeenCalledWith('/api/v1/identity/login', {
      username: 'admin',
      password: 'secret',
    })

    expect(axios.get).toHaveBeenCalledWith('/api/v1/identity/me', {
      headers: { Authorization: 'Bearer fake-access-token' },
    })

    const state = useAuthStore.getState()
    expect(state.token).toBe('fake-access-token')
    expect(state.refreshToken).toBe('fake-refresh-token')
    expect(state.user?.name).toBe('admin')
    expect(state.roles).toHaveLength(1)
    expect(state.roles[0].name).toBe('service_admin')
  })

  it('login 无 access_token 应抛错', async () => {
    const axios = (await import('axios')).default
    ;(axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { access_token: '', refresh_token: '', expires_in: 0 },
    })

    await expect(login({ username: 'x', password: 'y' })).rejects.toThrow(/access_token/)
  })

  it('logout 应调用 POST /api/v1/identity/logout 并清空状态', async () => {
    useAuthStore.getState().setAuth({
      token: 'test-token',
      refreshToken: 'test-refresh',
      user: { id: 'u', name: 'n' },
      roles: [],
    })

    const axios = (await import('axios')).default
    ;(axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { message: 'ok' } })

    await logout()

    expect(axios.post).toHaveBeenCalledWith(
      '/api/v1/identity/logout',
      { refresh_token: 'test-refresh' },
      { headers: { Authorization: 'Bearer test-token' } },
    )
    expect(useAuthStore.getState().token).toBeNull()
  })
})
