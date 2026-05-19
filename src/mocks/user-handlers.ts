// 用户管理模块 MSW mock handlers
// 对照 Keystone v3 API
import { http, HttpResponse } from 'msw'
import type { User, Role, Project } from '../api/types/user'

const genId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

let users: User[] = [
  {
    id: 'user-001',
    name: 'admin',
    email: 'admin@example.com',
    enabled: true,
    domain_id: 'default',
    description: '系统管理员',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-002',
    name: 'auditor',
    email: 'auditor@example.com',
    enabled: true,
    domain_id: 'default',
    description: '审计员',
    created_at: '2024-02-15T08:00:00Z',
  },
  {
    id: 'user-003',
    name: 'operator',
    email: 'operator@example.com',
    enabled: true,
    domain_id: 'default',
    description: '运维人员',
    created_at: '2024-03-20T10:00:00Z',
  },
  {
    id: 'user-004',
    name: 'guest',
    email: 'guest@example.com',
    enabled: false,
    domain_id: 'default',
    description: '访客账号',
    created_at: '2024-06-01T12:00:00Z',
  },
]

let roles: Role[] = [
  { id: 'role-001', name: 'service_admin', description: '服务管理员' },
  { id: 'role-002', name: 'service_auditor', description: '服务审计员' },
  { id: 'role-003', name: 'service_operator', description: '服务运维员' },
]

let projects: Project[] = [
  {
    id: 'proj-001',
    name: '默认项目',
    domain_id: 'default',
    enabled: true,
    description: '默认项目',
    is_domain: false,
  },
  {
    id: 'proj-002',
    name: '生产环境',
    domain_id: 'default',
    enabled: true,
    description: '生产环境项目',
    is_domain: false,
  },
  {
    id: 'proj-003',
    name: '测试环境',
    domain_id: 'default',
    enabled: true,
    description: '测试环境项目',
    is_domain: false,
  },
]

// 用户-角色关联
let userRoles: Record<string, string[]> = {
  'user-001': ['role-001'],
  'user-002': ['role-002'],
  'user-003': ['role-003'],
  'user-004': [],
}

// 项目-用户-角色关联
let projectUserRoles: Array<{ project_id: string; user_id: string; role_id: string }> = [
  { project_id: 'proj-001', user_id: 'user-001', role_id: 'role-001' },
  { project_id: 'proj-001', user_id: 'user-002', role_id: 'role-002' },
  { project_id: 'proj-002', user_id: 'user-001', role_id: 'role-001' },
  { project_id: 'proj-002', user_id: 'user-003', role_id: 'role-003' },
]

