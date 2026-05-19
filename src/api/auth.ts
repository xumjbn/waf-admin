import axios from 'axios'
import { useAuthStore } from '@/store/auth'

export interface LoginPayload {
  username: string
  password: string
}

interface LoginResponseData {
  access_token: string
  refresh_token: string
  expires_in: number
}

export const login = async (payload: LoginPayload): Promise<void> => {
  const res = await axios.post<LoginResponseData>('/api/v1/identity/login', {
    username: payload.username,
    password: payload.password,
  })

  const { access_token, refresh_token } = res.data
  if (!access_token) {
    throw new Error('登录失败：未返回 access_token')
  }

  useAuthStore.getState().setAuth({
    token: access_token,
    refreshToken: refresh_token,
    user: { id: '', name: payload.username },
    roles: [],
  })

  // 获取当前用户信息
  try {
    const meRes = await axios.get('/api/v1/identity/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const me = meRes.data
    useAuthStore.getState().setAuth({
      token: access_token,
      refreshToken: refresh_token,
      user: { id: String(me.id), name: me.username, realName: me.real_name },
      roles: (me.roles ?? []).map((r: { id: number; name: string }) => ({
        id: String(r.id),
        name: r.name,
      })),
    })
  } catch {
    // 用户信息获取失败不阻塞登录
  }
}

export const logout = async (): Promise<void> => {
  const { token, refreshToken } = useAuthStore.getState()
  try {
    if (refreshToken) {
      await axios.post(
        '/api/v1/identity/logout',
        { refresh_token: refreshToken },
        { headers: { Authorization: `Bearer ${token}` } },
      )
    }
  } finally {
    useAuthStore.getState().clear()
  }
}
