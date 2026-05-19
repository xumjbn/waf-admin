// user 用户管理模块 API
// 对应 Keystone v3 API
import request from './request'
import type { User, Role, Project } from './types/user'

// === 用户管理 ===

// GET /v3/users
export const listUsers = () => request.get<never, { users: User[] }>('/users')

// GET /v3/users/{id}
export const getUser = (id: string) => request.get<never, { user: User }>(`/users/${id}`)

// POST /v3/users
export const createUser = (data: Omit<User, 'id' | 'created_at'>) =>
  request.post<never, { user: User }>('/users', { user: data })

// PUT /v3/users/{id}
export const updateUser = (id: string, data: Partial<User>) =>
  request.put<never, { user: User }>(`/users/${id}`, { user: data })

// DELETE /v3/users/{id}
export const deleteUser = (id: string) => request.delete(`/users/${id}`)

// === 角色管理 ===

// GET /v3/roles
export const listRoles = () => request.get<never, { roles: Role[] }>('/roles')

// GET /v3/roles/{id}
export const getRole = (id: string) => request.get<never, { role: Role }>(`/roles/${id}`)

// POST /v3/roles
export const createRole = (data: Omit<Role, 'id'>) =>
  request.post<never, { role: Role }>('/roles', { role: data })

// PUT /v3/roles/{id}
export const updateRole = (id: string, data: Partial<Role>) =>
  request.put<never, { role: Role }>(`/roles/${id}`, { role: data })

// DELETE /v3/roles/{id}
export const deleteRole = (id: string) => request.delete(`/roles/${id}`)

// === 项目管理 ===

// GET /v3/projects
export const listProjects = () => request.get<never, { projects: Project[] }>('/projects')

// GET /v3/projects/{id}
export const getProject = (id: string) =>
  request.get<never, { project: Project }>(`/projects/${id}`)

// POST /v3/projects
export const createProject = (data: Omit<Project, 'id'>) =>
  request.post<never, { project: Project }>('/projects', { project: data })

// PUT /v3/projects/{id}
export const updateProject = (id: string, data: Partial<Project>) =>
  request.put<never, { project: Project }>(`/projects/${id}`, { project: data })

// DELETE /v3/projects/{id}
export const deleteProject = (id: string) => request.delete(`/projects/${id}`)

// === 用户角色分配 ===

// PUT /v3/roles/{role_id}/users/{user_id}
export const assignUserRole = (roleId: string, userId: string) =>
  request.put(`/roles/${roleId}/users/${userId}`)

// DELETE /v3/roles/{role_id}/users/{user_id}
export const revokeUserRole = (roleId: string, userId: string) =>
  request.delete(`/roles/${roleId}/users/${userId}`)

// GET /v3/users/{user_id}/roles
export const listUserRoles = (userId: string) =>
  request.get<never, { roles: Role[] }>(`/users/${userId}/roles`)

// === 项目用户角色分配 ===

// PUT /v3/projects/{project_id}/users/{user_id}/roles/{role_id}
export const assignProjectUserRole = (projectId: string, userId: string, roleId: string) =>
  request.put(`/projects/${projectId}/users/${userId}/roles/${roleId}`)

// DELETE /v3/projects/{project_id}/users/{user_id}/roles/{role_id}
export const revokeProjectUserRole = (projectId: string, userId: string, roleId: string) =>
  request.delete(`/projects/${projectId}/users/${userId}/roles/${roleId}`)

// GET /v3/projects/{project_id}/users
export const listProjectUsers = (projectId: string) =>
  request.get<never, { users: User[] }>(`/projects/${projectId}/users`)
