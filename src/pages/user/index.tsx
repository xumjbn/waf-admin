import { useMemo, useState } from 'react'
import { Card, Icon, Tag, Button, Tabs } from '@/components/ui'
import { hexA } from '@/components/charts/canvasUtils'
import { MOCK_USERS, MOCK_ROLES, MOCK_PROJECTS, findRole, type MockUser, type MockRole } from '@/mocks/identity'

type TabKey = 'users' | 'roles' | 'projects'

export default function UsersPage() {
  const [tab, setTab] = useState<TabKey>('users')
  const [users, setUsers] = useState<MockUser[]>(MOCK_USERS)

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
          <Button variant="pri" onClick={() => window.alert('新增用户向导待接入')}>
            <Icon name="plus" size={13} className="ico" />
            新增用户
          </Button>
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
          onToggle={id =>
            setUsers(prev => prev.map(u => (u.id === id ? { ...u, enabled: !u.enabled } : u)))
          }
        />
      )}
      {tab === 'roles' && <RolesGrid users={users} />}
      {tab === 'projects' && <ProjectsList />}
    </>
  )
}

function UsersList({ users, onToggle }: { users: MockUser[]; onToggle: (id: string) => void }) {
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
            const role = findRole(u.role_id)
            const roleColor = role?.color ?? '#a855f7'
            return (
              <tr key={u.id}>
                <td className="flex items-center gap-2">
                  <span
                    className="avatar"
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
                  <span
                    className="tbl-link"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.alert(`编辑 ${u.username}：表单待接入`)}
                  >
                    编辑
                  </span>{' '}
                  ·{' '}
                  <span
                    className="tbl-link"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onToggle(u.id)}
                  >
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
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Card>
  )
}

function RolesGrid({ users }: { users: MockUser[] }) {
  const userCount = useMemo(() => {
    return users.reduce<Record<string, number>>((acc, u) => {
      acc[u.role_id] = (acc[u.role_id] ?? 0) + 1
      return acc
    }, {})
  }, [users])

  return (
    <div className="row r-3 gap-3">
      {MOCK_ROLES.map(r => (
        <RoleCard key={r.id} role={r} userCount={userCount[r.id] ?? 0} />
      ))}
    </div>
  )
}

function RoleCard({ role, userCount }: { role: MockRole; userCount: number }) {
  const modulesText =
    role.modules === '*'
      ? role.readonly
        ? '所有页面（只读）'
        : '全部资源 · 全部操作'
      : role.modules.length === 0
        ? '细粒度（未配置）'
        : role.modules.join(' · ')

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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.alert(`编辑角色「${role.name}」权限：编辑器待接入`)}
        >
          <Icon name="edit" size={11} className="ico" />
          编辑权限
        </Button>
      </div>
    </div>
  )
}

function ProjectsList() {
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
          {MOCK_PROJECTS.map(p => (
            <tr key={p.id}>
              <td className="fw-700">{p.name}</td>
              <td className="muted fs-12">{p.description}</td>
              <td className="mono">{p.sites}</td>
              <td className="mono">{p.instances}</td>
              <td className="mono">{p.members}</td>
              <td>{p.created_at}</td>
              <td>
                <span
                  className="tbl-link"
                  style={{ cursor: 'pointer' }}
                  onClick={() => window.alert(`编辑项目「${p.name}」`)}
                >
                  编辑
                </span>
                {p.id !== 'proj-default' && (
                  <>
                    {' '}·{' '}
                    <span
                      className="tbl-link"
                      style={{ cursor: 'pointer' }}
                      onClick={() => window.confirm(`确认删除项目「${p.name}」？`)}
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
