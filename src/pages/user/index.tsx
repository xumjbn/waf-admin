import { useState } from 'react'
import { Card, Icon, Tag, Button, Tabs } from '@/components/ui'
import { hexA } from '@/components/charts/canvasUtils'

type TabKey = 'users' | 'roles' | 'projects'

export default function UsersPage() {
  const [tab, setTab] = useState<TabKey>('users')
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
          <Button variant="pri">
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

      {tab === 'users' && <UsersList />}
      {tab === 'roles' && <RolesGrid />}
      {tab === 'projects' && <ProjectsList />}
    </>
  )
}

function UsersList() {
  const users = [
    { n: 'admin', e: 'admin@cloudwall.local', r: '系统管理员', p: '全部', t: '2026-05-17 15:30', on: true, ico: 'A' },
    { n: 'zhangsan', e: 'zhangsan@example.com', r: '审计员', p: '默认', t: '2026-05-17 14:22', on: true, ico: 'Z' },
    { n: 'lisi', e: 'lisi@example.com', r: '操作员', p: '项目 A', t: '2026-05-16 09:15', on: false, ico: 'L' },
    { n: 'wangwu', e: 'wangwu@example.com', r: '操作员', p: '项目 B', t: '2026-05-15 18:42', on: true, ico: 'W' },
    { n: 'security', e: 'sec-team@example.com', r: '安全分析师', p: '全部', t: '2026-05-17 11:08', on: true, ico: 'S' },
  ]
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
          {users.map(u => (
            <tr key={u.n}>
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
                  {u.ico}
                </span>
                <strong>{u.n}</strong>
              </td>
              <td className="mono fs-11 muted">{u.e}</td>
              <td>
                <Tag
                  kind={
                    u.r === '系统管理员' ? 'danger' : u.r === '安全分析师' ? 'pink' : 'info'
                  }
                >
                  {u.r}
                </Tag>
              </td>
              <td>{u.p}</td>
              <td className="mono fs-11">{u.t}</td>
              <td>
                <Tag kind={u.on ? 'ok' : 'def'}>
                  <span className="dot" />
                  {u.on ? '启用' : '禁用'}
                </Tag>
              </td>
              <td className="fs-12">
                <span className="tbl-link">编辑</span> · <span className="tbl-link">角色</span> ·{' '}
                <span className="tbl-link">重置密码</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function RolesGrid() {
  const roles = [
    { n: '系统管理员', d: '全部资源 + 全部操作', p: '*', u: 1, c: '#ef4444' },
    { n: '安全分析师', d: '查看 + 审计 + 告警处置', p: '安全总览, 日志中心, 报表', u: 2, c: '#ec4899' },
    { n: '审计员', d: '只读 + 报表导出', p: '监控总览, 日志, 报表', u: 2, c: '#22d3ee' },
    { n: '操作员', d: '业务管理 + 规则配置', p: '站点, 防护策略, 实例', u: 3, c: '#a855f7' },
    { n: '只读', d: '查看权限', p: '所有页面 (只读)', u: 4, c: '#10b981' },
    { n: '自定义角色', d: '按需组合', p: '细粒度', u: 0, c: '#f59e0b' },
  ]
  return (
    <div className="row r-3 gap-3">
      {roles.map(r => (
        <div key={r.n} className="card" style={{ padding: 18 }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: hexA(r.c, 0.1),
                color: r.c,
                border: '1px solid ' + r.c,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Icon name="lock" size={18} />
            </div>
            <div>
              <div className="fw-700 text-0 fs-14">{r.n}</div>
              <div className="muted fs-11">{r.u} 个用户</div>
            </div>
          </div>
          <div className="fs-12 mb-2">{r.d}</div>
          <div className="muted fs-11 mb-3">{r.p}</div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              <Icon name="edit" size={11} className="ico" />
              编辑权限
            </Button>
          </div>
        </div>
      ))}
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
          <tr>
            <td className="fw-700">默认项目</td>
            <td className="muted fs-12">系统默认 · 全局可见</td>
            <td className="mono">8</td>
            <td className="mono">6</td>
            <td className="mono">5</td>
            <td>2026-01-01</td>
            <td>
              <span className="tbl-link">编辑</span>
            </td>
          </tr>
          <tr>
            <td className="fw-700">项目 A — 主业务</td>
            <td className="muted fs-12">官网 + API</td>
            <td className="mono">3</td>
            <td className="mono">4</td>
            <td className="mono">3</td>
            <td>2026-03-10</td>
            <td>
              <span className="tbl-link">编辑</span> · <span className="tbl-link">删除</span>
            </td>
          </tr>
          <tr>
            <td className="fw-700">项目 B — 支付</td>
            <td className="muted fs-12">独立合规环境</td>
            <td className="mono">1</td>
            <td className="mono">2</td>
            <td className="mono">2</td>
            <td>2026-05-01</td>
            <td>
              <span className="tbl-link">编辑</span> · <span className="tbl-link">删除</span>
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  )
}