export const userHandlers = [
  // === 用户管理 ===
  http.get('/v3/users', () => HttpResponse.json({ users })),

  http.get('/v3/users/:id', ({ params }) => {
    const user = users.find(u => u.id === params.id)
    return user
      ? HttpResponse.json({ user })
      : HttpResponse.json({ error: '用户不存在' }, { status: 404 })
  }),

  http.post('/v3/users', async ({ request }) => {
    const body = (await request.json()) as { user: Partial<User> }
    const newUser = {
      id: genId('user'),
      created_at: new Date().toISOString(),
      ...body.user,
    } as User
    users = [...users, newUser]
    return HttpResponse.json({ user: newUser }, { status: 201 })
  }),

  http.put('/v3/users/:id', async ({ params, request }) => {
    const body = (await request.json()) as { user: Partial<User> }
    const idx = users.findIndex(u => u.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '用户不存在' }, { status: 404 })
    const updated = { ...users[idx], ...body.user }
    users = [...users.slice(0, idx), updated, ...users.slice(idx + 1)]
    return HttpResponse.json({ user: updated })
  }),

  http.delete('/v3/users/:id', ({ params }) => {
    const idx = users.findIndex(u => u.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '用户不存在' }, { status: 404 })
    users = [...users.slice(0, idx), ...users.slice(idx + 1)]
    return new HttpResponse(null, { status: 204 })
  }),

  // === 角色管理 ===
  http.get('/v3/roles', () => HttpResponse.json({ roles })),

  http.get('/v3/roles/:id', ({ params }) => {
    const role = roles.find(r => r.id === params.id)
    return role
      ? HttpResponse.json({ role })
      : HttpResponse.json({ error: '角色不存在' }, { status: 404 })
  }),

  http.post('/v3/roles', async ({ request }) => {
    const body = (await request.json()) as { role: Partial<Role> }
    const newRole = { id: genId('role'), ...body.role } as Role
    roles = [...roles, newRole]
    return HttpResponse.json({ role: newRole }, { status: 201 })
  }),

  http.put('/v3/roles/:id', async ({ params, request }) => {
    const body = (await request.json()) as { role: Partial<Role> }
    const idx = roles.findIndex(r => r.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '角色不存在' }, { status: 404 })
    const updated = { ...roles[idx], ...body.role }
    roles = [...roles.slice(0, idx), updated, ...roles.slice(idx + 1)]
    return HttpResponse.json({ role: updated })
  }),

  http.delete('/v3/roles/:id', ({ params }) => {
    const idx = roles.findIndex(r => r.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '角色不存在' }, { status: 404 })
    roles = [...roles.slice(0, idx), ...roles.slice(idx + 1)]
    return new HttpResponse(null, { status: 204 })
  }),

  // === 项目管理 ===
  http.get('/v3/projects', () => HttpResponse.json({ projects })),

  http.get('/v3/projects/:id', ({ params }) => {
    const project = projects.find(p => p.id === params.id)
    return project
      ? HttpResponse.json({ project })
      : HttpResponse.json({ error: '项目不存在' }, { status: 404 })
  }),

  http.post('/v3/projects', async ({ request }) => {
    const body = (await request.json()) as { project: Partial<Project> }
    const newProject = { id: genId('proj'), ...body.project } as Project
    projects = [...projects, newProject]
    return HttpResponse.json({ project: newProject }, { status: 201 })
  }),

  http.put('/v3/projects/:id', async ({ params, request }) => {
    const body = (await request.json()) as { project: Partial<Project> }
    const idx = projects.findIndex(p => p.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '项目不存在' }, { status: 404 })
    const updated = { ...projects[idx], ...body.project }
    projects = [...projects.slice(0, idx), updated, ...projects.slice(idx + 1)]
    return HttpResponse.json({ project: updated })
  }),

  http.delete('/v3/projects/:id', ({ params }) => {
    const idx = projects.findIndex(p => p.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '项目不存在' }, { status: 404 })
    projects = [...projects.slice(0, idx), ...projects.slice(idx + 1)]
    return new HttpResponse(null, { status: 204 })
  }),

  // === 用户角色分配 ===
  http.put('/v3/roles/:roleId/users/:userId', ({ params }) => {
    const { roleId, userId } = params
    if (!userRoles[userId as string]) userRoles[userId as string] = []
    if (!userRoles[userId as string].includes(roleId as string)) {
      userRoles[userId as string] = [...userRoles[userId as string], roleId as string]
    }
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete('/v3/roles/:roleId/users/:userId', ({ params }) => {
    const { roleId, userId } = params
    if (userRoles[userId as string]) {
      userRoles[userId as string] = userRoles[userId as string].filter(r => r !== roleId)
    }
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/v3/users/:userId/roles', ({ params }) => {
    const roleIds = userRoles[params.userId as string] || []
    const userRoleList = roles.filter(r => roleIds.includes(r.id))
    return HttpResponse.json({ roles: userRoleList })
  }),

  // === 项目用户角色分配 ===
  http.put('/v3/projects/:projectId/users/:userId/roles/:roleId', ({ params }) => {
    const { projectId, userId, roleId } = params
    const existing = projectUserRoles.find(
      pur => pur.project_id === projectId && pur.user_id === userId && pur.role_id === roleId,
    )
    if (!existing) {
      projectUserRoles = [
        ...projectUserRoles,
        {
          project_id: projectId as string,
          user_id: userId as string,
          role_id: roleId as string,
        },
      ]
    }
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete('/v3/projects/:projectId/users/:userId/roles/:roleId', ({ params }) => {
    const { projectId, userId, roleId } = params
    projectUserRoles = projectUserRoles.filter(
      pur => !(pur.project_id === projectId && pur.user_id === userId && pur.role_id === roleId),
    )
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/v3/projects/:projectId/users', ({ params }) => {
    const userIds = projectUserRoles
      .filter(pur => pur.project_id === params.projectId)
      .map(pur => pur.user_id)
    const uniqueUserIds = Array.from(new Set(userIds))
    const projectUsers = users.filter(u => uniqueUserIds.includes(u.id))
    return HttpResponse.json({ users: projectUsers })
  }),
]
