import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Card, Icon, Tag, Button, Tabs, Toggle } from '@/components/ui'
import { hexA } from '@/components/charts/canvasUtils'
import {
  MOCK_USERS,
  MOCK_ROLES,
  MOCK_PROJECTS,
  ALL_MODULES,
  type ModuleKey,
  type MockUser,
  type MockRole,
  type MockProject,
} from '@/mocks/identity'

type TabKey = 'users' | 'roles' | 'projects'

const MODULE_LABEL: Record<ModuleKey, string> = {
  aggregation: '安全总览',
  site: '站点接入',
  policy: '防护配置',
  instance: '防护实例',
  log: '攻击日志',
  acl: '告警中心',
  report: '报表中心',
  user: '用户 & 权限',
  system: '系统设置',
}

// ---------- Modal 基础组件（自研，避免引入 antd） ----------

function Modal({
  open,
  title,
  width = 520,
  onClose,
  footer,
  children,
}: {
  open: boolean
  title: string
  width?: number
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'grid',
        placeItems: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width,
          maxWidth: '92vw',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,.4)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="card-hd" style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-2)' }}>
          <div className="flex items-center justify-between">
            <div className="fw-700 fs-14">{title}</div>
            <span style={{ cursor: 'pointer' }} onClick={onClose}>
              <Icon name="close-x" size={14} />
            </span>
          </div>
        </div>
        <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && (
          <div
            className="flex justify-end gap-2"
            style={{ padding: '12px 18px', borderTop: '1px solid var(--line-2)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- Page ----------

export default function UsersPage() {
  const [tab, setTab] = useState<TabKey>('users')
  const [users, setUsers] = useState<MockUser[]>(MOCK_USERS)
  const [roles, setRoles] = useState<MockRole[]>(MOCK_ROLES)
  const [projects, setProjects] = useState<MockProject[]>(MOCK_PROJECTS)

  const [newUserOpen, setNewUserOpen] = useState(false)
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [editRole, setEditRole] = useState<MockRole | null>(null)
  const [editProject, setEditProject] = useState<MockProject | null>(null)
  const [editUser, setEditUser] = useState<MockUser | null>(null)

  return (
    <>
      <div className="page-hd">
        <div>
          <h1>
            <span className="ord">NW · 10</span>
            用户 & 权限
          </h1>
          <p>多租户 · RBAC · 多项目隔离 · 审计</p>
        </div>
        <div className="actions">
          {tab === 'projects' ? (
            <Button variant="pri" onClick={() => setNewProjectOpen(true)}>
              <Icon name="plus" size={13} className="ico" />
              新增项目
            </Button>
          ) : (
            <Button variant="pri" onClick={() => setNewUserOpen(true)}>
              <Icon name="plus" size={13} className="ico" />
              新增用户
            </Button>
          )}
        </div>
      </div>

      <Tabs
        tabs={[
          { value: 'users', label: '用户列表', ico: 'users' },
          { value: 'roles', label: '角色管理', ico: 'lock' },
          { value: 'projects', label: '项目', ico: 'project' },
        ]}
        value={tab}
        onChange={v => setTab(v as TabKey)}
      />

      {tab === 'users' && (
        <UsersList
          users={users}
          roles={roles}
          onToggle={id =>
            setUsers(prev => prev.map(u => (u.id === id ? { ...u, enabled: !u.enabled } : u)))
          }
          onEdit={setEditUser}
          onDelete={id => setUsers(prev => prev.filter(u => u.id !== id))}
        />
      )}
      {tab === 'roles' && <RolesGrid roles={roles} users={users} onEdit={setEditRole} />}
      {tab === 'projects' && <ProjectsList projects={projects} onEdit={setEditProject} onDelete={id => setProjects(p => p.filter(x => x.id !== id))} />}

      <NewUserModal
        open={newUserOpen}
        roles={roles}
        projects={projects}
        onClose={() => setNewUserOpen(false)}
        onSubmit={u => {
          setUsers(prev => [...prev, u])
          setNewUserOpen(false)
        }}
      />

      <EditUserModal
        user={editUser}
        roles={roles}
        projects={projects}
        onClose={() => setEditUser(null)}
        onSubmit={u => {
          setUsers(prev => prev.map(x => (x.id === u.id ? u : x)))
          setEditUser(null)
        }}
      />

      <EditRoleModal
        role={editRole}
        onClose={() => setEditRole(null)}
        onSubmit={r => {
          setRoles(prev => prev.map(x => (x.id === r.id ? r : x)))
          setEditRole(null)
        }}
      />

      <EditProjectModal
        project={editProject}
        onClose={() => setEditProject(null)}
        onSubmit={p => {
          setProjects(prev => prev.map(x => (x.id === p.id ? p : x)))
          setEditProject(null)
        }}
      />

      <NewProjectModal
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onSubmit={p => {
          setProjects(prev => [...prev, p])
          setNewProjectOpen(false)
        }}
      />
    </>
  )
}

// ---------- Users ----------

function UsersList({
  users,
  roles,
  onToggle,
  onEdit,
  onDelete,
}: {
  users: MockUser[]
  roles: MockRole[]
  onToggle: (id: string) => void
  onEdit: (u: MockUser) => void
  onDelete: (id: string) => void
}) {
  return (
    <Card bodyClass="np">
      <table>
        <thead>
          <tr>
            <th>用户</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>项目</th>
            <th>最近登录</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => {
            const role = roles.find(r => r.id === u.role_id)
            const roleColor = role?.color ?? '#a855f7'
            return (
              <tr key={u.id}>
                <td className="flex items-center gap-2">
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      fontSize: 11,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: '50%',
                      background: 'var(--grad-brand)',
                      color: '#fff',
                      fontWeight: 700,
                    }}
                  >
                    {u.avatar}
                  </span>
                  <strong>{u.username}</strong>
                </td>
                <td className="mono fs-11 muted">{u.email}</td>
                <td>
                  <Tag
                    kind={role?.key === 'system_admin' ? 'danger' : role?.key === 'security_analyst' ? 'pink' : 'info'}
                    style={{ borderColor: roleColor, color: roleColor }}
                  >
                    {role?.name ?? '未分配'}
                  </Tag>
                </td>
                <td>{u.project}</td>
                <td className="mono fs-11">{u.last_login}</td>
                <td>
                  <Tag kind={u.enabled ? 'ok' : 'def'}>
                    <span className="dot" />
                    {u.enabled ? '启用' : '禁用'}
                  </Tag>
                </td>
                <td className="fs-12">
                  <span className="tbl-link" style={{ cursor: 'pointer' }} onClick={() => onEdit(u)}>
                    编辑
                  </span>{' '}
                  ·{' '}
                  <span className="tbl-link" style={{ cursor: 'pointer' }} onClick={() => onToggle(u.id)}>
                    {u.enabled ? '禁用' : '启用'}
                  </span>{' '}
                  ·{' '}
                  <span
                    className="tbl-link"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (window.confirm(`重置 ${u.username} 的密码？\n\n新密码将随机生成并发送到 ${u.email}`)) {
                        window.alert('已重置 · 临时密码：Temp-' + Math.random().toString(36).slice(2, 8))
                      }
                    }}
                  >
                    重置密码
                  </span>
                  {u.username !== 'admin' && (
                    <>
                      {' '}·{' '}
                      <span
                        className="tbl-link t-danger"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          if (window.confirm(`确认删除用户 ${u.username}？\n此操作不可恢复。`)) {
                            onDelete(u.id)
                          }
                        }}
                      >
                        删除
                      </span>
                    </>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Card>
  )
}

function NewUserModal({
  open,
  roles,
  projects,
  onClose,
  onSubmit,
}: {
  open: boolean
  roles: MockRole[]
  projects: MockProject[]
  onClose: () => void
  onSubmit: (u: MockUser) => void
}) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    real_name: '',
    role_id: 'role-operator',
    project: '默认',
    password: '',
  })
  const upd = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }))

  const submit = () => {
    if (!form.username || !form.email) {
      window.alert('用户名和邮箱必填')
      return
    }
    onSubmit({
      id: `user-${Date.now()}`,
      username: form.username,
      password: form.password || form.username,
      email: form.email,
      real_name: form.real_name || form.username,
      role_id: form.role_id,
      project: form.project,
      enabled: true,
      last_login: '—',
      avatar: form.username.slice(0, 1).toUpperCase(),
    })
    setForm({ username: '', email: '', real_name: '', role_id: 'role-operator', project: '默认', password: '' })
  }

  return (
    <Modal
      open={open}
      title="新增用户"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button variant="pri" onClick={submit}>创建</Button>
        </>
      }
    >
      <div className="stack">
        <div className="field">
          <label>用户名 *</label>
          <input className="input" value={form.username} onChange={e => upd('username', e.target.value)} placeholder="lowercase，登录名" />
        </div>
        <div className="field">
          <label>邮箱 *</label>
          <input className="input" type="email" value={form.email} onChange={e => upd('email', e.target.value)} />
        </div>
        <div className="field">
          <label>真实姓名</label>
          <input className="input" value={form.real_name} onChange={e => upd('real_name', e.target.value)} placeholder="可选" />
        </div>
        <div className="field">
          <label>角色</label>
          <select className="select" value={form.role_id} onChange={e => upd('role_id', e.target.value)}>
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name} — {r.description}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>项目</label>
          <select className="select" value={form.project} onChange={e => upd('project', e.target.value)}>
            <option value="全部">全部</option>
            {projects.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>初始密码</label>
          <input className="input" type="text" value={form.password} onChange={e => upd('password', e.target.value)} placeholder="留空则使用用户名" />
          <div className="muted fs-11 mt-1">首次登录后将强制修改</div>
        </div>
      </div>
    </Modal>
  )
}

