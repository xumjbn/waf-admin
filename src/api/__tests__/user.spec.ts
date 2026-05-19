import { describe, it, expect, vi, beforeEach } from 'vitest'

// 对照 Keystone v3 API
vi.mock('../request', () => ({
  default: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}))

import * as api from '../user'
import request from '../request'

const mockGet = request.get as ReturnType<typeof vi.fn>
const mockPost = request.post as ReturnType<typeof vi.fn>
const mockPut = request.put as ReturnType<typeof vi.fn>
const mockDelete = request.delete as ReturnType<typeof vi.fn>

describe('user API - 对照 Keystone v3 API', () => {
  beforeEach(() => vi.clearAllMocks())

  // 用户管理
  it('listUsers → GET /v3/users', async () => {
    await api.listUsers()
    expect(mockGet).toHaveBeenCalledWith('/users')
  })

  it('getUser → GET /v3/users/{id}', async () => {
    await api.getUser('u1')
    expect(mockGet).toHaveBeenCalledWith('/users/u1')
  })

  it('createUser → POST /v3/users', async () => {
    const data = { name: 'test', enabled: true, domain_id: 'default' } as Parameters<
      typeof api.createUser
    >[0]
    await api.createUser(data)
    expect(mockPost).toHaveBeenCalledWith('/users', { user: data })
  })

  it('updateUser → PUT /v3/users/{id}', async () => {
    await api.updateUser('u1', { name: 'updated' })
    expect(mockPut).toHaveBeenCalledWith('/users/u1', { user: { name: 'updated' } })
  })

  it('deleteUser → DELETE /v3/users/{id}', async () => {
    await api.deleteUser('u1')
    expect(mockDelete).toHaveBeenCalledWith('/users/u1')
  })

  // 角色管理
  it('listRoles → GET /v3/roles', async () => {
    await api.listRoles()
    expect(mockGet).toHaveBeenCalledWith('/roles')
  })

  it('getRole → GET /v3/roles/{id}', async () => {
    await api.getRole('r1')
    expect(mockGet).toHaveBeenCalledWith('/roles/r1')
  })

  it('createRole → POST /v3/roles', async () => {
    const data = { name: 'test_role' } as Parameters<typeof api.createRole>[0]
    await api.createRole(data)
    expect(mockPost).toHaveBeenCalledWith('/roles', { role: data })
  })

  it('updateRole → PUT /v3/roles/{id}', async () => {
    await api.updateRole('r1', { name: 'updated' })
    expect(mockPut).toHaveBeenCalledWith('/roles/r1', { role: { name: 'updated' } })
  })

  it('deleteRole → DELETE /v3/roles/{id}', async () => {
    await api.deleteRole('r1')
    expect(mockDelete).toHaveBeenCalledWith('/roles/r1')
  })

  // 项目管理
  it('listProjects → GET /v3/projects', async () => {
    await api.listProjects()
    expect(mockGet).toHaveBeenCalledWith('/projects')
  })

  it('getProject → GET /v3/projects/{id}', async () => {
    await api.getProject('p1')
    expect(mockGet).toHaveBeenCalledWith('/projects/p1')
  })

  it('createProject → POST /v3/projects', async () => {
    const data = {
      name: 'test',
      domain_id: 'default',
      enabled: true,
      is_domain: false,
    } as Parameters<typeof api.createProject>[0]
    await api.createProject(data)
    expect(mockPost).toHaveBeenCalledWith('/projects', { project: data })
  })

  it('updateProject → PUT /v3/projects/{id}', async () => {
    await api.updateProject('p1', { name: 'updated' })
    expect(mockPut).toHaveBeenCalledWith('/projects/p1', { project: { name: 'updated' } })
  })

  it('deleteProject → DELETE /v3/projects/{id}', async () => {
    await api.deleteProject('p1')
    expect(mockDelete).toHaveBeenCalledWith('/projects/p1')
  })

  // 用户角色分配
  it('assignUserRole → PUT /v3/roles/{role_id}/users/{user_id}', async () => {
    await api.assignUserRole('r1', 'u1')
    expect(mockPut).toHaveBeenCalledWith('/roles/r1/users/u1')
  })

  it('revokeUserRole → DELETE /v3/roles/{role_id}/users/{user_id}', async () => {
    await api.revokeUserRole('r1', 'u1')
    expect(mockDelete).toHaveBeenCalledWith('/roles/r1/users/u1')
  })

  it('listUserRoles → GET /v3/users/{user_id}/roles', async () => {
    await api.listUserRoles('u1')
    expect(mockGet).toHaveBeenCalledWith('/users/u1/roles')
  })

  // 项目用户角色分配
  it('assignProjectUserRole → PUT /v3/projects/{project_id}/users/{user_id}/roles/{role_id}', async () => {
    await api.assignProjectUserRole('p1', 'u1', 'r1')
    expect(mockPut).toHaveBeenCalledWith('/projects/p1/users/u1/roles/r1')
  })

  it('revokeProjectUserRole → DELETE /v3/projects/{project_id}/users/{user_id}/roles/{role_id}', async () => {
    await api.revokeProjectUserRole('p1', 'u1', 'r1')
    expect(mockDelete).toHaveBeenCalledWith('/projects/p1/users/u1/roles/r1')
  })

  it('listProjectUsers → GET /v3/projects/{project_id}/users', async () => {
    await api.listProjectUsers('p1')
    expect(mockGet).toHaveBeenCalledWith('/projects/p1/users')
  })
})
