// API 适配层 —— 把 waf-control 后端的真实响应映射到 UI 组件期望的 MockUser /
// MockRole / MockProject 形状，避免改动 src/pages/user/index.tsx 的视图。
//
// 路径约定：
//   GET  /api/v1/identity/users       → { items, total }（envelope，9bef3b4 起）
//   POST /api/v1/identity/users
//   PUT  /api/v1/identity/users/{id}
//   DELETE /api/v1/identity/users/{id}
//   GET  /api/v1/identity/roles       → { items, total }
//   POST /api/v1/identity/roles
//   PUT  /api/v1/identity/roles/{id}
//   DELETE /api/v1/identity/roles/{id}
//   GET  /api/v1/projects             → { projects: [...] }（OpenStack 风格 wrap）
//   POST /api/v1/projects             → { project: {...} } 包了一层
//   PUT  /api/v1/projects/{id}
//   DELETE /api/v1/projects/{id}

import axios from 'axios'
import { useAuthStore } from '@/store/auth'
import type { ModuleKey, MockUser, MockRole, MockProject } from '@/mocks/identity'

// ---------- wire-format types ----------

interface BackendRoleDigest {
  id: number
  key: string
  name: string
  color: string
}

interface BackendUserListItem {
  id: number
  username: string
  email?: string
  real_name?: string
  enabled: boolean
  avatar?: string
  project?: string
  last_login?: string
  role?: BackendRoleDigest | null
}

interface BackendUserRaw {
  id: number
  username: string
  email?: string | null
  real_name?: string | null
  is_active: boolean
  avatar?: string | null
  project?: string | null
  last_login?: string | null
  roles?: Array<{ id: number; name: string; role_key?: string; color?: string }>
}

interface BackendRoleDTO {
  id: number
  name: string         // canonical key, e.g. 'system_admin'
  display_name: string // 中文
  description?: string
  modules: '*' | string[]
  readonly: boolean
  color?: string
  user_count?: number
}

interface BackendProject {
  id: string           // /projects 接口把 int64 序列化为 string
  name: string
  description?: string
  domain_id: string
  is_domain: boolean
  enabled: boolean
  members: number
  sites: number
  instances: number
  created_at?: string
}

// ---------- adapters ----------

function adaptUser(b: BackendUserListItem): MockUser {
  return {
    id: String(b.id),
    username: b.username,
    password: '',
    email: b.email ?? '',
    real_name: b.real_name ?? '',
    role_id: b.role ? String(b.role.id) : '',
    project: b.project ?? '默认',
    enabled: b.enabled,
    last_login: b.last_login ?? '—',
    avatar: b.avatar || (b.username[0]?.toUpperCase() ?? '?'),
  }
}

function adaptUserRaw(b: BackendUserRaw): MockUser {
  return {
    id: String(b.id),
    username: b.username,
    password: '',
    email: b.email ?? '',
    real_name: b.real_name ?? '',
    role_id: b.roles?.[0]?.id != null ? String(b.roles[0].id) : '',
    project: b.project ?? '默认',
    enabled: b.is_active,
    last_login: b.last_login ?? '—',
    avatar: b.avatar || (b.username[0]?.toUpperCase() ?? '?'),
  }
}

function adaptRole(b: BackendRoleDTO): MockRole {
  const modules: ModuleKey[] | '*' =
    b.modules === '*' ? '*' : ((b.modules ?? []) as ModuleKey[])
  return {
    id: String(b.id),
    key: b.name,
    name: b.display_name,
    description: b.description ?? '',
    modules,
    readonly: b.readonly,
    color: b.color || '#a855f7',
  }
}

function adaptProject(b: BackendProject): MockProject {
  return {
    id: b.id,
    name: b.name,
    description: b.description ?? '',
    sites: b.sites ?? 0,
    instances: b.instances ?? 0,
    members: b.members ?? 0,
    created_at: b.created_at ?? '',
  }
}

// ---------- auth header ----------

function authHeader(): Record<string, string> {
  const t = useAuthStore.getState().token
  return t ? { Authorization: `Bearer ${t}` } : {}
}

// ---------- users ----------

