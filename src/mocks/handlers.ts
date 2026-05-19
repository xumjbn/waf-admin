// MSW handlers — 模拟后端 API
// 对照 API_REFERENCE.md 各章节
import { http, HttpResponse } from 'msw'
import { siteHandlers } from './site-handlers'
import { siteProtectHandlers } from './site-protect-handlers'
import { policyHandlers } from './policy-handlers'
import { logHandlers } from './log-handlers'
import { logOpsHandlers } from './log-ops-handlers'
import { instanceHandlers } from './instance-handlers'
import { systemHandlers } from './system-handlers'
import { aclHandlers } from './acl-handlers'
import { reportHandlers } from './report-handlers'
import { settingHandlers } from './setting-handlers'
import { nodeHandlers } from './node-handlers'
import { userHandlers } from './user-handlers'
import { notificationHandlers } from './notification-handlers'
import { findUser, findRole, rolesForUser, MOCK_USERS, MOCK_ROLES, MOCK_PROJECTS } from './identity'

export const handlers = [
  // === 认证 (新版 identity API) ===

  // POST /api/v1/identity/login
  http.post('/api/v1/identity/login', async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string }
    const username = (body.username ?? '').trim()
    const password = (body.password ?? '').trim()
    // eslint-disable-next-line no-console
    console.log('[MSW] /identity/login', { username, lenPwd: password.length })

    const u = findUser(username)
    if (!u || u.password !== password) {
      // eslint-disable-next-line no-console
      console.log('[MSW] login miss', { found: !!u, gotPwd: password, wantPwd: u?.password })
      return HttpResponse.json({ errorcode: 401, description: '用户名或密码错误' }, { status: 401 })
    }
    if (!u.enabled) {
      return HttpResponse.json({ errorcode: 403, description: '该账号已被禁用' }, { status: 403 })
    }

    return HttpResponse.json({
      access_token: `mock-access-${username}-${Date.now()}`,
      refresh_token: `mock-refresh-${username}-${Date.now()}`,
      expires_in: 900,
    })
  }),

  // GET /api/v1/identity/me
  http.get('/api/v1/identity/me', ({ request }) => {
    const auth = request.headers.get('Authorization') ?? ''
    const tokenMatch = auth.match(/mock-access-(\w+)-/)
    const username = tokenMatch?.[1] ?? 'admin'
    const u = findUser(username)

    if (!u) {
      return HttpResponse.json({ errorcode: 401, description: 'invalid token' }, { status: 401 })
    }

    return HttpResponse.json({
      id: u.id,
      username: u.username,
      real_name: u.real_name,
      email: u.email,
      project: u.project,
      roles: rolesForUser(username),
    })
  }),

  // POST /api/v1/identity/logout
  http.post('/api/v1/identity/logout', () => HttpResponse.json({ message: 'ok' })),

  // GET /api/v1/identity/users  —— 用户中心列表
  http.get('/api/v1/identity/users', () => {
    return HttpResponse.json({
      items: MOCK_USERS.map(u => {
        const r = findRole(u.role_id)
        return {
          id: u.id,
          username: u.username,
          email: u.email,
          real_name: u.real_name,
          enabled: u.enabled,
          project: u.project,
          last_login: u.last_login,
          avatar: u.avatar,
          role: r ? { id: r.id, key: r.key, name: r.name, color: r.color } : null,
        }
      }),
      total: MOCK_USERS.length,
    })
  }),

  // GET /api/v1/identity/roles  —— 角色列表
  http.get('/api/v1/identity/roles', () => {
    const counts = MOCK_USERS.reduce<Record<string, number>>((acc, u) => {
      acc[u.role_id] = (acc[u.role_id] ?? 0) + 1
      return acc
    }, {})
    return HttpResponse.json({
      items: MOCK_ROLES.map(r => ({ ...r, user_count: counts[r.id] ?? 0 })),
      total: MOCK_ROLES.length,
    })
  }),

  // GET /api/v1/identity/projects  —— 项目列表
  http.get('/api/v1/identity/projects', () => {
    return HttpResponse.json({ items: MOCK_PROJECTS, total: MOCK_PROJECTS.length })
  }),

  // === 认证 (旧版兼容) ===

  // POST /v3/auth/tokens
  http.post('/v3/auth/tokens', async ({ request }) => {
    const body = (await request.json()) as {
      auth: { identity: { password: { user: { name: string; password: string } } } }
    }
    const { name, password } = body.auth.identity.password.user

    const u = findUser(name)
    if (!u || u.password !== password) {
      return HttpResponse.json(
        { error: { message: '用户名或密码错误', code: 401, title: 'Unauthorized' } },
        { status: 401 },
      )
    }

    return HttpResponse.json(
      {
        token: {
          user: { id: u.id, name, domain: { id: 'default', name: 'Default' } },
          roles: rolesForUser(name),
          project: { id: 'proj-1', name: 'admin', domain: { id: 'default', name: 'Default' } },
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          issued_at: new Date().toISOString(),
        },
      },
      {
        status: 201,
        headers: { 'X-Subject-Token': `mock-token-${name}-${Date.now()}` },
      },
    )
  }),

  // POST /v3/keystone/user_logout
  http.post('/v3/keystone/user_logout', () => HttpResponse.json({ message: 'ok' })),

  // === §10 系统管理 ===

  // GET /v1/system/running_mode
  http.get('/v1/system/running_mode', () => HttpResponse.json({ running_mode: 'standalone' })),

  // GET /v1/system/managertime
  http.get('/v1/system/managertime', () => HttpResponse.json(new Date().toISOString())),

  // GET /v1/system/alltime
  http.get('/v1/system/alltime', () => HttpResponse.json({ manager: new Date().toISOString() })),

  // PUT /v1/system/changetime
  http.put('/v1/system/changetime', () => HttpResponse.json({ message: 'ok' })),

  // === §1.1 站点统计 ===

  // GET /v1/site_stats
  http.get('/v1/site_stats', () => HttpResponse.json({ on: 12, off: 3, idle: 2 })),

  // === §4 攻击日志/统计 ===

  // GET /v1/attack_stats/statistic_info
  http.get('/v1/attack_stats/statistic_info', () => {
    const now = Date.now()
    const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
    const pick = <T>(arr: readonly T[]): T => arr[rand(0, arr.length - 1)]

    const severities = ['critical', 'high', 'medium', 'low', 'info'] as const
    const actions = ['block', 'alert', 'pass'] as const
    const hosts = [
      'www.example.com',
      'api.example.com',
      'admin.example.com',
      'cdn.example.com',
      'mail.example.com',
    ]
    const dstIps = ['192.168.1.100', '192.168.1.101', '10.0.0.50']
    const srcLocations: Array<{ ip: string; coord: [number, number] }> = [
      // 国内
      { ip: '203.0.113.45', coord: [39.9, 116.4] }, // 北京
      { ip: '203.0.113.78', coord: [31.2, 121.5] }, // 上海
      { ip: '198.51.100.12', coord: [23.1, 113.3] }, // 广州
      { ip: '198.51.100.34', coord: [22.5, 114.1] }, // 深圳
      { ip: '198.51.100.56', coord: [30.7, 104.1] }, // 成都
      { ip: '203.0.113.91', coord: [34.3, 108.9] }, // 西安
      // 国外
      { ip: '192.0.2.10', coord: [40.7, -74.0] }, // 纽约
      { ip: '192.0.2.22', coord: [37.8, -122.4] }, // 旧金山
      { ip: '192.0.2.33', coord: [51.5, -0.1] }, // 伦敦
      { ip: '192.0.2.44', coord: [48.9, 2.4] }, // 巴黎
      { ip: '192.0.2.55', coord: [35.7, 139.7] }, // 东京
      { ip: '192.0.2.66', coord: [37.6, 127.0] }, // 首尔
      { ip: '192.0.2.77', coord: [55.8, 37.6] }, // 莫斯科
      { ip: '192.0.2.88', coord: [52.5, 13.4] }, // 柏林
    ]

    // 上海坐标 — 被保护的服务器所在地
    const dstCoord: [number, number] = [31.2, 121.5]

    const statistic_info = Array.from({ length: 20 }, () => {
      const src = pick(srcLocations)
      return {
        datetime: new Date(now - rand(0, 60000)).toISOString(),
        src_ip: src.ip,
        dst_ip: pick(dstIps),
        host: pick(hosts),
        action: pick(actions),
        severity: pick(severities),
        src_geo_coord: src.coord,
        dst_geo_coord: dstCoord,
      }
    })

    return HttpResponse.json({ statistic_info })
  }),

  // === §12 攻击监控统计 ===

  // GET /v1/monitor/attack/severity
  http.get('/v1/monitor/attack/severity', () =>
    HttpResponse.json({ critical: 23, high: 87, medium: 245, low: 512, info: 1024 }),
  ),

  // GET /v1/monitor/attack/src-ips-top
  http.get('/v1/monitor/attack/src-ips-top', () =>
    HttpResponse.json([
      { src_ip: '203.0.113.45', count: 342 },
      { src_ip: '198.51.100.22', count: 218 },
      { src_ip: '192.0.2.88', count: 156 },
      { src_ip: '100.64.0.1', count: 89 },
      { src_ip: '172.16.0.55', count: 45 },
    ]),
  ),

  // GET /v1/statistic_trend/top_sites_info
  http.get('/v1/statistic_trend/top_sites_info', () =>
    HttpResponse.json([
      ['www.example.com', 523],
      ['api.example.com', 312],
      ['admin.example.com', 178],
      ['cdn.example.com', 95],
      ['mail.example.com', 42],
    ]),
  ),

  // === §5 流量监控 ===

  // GET /v1/monitor/flow/top10app
  http.get('/v1/monitor/flow/top10app', () =>
    HttpResponse.json([
      { name: 'HTTP', value: 1258000 },
      { name: 'HTTPS', value: 985000 },
      { name: 'DNS', value: 342000 },
      { name: 'SSH', value: 125000 },
      { name: 'FTP', value: 78000 },
    ]),
  ),

  // GET /v1/monitor/flow/top10ip
  http.get('/v1/monitor/flow/top10ip', () =>
    HttpResponse.json([
      { name: '192.168.1.100', value: 2450000 },
      { name: '10.0.0.50', value: 1820000 },
      { name: '172.16.0.10', value: 956000 },
    ]),
  ),

  // GET /v1/monitor/flow/top10app/:app
  http.get('/v1/monitor/flow/top10app/:app', ({ params }) =>
    HttpResponse.json({ app: params.app, detail: 'mock detail' }),
  ),

  // GET /v1/monitor/flow/top10ip/:ip
  http.get('/v1/monitor/flow/top10ip/:ip', ({ params }) =>
    HttpResponse.json({ ip: params.ip, detail: 'mock detail' }),
  ),

  // === §11 系统监控 ===

  // GET /v1/sys_monitor/system_resource
  http.get('/v1/sys_monitor/system_resource', () =>
    HttpResponse.json({
      manager: {
        cpu_percent: 35,
        memory_percent: 62,
        memory_total: '16 GB',
        disk_percent: 48,
        disk_total: '500 GB',
        net_connections: 1247,
        network_io: '125 MB/s',
      },
      instance: [
        {
          'inst-001': {
            cpu_percent: 42,
            memory_percent: 55,
            memory_total: '8 GB',
            disk_percent: 38,
            disk_total: '256 GB',
            net_connections: 856,
            network_io: '78 MB/s',
          },
        },
      ],
    }),
  ),

  // GET /v1/sys_monitor/nic_state
  http.get('/v1/sys_monitor/nic_state', () =>
    HttpResponse.json({
      manager: [
        { name: 'eth0', state: 'up', addresses: [{ ip: '192.168.1.10' }] },
        { name: 'eth1', state: 'up', addresses: [{ ip: '10.0.0.10' }] },
      ],
      instances: {
        'inst-001': [
          { name: 'eth0', state: 'up', addresses: [{ ip: '192.168.1.20' }] },
          { name: 'eth1', state: 'down', addresses: [] },
        ],
      },
    }),
  ),

  // === §12 通用监控 ===

  // GET /v1/monitor/realtime
  http.get('/v1/monitor/realtime', () => HttpResponse.json({ data: [] })),

  // GET /v1/monitor/history
  http.get('/v1/monitor/history', () => HttpResponse.json({ data: [] })),

  // GET /v1/monitor/metricspec
  http.get('/v1/monitor/metricspec', () => HttpResponse.json([])),

  // === §15 服务统计 ===

  // GET /v1/service-statistics
  http.get('/v1/service-statistics', () =>
    HttpResponse.json({ total_requests: 125847, active_connections: 342 }),
  ),

  // === 站点管理和防护策略模块 ===
  ...siteHandlers,
  ...siteProtectHandlers,
  ...policyHandlers,

  // === 日志中心模块 ===
  ...logHandlers,
  ...logOpsHandlers,

  // === 实例 防护实例模块 ===
  ...instanceHandlers,

  // === 系统管理模块 ===
  ...systemHandlers,

  // === ACL 访问控制模块 ===
  ...aclHandlers,

  // === 报表模块 ===
  ...reportHandlers,

  // === 设置模块 ===
  ...settingHandlers,

  // === 节点管理模块 ===
  ...nodeHandlers,

  // === 用户管理模块 ===
  ...userHandlers,

  // === 通知模块 ===
  ...notificationHandlers,
]
