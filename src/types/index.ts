export interface AuthUser {
  id: string
  name: string
  realName?: string
}

export interface AuthRole {
  id: string
  name: string
}

// 通用错误
export interface ApiError {
  code?: string | number
  message: string
  title?: string
}

// Go 后端统一错误响应格式
// 对应 system-service/managerd/errors/errors.go: ErrorResponse
export interface GoApiErrorResponse {
  errorcode: number
  description: string
  data?: unknown
}

// 兼容 Python 旧格式的错误响应
export interface PythonApiErrorResponse {
  error_num: number
  description: string
  data?: unknown
}

// 联合类型：前端拦截器同时支持两种格式
export type ApiErrorResponse =
  | GoApiErrorResponse
  | PythonApiErrorResponse
  | ApiError