export async function listUsers(): Promise<MockUser[]> {
  const res = await axios.get<{ items: BackendUserListItem[]; total: number }>(
    '/api/v1/identity/users',
    { headers: authHeader() },
  )
  return (res.data.items ?? []).map(adaptUser)
}

export interface CreateUserPayload {
  username: string
  email: string
  real_name?: string
  password?: string
  role_id?: string       // 前端是 string id，发送时转 number
  project?: string       // 当前后端 CreateUserRequest 不消费此字段，先随表单走，后续可在 /projects/{id}/users/... 单独挂接
}

export async function createUser(p: CreateUserPayload): Promise<MockUser> {
  const body: Record<string, unknown> = {
    username: p.username,
    email: p.email,
    real_name: p.real_name,
    password: p.password || p.username,
  }
  if (p.role_id) body.role_ids = [Number(p.role_id)]
  const res = await axios.post<BackendUserRaw>('/api/v1/identity/users', body, { headers: authHeader() })
  return adaptUserRaw(res.data)
}

export interface UpdateUserPayload {
  email?: string
  real_name?: string
  enabled?: boolean
  password?: string
  role_id?: string
}

export async function updateUser(id: string, p: UpdateUserPayload): Promise<MockUser> {
  const body: Record<string, unknown> = {}
  if (p.email !== undefined) body.email = p.email
  if (p.real_name !== undefined) body.real_name = p.real_name
  if (p.enabled !== undefined) body.is_active = p.enabled
  if (p.password) body.password = p.password
  if (p.role_id) body.role_ids = [Number(p.role_id)]
  const res = await axios.put<BackendUserRaw>(`/api/v1/identity/users/${id}`, body, { headers: authHeader() })
  return adaptUserRaw(res.data)
}

export async function deleteUser(id: string): Promise<void> {
  await axios.delete(`/api/v1/identity/users/${id}`, { headers: authHeader() })
}

export async function resetUserPassword(id: string): Promise<string> {
  // 后端没有专门的 reset 端点，复用 PUT 设置随机密码并返回明文
  const plain = 'Temp-' + Math.random().toString(36).slice(2, 10)
  await updateUser(id, { password: plain })
  return plain
}

// ---------- roles ----------

export async function listRoles(): Promise<MockRole[]> {
  const res = await axios.get<{ items: BackendRoleDTO[]; total: number }>(
    '/api/v1/identity/roles',
    { headers: authHeader() },
  )
  return (res.data.items ?? []).map(adaptRole)
}

export async function updateRole(id: string, r: MockRole): Promise<MockRole> {
  // 后端 UpdateRoleRequest 字段（97a9f0b 之后）：
  // name(中文) / role_key(英文 key) / description / permissions / readonly / color
  const permissions = r.modules === '*' ? ['*'] : (r.modules ?? [])
  const body: Record<string, unknown> = {
    name: r.name,
    role_key: r.key,
    description: r.description,
    permissions,
    readonly: r.readonly,
    color: r.color,
  }
  const res = await axios.put<BackendRoleDTO>(`/api/v1/identity/roles/${id}`, body, {
    headers: authHeader(),
  })
  return adaptRole(res.data)
}

// ---------- projects ----------

export async function listProjects(): Promise<MockProject[]> {
  const res = await axios.get<{ projects: BackendProject[] }>('/api/v1/projects', {
    headers: authHeader(),
  })
  return (res.data.projects ?? []).map(adaptProject)
}

export async function createProject(p: { name: string; description?: string }): Promise<MockProject> {
  const res = await axios.post<{ project: BackendProject }>(
    '/api/v1/projects',
    { project: { name: p.name, description: p.description, enabled: true } },
    { headers: authHeader() },
  )
  return adaptProject(res.data.project)
}

export async function updateProject(id: string, p: { name?: string; description?: string }): Promise<MockProject> {
  const res = await axios.put<{ project: BackendProject }>(
    `/api/v1/projects/${id}`,
    { project: { name: p.name, description: p.description } },
    { headers: authHeader() },
  )
  return adaptProject(res.data.project)
}

export async function deleteProject(id: string): Promise<void> {
  await axios.delete(`/api/v1/projects/${id}`, { headers: authHeader() })
}
