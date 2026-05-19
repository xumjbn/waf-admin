// Axios 实例 + X-Auth-Token 拦截器
// 对应 API_REFERENCE.md §认证: 所有非登录请求必须携带 X-Auth-Token
import axios, { AxiosError, AxiosResponse } from 'axios'
import { message } from 'antd'
import { useAuthStore } from '@/store/auth'

// Go 后端错误响应格式（兼容 Python 旧格式）
interface ApiErrorPayload {
  // Go 后端
  errorcode?: number
  description?: string
  data?: unknown
  // 兼容字段（Python 旧格式或通用 HTTP 错误）
  error_num?: number
  message?: string
  title?: string
}

// 共享拦截器函数
const requestInterceptor = (config: import('axios').InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
}

const responseErrorInterceptor = (err: AxiosError<ApiErrorPayload>) => {
  const status = err.response?.status
  if (status === 401) {
    useAuthStore.getState().clear()
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
  } else if (status === 404) {
    // 后端尚未实现的接口：静默处理，避免每次导航弹窗
    // 调用方仍可通过 .catch 感知，页面通常显示空数据态
    if (import.meta.env.DEV) {
      console.warn('[API 404]', err.config?.method?.toUpperCase(), err.config?.url)
    }
  } else if (status && status >= 400) {
    // 优先级：description (Go) > message > title > 默认
    const data = err.response?.data
    const msg =
      data?.description ||
      data?.message ||
      data?.title ||
      err.message ||
      '请求失败'
    message.error(msg)
  }
  return Promise.reject(err)
}

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// 请求拦截：注入 X-Auth-Token
request.interceptors.request.use(requestInterceptor)

// 响应拦截：401 → 跳登录；其余错误消息透传
request.interceptors.response.use((res: AxiosResponse) => res.data, responseErrorInterceptor)

export default request

// v1 API 实例 — aggregation/site/policy 等业务 API 使用
export const requestV1 = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})
requestV1.interceptors.request.use(requestInterceptor)
requestV1.interceptors.response.use((res: AxiosResponse) => res.data, responseErrorInterceptor)

// 导出原始 axios 用于登录请求（不走拦截器的 baseURL 干扰）
export const rawAxios = axios
