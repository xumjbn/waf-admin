// user 用户管理模块类型定义
// 对应 Keystone v3 API

// 用户
export interface User {
  id: string
  name: string
  email?: string
  enabled: boolean
  domain_id: string
  default_project_id?: string
  description?: string
  password?: string
  password_expires_at?: string
  created_at?: string
}

// 角色
export interface Role {
  id: string
  name: string
  domain_id?: string
  description?: string
}

// 项目
export interface Project {
  id: string
  name: string
  domain_id: string
  enabled: boolean
  description?: string
  parent_id?: string
  is_domain: boolean
}

// 用户角色分配
export interface UserRoleAssignment {
  user_id: string
  role_id: string
  scope?: {
    project?: { id: string }
    domain?: { id: string }
  }
}

// 项目用户角色
export interface ProjectUserRole {
  project_id: string
  user_id: string
  role_id: string
}
