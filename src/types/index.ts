export interface AuthUser {
  id: string
  name: string
  realName?: string
}

export interface AuthRole {
  id: string
  name: string                       // 后端规范 key（如 'system_admin'）
  display_name?: string              // 中文显示名（如 '系统管理员'）
  modules?: string[] | '*'           // 可访问模块列表，'*' 表示全部
  readonly?: boolean                 // true = 只读角色（仅查看，禁写删）
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
