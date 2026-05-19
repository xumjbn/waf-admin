// 身份/权限 mock 数据 —— 严格对齐 UI 设计稿（docs/ui/pages/misc.jsx 用户中心 + 角色卡）
// 模块名跟 layouts/BasicLayout.tsx NAV[].items[].module 一一对应：
//   aggregation / site / policy / instance / log / acl / report / user / system

export type ModuleKey =
  | 'aggregation'
  | 'site'
  | 'policy'
  | 'instance'
  | 'log'
  | 'acl'
  | 'report'
  | 'user'
  | 'system'

export const ALL_MODULES: ModuleKey[] = [
  'aggregation',
  'site',
  'policy',
  'instance',
  'log',
  'acl',
  'report',
  'user',
  'system',
]

// modules='*' 表示全部模块（含未来新增）
export interface MockRole {
  id: string
  key: string          // 后端规范 key，前端 usePermission 用此判定
  name: string         // 显示名（中文）
  description: string
  modules: ModuleKey[] | '*'
  readonly?: boolean
  color: string
}

export interface MockUser {
  id: string
  username: string
  password: string
  email: string
  real_name: string
  role_id: string      // FK -> MockRole.id
  project: string      // 项目隔离（设计稿支持但 mock 简化）
  enabled: boolean
  last_login: string
  avatar: string       // 头像字母
}

export const MOCK_ROLES: MockRole[] = [
  {
    id: 'role-admin',
    key: 'system_admin',
    name: '系统管理员',
    description: '全部资源 + 全部操作',
    modules: '*',
    color: '#ef4444',
  },
  {
    id: 'role-security',
    key: 'security_analyst',
    name: '安全分析师',
    description: '查看 + 审计 + 告警处置',
    modules: ['aggregation', 'log', 'acl', 'report'],
    color: '#ec4899',
  },
  {
    id: 'role-auditor',
    key: 'auditor',
    name: '审计员',
    description: '只读 + 报表导出',
    modules: ['aggregation', 'log', 'report'],
    readonly: true,
    color: '#22d3ee',
  },
  {
    id: 'role-operator',
    key: 'operator',
    name: '操作员',
    description: '业务管理 + 规则配置',
    modules: ['site', 'policy', 'instance'],
    color: '#a855f7',
  },
  {
    id: 'role-readonly',
    key: 'readonly',
    name: '只读',
    description: '查看权限（所有页面只读）',
    modules: '*',
    readonly: true,
    color: '#10b981',
  },
  {
    id: 'role-custom',
    key: 'custom',
    name: '自定义角色',
    description: '按需组合',
    modules: [],
    color: '#f59e0b',
  },
]

export const MOCK_USERS: MockUser[] = [
  {
    id: 'user-admin',
    username: 'admin',
    password: 'admin',
    email: 'admin@cloudwall.local',
    real_name: '管理员',
    role_id: 'role-admin',
    project: '全部',
    enabled: true,
    last_login: '2026-05-17 15:30',
    avatar: 'A',
  },
  {
    id: 'user-zhangsan',
    username: 'zhangsan',
    password: 'zhangsan',
    email: 'zhangsan@example.com',
    real_name: '张三',
    role_id: 'role-auditor',
    project: '默认',
    enabled: true,
    last_login: '2026-05-17 14:22',
    avatar: 'Z',
  },
  {
    id: 'user-lisi',
    username: 'lisi',
    password: 'lisi',
    email: 'lisi@example.com',
    real_name: '李四',
    role_id: 'role-operator',
    project: '项目 A',
    enabled: false,
    last_login: '2026-05-16 09:15',
    avatar: 'L',
  },
  {
    id: 'user-wangwu',
    username: 'wangwu',
    password: 'wangwu',
    email: 'wangwu@example.com',
    real_name: '王五',
    role_id: 'role-operator',
    project: '项目 B',
    enabled: true,
    last_login: '2026-05-15 18:42',
    avatar: 'W',
  },
  {
    id: 'user-security',
    username: 'security',
    password: 'security',
    email: 'sec-team@example.com',
    real_name: '安全运营',
    role_id: 'role-security',
    project: '全部',
    enabled: true,
    last_login: '2026-05-17 11:08',
    avatar: 'S',
  },
]

export const findUser = (u: string) => MOCK_USERS.find(x => x.username === u)
export const findRole = (id: string) => MOCK_ROLES.find(x => x.id === id)

// 给定 username，返回 /me 接口所需的 roles 数组（含 key/name/modules）
export const rolesForUser = (username: string) => {
  const u = findUser(username)
  if (!u) return []
  const r = findRole(u.role_id)
  if (!r) return []
  return [
    {
      id: r.id,
      name: r.key,           // 后端规范 key（兼容旧字段）
      display_name: r.name,
      modules: r.modules,
      readonly: r.readonly ?? false,
    },
  ]
}

export interface MockProject {
  id: string
  name: string
  description: string
  sites: number
  instances: number
  members: number
  created_at: string
}

export const MOCK_PROJECTS: MockProject[] = [
  { id: 'proj-default', name: '默认项目', description: '系统默认 · 全局可见', sites: 8, instances: 6, members: 5, created_at: '2026-01-01' },
  { id: 'proj-a', name: '项目 A — 主业务', description: '官网 + API', sites: 5, instances: 3, members: 3, created_at: '2026-02-10' },
  { id: 'proj-b', name: '项目 B — 内部系统', description: '后台 + ERP', sites: 3, instances: 2, members: 2, created_at: '2026-03-22' },
]