function EditUserModal({
  user,
  roles,
  projects,
  onClose,
  onSubmit,
}: {
  user: MockUser | null
  roles: MockRole[]
  projects: MockProject[]
  onClose: () => void
  onSubmit: (u: MockUser) => void
}) {
  const [draft, setDraft] = useState<MockUser | null>(null)
  useEffect(() => {
    setDraft(user ? { ...user } : null)
  }, [user])
  if (!user || !draft) return null
  const upd = <K extends keyof MockUser>(k: K, v: MockUser[K]) => setDraft(d => (d ? { ...d, [k]: v } : d))

  return (
    <Modal
      open={!!user}
      title={`编辑用户 · ${user.username}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button variant="pri" onClick={() => onSubmit(draft)}>保存</Button>
        </>
      }
    >
      <div className="stack">
        <div className="field">
          <label>邮箱</label>
          <input className="input" value={draft.email} onChange={e => upd('email', e.target.value)} />
        </div>
        <div className="field">
          <label>真实姓名</label>
          <input className="input" value={draft.real_name} onChange={e => upd('real_name', e.target.value)} />
        </div>
        <div className="field">
          <label>角色</label>
          <select className="select" value={draft.role_id} onChange={e => upd('role_id', e.target.value)}>
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>项目</label>
          <select className="select" value={draft.project} onChange={e => upd('project', e.target.value)}>
            <option value="全部">全部</option>
            {projects.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>账号状态</label>
          <div className="flex items-center gap-2">
            <Toggle on={draft.enabled} onChange={v => upd('enabled', v)} />
            <span className="muted fs-12">{draft.enabled ? '已启用 · 允许登录' : '已禁用 · 拒绝登录'}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ---------- Roles ----------

function RolesGrid({
  roles,
  users,
  onEdit,
}: {
  roles: MockRole[]
  users: MockUser[]
  onEdit: (r: MockRole) => void
}) {
  const userCount = useMemo(() => {
    return users.reduce<Record<string, number>>((acc, u) => {
      acc[u.role_id] = (acc[u.role_id] ?? 0) + 1
      return acc
    }, {})
  }, [users])

  return (
    <div className="row r-3 gap-3">
      {roles.map(r => (
        <RoleCard key={r.id} role={r} userCount={userCount[r.id] ?? 0} onEdit={() => onEdit(r)} />
      ))}
    </div>
  )
}

function RoleCard({ role, userCount, onEdit }: { role: MockRole; userCount: number; onEdit: () => void }) {
  const modulesText =
    role.modules === '*'
      ? role.readonly ? '所有页面（只读）' : '全部资源 · 全部操作'
      : role.modules.length === 0
        ? '细粒度（未配置）'
        : role.modules.map(m => MODULE_LABEL[m as ModuleKey] ?? m).join(' · ')

  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="flex items-center gap-3 mb-3">
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: hexA(role.color, 0.1),
            color: role.color,
            border: '1px solid ' + role.color,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon name="lock" size={18} />
        </div>
        <div>
          <div className="fw-700 text-0 fs-14">{role.name}</div>
          <div className="muted fs-11">{userCount} 个用户</div>
        </div>
      </div>
      <div className="fs-12 mb-2">{role.description}</div>
      <div className="muted fs-11 mb-3" style={{ minHeight: 28 }}>{modulesText}</div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Icon name="edit" size={11} className="ico" />
          编辑权限
        </Button>
      </div>
    </div>
  )
}

function EditRoleModal({
  role,
  onClose,
  onSubmit,
}: {
  role: MockRole | null
  onClose: () => void
  onSubmit: (r: MockRole) => void
}) {
  const [draft, setDraft] = useState<MockRole | null>(null)
  useEffect(() => {
    setDraft(role ? { ...role } : null)
  }, [role])
  if (!role || !draft) return null

  const isAll = draft.modules === '*'
  const moduleSet = new Set<ModuleKey>(Array.isArray(draft.modules) ? (draft.modules as ModuleKey[]) : [])

  const setAll = (v: boolean) => {
    setDraft(d => (d ? { ...d, modules: v ? '*' : [] } : d))
  }
  const toggleModule = (m: ModuleKey) => {
    if (isAll) return
    setDraft(d => {
      if (!d) return d
      const next = new Set(moduleSet)
      if (next.has(m)) next.delete(m); else next.add(m)
      return { ...d, modules: Array.from(next) }
    })
  }

  return (
    <Modal
      open={!!role}
      title={`编辑权限 · ${role.name}`}
      width={620}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button variant="pri" onClick={() => onSubmit(draft)}>保存</Button>
        </>
      }
    >
      <div className="stack">
        <div className="field">
          <label>角色名称</label>
          <input className="input" value={draft.name} onChange={e => setDraft(d => (d ? { ...d, name: e.target.value } : d))} />
        </div>
        <div className="field">
          <label>描述</label>
          <input className="input" value={draft.description} onChange={e => setDraft(d => (d ? { ...d, description: e.target.value } : d))} />
        </div>
        <div className="field">
          <label>访问范围</label>
          <div className="flex items-center gap-2 mb-2">
            <Toggle on={isAll} onChange={setAll} />
            <span className="fs-12">全部模块</span>
            <span className="muted fs-11">（开启后忽略下方勾选）</span>
          </div>
          <div
            className="row r-3 gap-2"
            style={{ opacity: isAll ? 0.4 : 1, pointerEvents: isAll ? 'none' : 'auto' }}
          >
            {ALL_MODULES.map(m => {
              const on = moduleSet.has(m)
              return (
                <label
                  key={m}
                  className="flex items-center gap-2"
                  style={{
                    padding: '8px 10px',
                    border: '1px solid var(--line-2)',
                    borderRadius: 8,
                    background: on ? 'rgba(168,85,247,.08)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <input type="checkbox" checked={on} onChange={() => toggleModule(m)} />
                  <span className="fs-12">{MODULE_LABEL[m]}</span>
                  <span className="muted fs-11 mono" style={{ marginLeft: 'auto' }}>{m}</span>
                </label>
              )
            })}
          </div>
        </div>
        <div className="field">
          <label>只读模式</label>
          <div className="flex items-center gap-2">
            <Toggle on={!!draft.readonly} onChange={v => setDraft(d => (d ? { ...d, readonly: v } : d))} />
            <span className="muted fs-12">开启后允许查看但禁止编辑/删除</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ---------- Projects ----------

function ProjectsList({
  projects,
  onEdit,
  onDelete,
}: {
  projects: MockProject[]
  onEdit: (p: MockProject) => void
  onDelete: (id: string) => void
}) {
  return (
    <Card bodyClass="np">
      <table>
        <thead>
          <tr>
            <th>项目</th>
            <th>描述</th>
            <th>站点</th>
            <th>实例</th>
            <th>成员</th>
            <th>创建</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(p => (
            <tr key={p.id}>
              <td className="fw-700">{p.name}</td>
              <td className="muted fs-12">{p.description}</td>
              <td className="mono">{p.sites}</td>
              <td className="mono">{p.instances}</td>
              <td className="mono">{p.members}</td>
              <td>{p.created_at}</td>
              <td>
                <span className="tbl-link" style={{ cursor: 'pointer' }} onClick={() => onEdit(p)}>
                  编辑
                </span>
                {p.id !== 'proj-default' && (
                  <>
                    {' '}·{' '}
                    <span
                      className="tbl-link"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (window.confirm(`确认删除项目「${p.name}」？此操作不可恢复。`)) onDelete(p.id)
                      }}
                    >
                      删除
                    </span>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function NewProjectModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (p: MockProject) => void
}) {
  const [form, setForm] = useState({
    name: '',
    description: '',
  })
  const upd = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }))

  const submit = () => {
    if (!form.name.trim()) {
      window.alert('项目名称必填')
      return
    }
    onSubmit({
      id: `proj-${Date.now()}`,
      name: form.name.trim(),
      description: form.description.trim(),
      sites: 0,
      instances: 0,
      members: 0,
      created_at: new Date().toISOString().slice(0, 10),
    })
    setForm({ name: '', description: '' })
  }

  return (
    <Modal
      open={open}
      title="新增项目"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button variant="pri" onClick={submit}>创建</Button>
        </>
      }
    >
      <div className="stack">
        <div className="field">
          <label>项目名称 *</label>
          <input
            className="input"
            value={form.name}
            onChange={e => upd('name', e.target.value)}
            placeholder="如：项目 C — 风控"
          />
        </div>
        <div className="field">
          <label>描述</label>
          <input
            className="input"
            value={form.description}
            onChange={e => upd('description', e.target.value)}
            placeholder="可选"
          />
        </div>
        <div className="muted fs-11">
          创建后可在项目列表里继续编辑站点/实例/成员数等指标。
        </div>
      </div>
    </Modal>
  )
}

function EditProjectModal({
  project,
  onClose,
  onSubmit,
}: {
  project: MockProject | null
  onClose: () => void
  onSubmit: (p: MockProject) => void
}) {
  const [draft, setDraft] = useState<MockProject | null>(null)
  useEffect(() => {
    setDraft(project ? { ...project } : null)
  }, [project])
  if (!project || !draft) return null
  const upd = <K extends keyof MockProject>(k: K, v: MockProject[K]) => setDraft(d => (d ? { ...d, [k]: v } : d))

  return (
    <Modal
      open={!!project}
      title={`编辑项目 · ${project.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button variant="pri" onClick={() => onSubmit(draft)}>保存</Button>
        </>
      }
    >
      <div className="stack">
        <div className="field">
          <label>项目名称</label>
          <input className="input" value={draft.name} onChange={e => upd('name', e.target.value)} />
        </div>
        <div className="field">
          <label>描述</label>
          <input className="input" value={draft.description} onChange={e => upd('description', e.target.value)} />
        </div>
        <div className="row r-3 gap-3">
          <div className="field">
            <label>站点数</label>
            <input type="number" className="input" value={draft.sites} onChange={e => upd('sites', Number(e.target.value) || 0)} />
          </div>
          <div className="field">
            <label>实例数</label>
            <input type="number" className="input" value={draft.instances} onChange={e => upd('instances', Number(e.target.value) || 0)} />
          </div>
          <div className="field">
            <label>成员数</label>
            <input type="number" className="input" value={draft.members} onChange={e => upd('members', Number(e.target.value) || 0)} />
          </div>
        </div>
      </div>
    </Modal>
  )
}
