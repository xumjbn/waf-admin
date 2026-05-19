// MSW handlers — 系统管理模块
// 对照 API_REFERENCE.md §10, §15
import { http, HttpResponse } from 'msw'
import type {
  FailoverSetting,
  SessionTimeout,
  PasswordChangeCycle,
  MailSetting,
  SyslogSetting,
  DnsSetting,
  SnmpSetting,
  JvmSetting,
  License,
  PasswordLengthConfig,
  AttemptLimitConfig,
  AuthHostConfig,
  AuthHost,
  MonitorWarning,
  UpgradeInfo,
  UpgradePackage,
  UpgradableNode,
  InstancePool,
  ServiceWarning,
} from '../api/types/system'

// === 辅助函数 ===

const genId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

// === 内存数据存储 ===

let failoverSetting: FailoverSetting = { enabled: true, timeout: 30, retry_count: 3 }
let runningMode = { running_mode: 'standalone' }
let sessionTimeout: SessionTimeout = { timeout: 900 }
let pswdChangeCycle: PasswordChangeCycle = { cycle: 90 }
let mailSetting: MailSetting = {
  smtp_server: 'smtp.example.com',
  smtp_port: 465,
  username: 'alert',
  from_address: 'alert@example.com',
  use_tls: true,
}
let syslogSetting: SyslogSetting = {
  enabled: true,
  server: '10.0.0.200',
  port: 514,
  protocol: 'udp',
}
let dnsSetting: DnsSetting = { primary_dns: '8.8.8.8', secondary_dns: '8.8.4.4' }
let snmpSetting: SnmpSetting = { enabled: false, community: 'public', version: 'v2c' }
let jvmSetting: JvmSetting = { heap_size: '2048m', gc_type: 'G1' }

let licenses: License[] = [
  {
    id: 'lic-001',
    name: 'WAF基础许可',
    type: 'base',
    status: 'active',
    expires_at: '2026-12-31T23:59:59Z',
  },
  {
    id: 'lic-002',
    name: 'WAF高级防护许可',
    type: 'advanced',
    status: 'active',
    expires_at: '2026-06-30T23:59:59Z',
  },
]

let pwLengthCfg: PasswordLengthConfig = { min_length: 8, max_length: 32 }
let attemptLimitCfg: AttemptLimitConfig = { max_attempts: 5, lockout_duration: 300 }
let authHostCfg: AuthHostConfig = { enabled: true, whitelist_mode: true }

let authHosts: AuthHost[] = [
  { id: 'ah-001', ip: '192.168.1.0/24', description: '内网管理段' },
  { id: 'ah-002', ip: '10.0.0.100', description: '运维跳板机' },
  { id: 'ah-003', ip: '172.16.0.0/16', description: '办公网络' },
]

let instanceWarnings: MonitorWarning[] = [
  { id: 'aw-001', name: 'CPU使用率告警', type: 'cpu', threshold: 80, enabled: true },
  { id: 'aw-002', name: '内存使用率告警', type: 'memory', threshold: 85, enabled: true },
]

let managerWarnings: MonitorWarning[] = [
  { id: 'mw-001', name: '管理节点CPU告警', type: 'cpu', threshold: 75, enabled: true },
  { id: 'mw-002', name: '管理节点磁盘告警', type: 'disk', threshold: 90, enabled: false },
]

const initialNodes: UpgradableNode[] = [
  { id: 'inst-001', name: '实例-Node-01', type: 'instance', current_version: '2.0.0', status: 'idle' },
  { id: 'inst-002', name: '实例-Node-02', type: 'instance', current_version: '2.0.0', status: 'idle' },
  { id: 'inst-003', name: '实例-Node-03', type: 'instance', current_version: '1.9.5', status: 'idle' },
]

const initialPackages: UpgradePackage[] = [
  {
    id: 'pkg-001',
    name: 'manager-2.1.0.tar.gz',
    target: 'manager',
    version: '2.1.0',
    size: 128 * 1024 * 1024,
    uploaded_at: '2026-05-10T08:32:11Z',
    description: '修复多个高危漏洞,优化告警引擎',
  },
  {
    id: 'pkg-002',
    name: 'instance-2.1.0.tar.gz',
    target: 'instance',
    version: '2.1.0',
    size: 96 * 1024 * 1024,
    uploaded_at: '2026-05-10T08:34:50Z',
    description: '新增 HTTP/3 支持',
  },
]

let upgradeInfo: UpgradeInfo = {
  mode: 'cluster',
  manager_version: '2.0.0',
  nodes: initialNodes,
  packages: initialPackages,
}

let instancePools: InstancePool[] = [
  {
    id: 'pool-001',
    flavor: 'standard.medium',
    capacity: 10,
    used: 4,
    reserved: 2,
    description: '常规防护节点池',
  },
  {
    id: 'pool-002',
    flavor: 'standard.large',
    capacity: 6,
    used: 2,
    reserved: 1,
    description: '高负载站点池',
  },
  {
    id: 'pool-003',
    flavor: 'compute.optimized',
    capacity: 4,
    used: 1,
    reserved: 0,
    description: 'DDoS 应急扩容池',
  },
]

let serviceWarnings: ServiceWarning[] = [
  {
    id: 'sw-001',
    name: '站点掉线告警',
    type: 'site_down',
    target: '全部站点',
    threshold: 3,
    enabled: true,
    notify_email: 'ops@example.com',
  },
  {
    id: 'sw-002',
    name: '证书到期前告警',
    type: 'cert_expire',
    target: '全部站点',
    threshold: 30,
    enabled: true,
  },
  {
    id: 'sw-003',
    name: 'CC 攻击告警',
    type: 'cc_attack',
    target: 'www.example.com',
    threshold: 5000,
    enabled: false,
  },
]

export const systemHandlers = [
  // === §10 系统管理 ===

  http.get('/v1/system/dumpcfg', () => HttpResponse.json({ config: {} })),
  http.post('/v1/system/dumpcfg', () => HttpResponse.json({ message: 'ok' })),

  http.get('/v1/system/managertime', () => HttpResponse.json(new Date().toISOString())),
  http.put('/v1/system/changetime', () => HttpResponse.json({ message: 'ok' })),

  http.get('/v1/system/configuration', () => HttpResponse.json({ message: '配置文件' })),
  http.post('/v1/system/configuration', () => HttpResponse.json({ message: '配置恢复成功' })),

  http.post('/v1/system/reset', () => HttpResponse.json({ message: '系统重置中' })),
  http.post('/v1/system/reboot', () => HttpResponse.json({ message: '系统重启中' })),
  http.post('/v1/system/poweroff', () => HttpResponse.json({ message: '系统关机中' })),

  http.get('/v1/system/systemlog_export', () => HttpResponse.json({ message: '日志导出' })),

  http.get('/v1/system/failoversetting', () => HttpResponse.json(failoverSetting)),
  http.put('/v1/system/failoversetting', async ({ request }) => {
    const body = (await request.json()) as Partial<FailoverSetting>
    failoverSetting = { ...failoverSetting, ...body }
    return HttpResponse.json(failoverSetting)
  }),

  http.get('/v1/system/running_mode', () => HttpResponse.json(runningMode)),
  http.put('/v1/system/running_mode', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    runningMode = { ...runningMode, ...body }
    return HttpResponse.json(runningMode)
  }),

  http.get('/v1/system/session_timeout', () => HttpResponse.json(sessionTimeout)),
  http.put('/v1/system/session_timeout', async ({ request }) => {
    const body = (await request.json()) as Partial<SessionTimeout>
    sessionTimeout = { ...sessionTimeout, ...body }
    return HttpResponse.json(sessionTimeout)
  }),

  http.get('/v1/system/pswd_change_cycle', () => HttpResponse.json(pswdChangeCycle)),
  http.put('/v1/system/pswd_change_cycle', async ({ request }) => {
    const body = (await request.json()) as Partial<PasswordChangeCycle>
    pswdChangeCycle = { ...pswdChangeCycle, ...body }
    return HttpResponse.json(pswdChangeCycle)
  }),

  http.get('/v1/system/mail_setting', () => HttpResponse.json(mailSetting)),
  http.put('/v1/system/mail_setting', async ({ request }) => {
    const body = (await request.json()) as Partial<MailSetting>
    mailSetting = { ...mailSetting, ...body }
    return HttpResponse.json(mailSetting)
  }),

  http.get('/v1/system/syslog_setting', () => HttpResponse.json(syslogSetting)),
  http.put('/v1/system/syslog_setting', async ({ request }) => {
    const body = (await request.json()) as Partial<SyslogSetting>
    syslogSetting = { ...syslogSetting, ...body }
    return HttpResponse.json(syslogSetting)
  }),

  http.get('/v1/system/dns_setting', () => HttpResponse.json(dnsSetting)),
  http.put('/v1/system/dns_setting', async ({ request }) => {
    const body = (await request.json()) as Partial<DnsSetting>
    dnsSetting = { ...dnsSetting, ...body }
    return HttpResponse.json(dnsSetting)
  }),

  http.get('/v1/system/snmp', () => HttpResponse.json(snmpSetting)),
  http.put('/v1/system/snmp', async ({ request }) => {
    const body = (await request.json()) as Partial<SnmpSetting>
    snmpSetting = { ...snmpSetting, ...body }
    return HttpResponse.json(snmpSetting)
  }),

  http.get('/v1/system/jvm-setting', () => HttpResponse.json(jvmSetting)),
  http.put('/v1/system/jvm-setting', async ({ request }) => {
    const body = (await request.json()) as Partial<JvmSetting>
    jvmSetting = { ...jvmSetting, ...body }
    return HttpResponse.json(jvmSetting)
  }),

  // === §15 许可证 ===

  http.get('/v1/licenses', () => HttpResponse.json({ licenses })),

  http.get('/v1/licenses/:id', ({ params }) => {
    const lic = licenses.find(l => l.id === params.id)
    return lic
      ? HttpResponse.json({ license: lic })
      : HttpResponse.json({ error: '许可证不存在' }, { status: 404 })
  }),

  http.post('/v1/licenses', async ({ request }) => {
    const body = (await request.json()) as Partial<License>
    const item: License = { id: genId('lic'), ...body } as License
    licenses = [...licenses, item]
    return HttpResponse.json({ license: item }, { status: 201 })
  }),

  http.put('/v1/licenses/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<License>
    const idx = licenses.findIndex(l => l.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '许可证不存在' }, { status: 404 })
    const updated = { ...licenses[idx], ...body }
    licenses = [...licenses.slice(0, idx), updated, ...licenses.slice(idx + 1)]
    return HttpResponse.json({ license: updated })
  }),

  http.delete('/v1/licenses/:id', ({ params }) => {
    const idx = licenses.findIndex(l => l.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '许可证不存在' }, { status: 404 })
    licenses = [...licenses.slice(0, idx), ...licenses.slice(idx + 1)]
    return new HttpResponse(null, { status: 204 })
  }),

  // === §15 安全管理 ===

  http.get('/v1/security_management/pw_length_cfg', () => HttpResponse.json(pwLengthCfg)),
  http.put('/v1/security_management/pw_length_cfg', async ({ request }) => {
    const body = (await request.json()) as Partial<PasswordLengthConfig>
    pwLengthCfg = { ...pwLengthCfg, ...body }
    return HttpResponse.json(pwLengthCfg)
  }),

  http.get('/v1/security_management/attempt_limit_cfg', () => HttpResponse.json(attemptLimitCfg)),
  http.put('/v1/security_management/attempt_limit_cfg', async ({ request }) => {
    const body = (await request.json()) as Partial<AttemptLimitConfig>
    attemptLimitCfg = { ...attemptLimitCfg, ...body }
    return HttpResponse.json(attemptLimitCfg)
  }),

  http.get('/v1/security_management/auth_host_cfg', () => HttpResponse.json(authHostCfg)),
  http.put('/v1/security_management/auth_host_cfg', async ({ request }) => {
    const body = (await request.json()) as Partial<AuthHostConfig>
    authHostCfg = { ...authHostCfg, ...body }
    return HttpResponse.json(authHostCfg)
  }),

  http.get('/v1/security_management/auth_hosts', () =>
    HttpResponse.json({ auth_hosts: authHosts }),
  ),

  http.get('/v1/security_management/auth_hosts/:id', ({ params }) => {
    const host = authHosts.find(h => h.id === params.id)
    return host
      ? HttpResponse.json({ auth_host: host })
      : HttpResponse.json({ error: '可信主机不存在' }, { status: 404 })
  }),

  http.post('/v1/security_management/auth_hosts', async ({ request }) => {
    const body = (await request.json()) as Partial<AuthHost>
    const item: AuthHost = { id: genId('ah'), ...body } as AuthHost
    authHosts = [...authHosts, item]
    return HttpResponse.json({ auth_host: item }, { status: 201 })
  }),

  http.put('/v1/security_management/auth_hosts/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<AuthHost>
    const idx = authHosts.findIndex(h => h.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '可信主机不存在' }, { status: 404 })
    const updated = { ...authHosts[idx], ...body }
    authHosts = [...authHosts.slice(0, idx), updated, ...authHosts.slice(idx + 1)]
    return HttpResponse.json({ auth_host: updated })
  }),

  http.delete('/v1/security_management/auth_hosts/:id', ({ params }) => {
    const idx = authHosts.findIndex(h => h.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '可信主机不存在' }, { status: 404 })
    authHosts = [...authHosts.slice(0, idx), ...authHosts.slice(idx + 1)]
    return new HttpResponse(null, { status: 204 })
  }),

  // === §15 监控告警 - 实例 ===

  http.get('/v1/monitor_warning/instance', () => HttpResponse.json({ warnings: instanceWarnings })),

  http.get('/v1/monitor_warning/instance/:id', ({ params }) => {
    const w = instanceWarnings.find(w => w.id === params.id)
    return w
      ? HttpResponse.json({ warning: w })
      : HttpResponse.json({ error: '实例告警不存在' }, { status: 404 })
  }),

  http.post('/v1/monitor_warning/instance', async ({ request }) => {
    const body = (await request.json()) as Partial<MonitorWarning>
    const item: MonitorWarning = { id: genId('aw'), ...body } as MonitorWarning
    instanceWarnings = [...instanceWarnings, item]
    return HttpResponse.json({ warning: item }, { status: 201 })
  }),

  http.put('/v1/monitor_warning/instance/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<MonitorWarning>
    const idx = instanceWarnings.findIndex(w => w.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '实例告警不存在' }, { status: 404 })
    const updated = { ...instanceWarnings[idx], ...body }
    instanceWarnings = [...instanceWarnings.slice(0, idx), updated, ...instanceWarnings.slice(idx + 1)]
    return HttpResponse.json({ warning: updated })
  }),

  http.delete('/v1/monitor_warning/instance/:id', ({ params }) => {
    const idx = instanceWarnings.findIndex(w => w.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '实例告警不存在' }, { status: 404 })
    instanceWarnings = [...instanceWarnings.slice(0, idx), ...instanceWarnings.slice(idx + 1)]
    return new HttpResponse(null, { status: 204 })
  }),

  // === §15 监控告警 - 管理节点 ===

  http.get('/v1/monitor_warning/manager', () => HttpResponse.json({ warnings: managerWarnings })),

  http.get('/v1/monitor_warning/manager/:id', ({ params }) => {
    const w = managerWarnings.find(w => w.id === params.id)
    return w
      ? HttpResponse.json({ warning: w })
      : HttpResponse.json({ error: '管理节点告警不存在' }, { status: 404 })
  }),

  http.post('/v1/monitor_warning/manager', async ({ request }) => {
    const body = (await request.json()) as Partial<MonitorWarning>
    const item: MonitorWarning = { id: genId('mw'), ...body } as MonitorWarning
    managerWarnings = [...managerWarnings, item]
    return HttpResponse.json({ warning: item }, { status: 201 })
  }),

  http.put('/v1/monitor_warning/manager/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<MonitorWarning>
    const idx = managerWarnings.findIndex(w => w.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '管理节点告警不存在' }, { status: 404 })
    const updated = { ...managerWarnings[idx], ...body }
    managerWarnings = [...managerWarnings.slice(0, idx), updated, ...managerWarnings.slice(idx + 1)]
    return HttpResponse.json({ warning: updated })
  }),

  http.delete('/v1/monitor_warning/manager/:id', ({ params }) => {
    const idx = managerWarnings.findIndex(w => w.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '管理节点告警不存在' }, { status: 404 })
    managerWarnings = [...managerWarnings.slice(0, idx), ...managerWarnings.slice(idx + 1)]
    return new HttpResponse(null, { status: 204 })
  }),

  // === 系统升级 ===

  http.get('/v1/system/upgrade', () => HttpResponse.json(upgradeInfo)),

  http.post('/v1/system/upgrade/upload', async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const target = ((formData.get('target') as string) || 'manager') as UpgradePackage['target']
    const description = (formData.get('description') as string) || undefined
    if (!file) {
      return HttpResponse.json({ error: '缺少升级包文件' }, { status: 400 })
    }
    const pkg: UpgradePackage = {
      id: genId('pkg'),
      name: file.name,
      target,
      version: `${(Math.floor(Math.random() * 5) + 1).toString()}.${Math.floor(
        Math.random() * 10,
      )}.${Math.floor(Math.random() * 20)}`,
      size: file.size,
      uploaded_at: new Date().toISOString(),
      description,
    }
    upgradeInfo = { ...upgradeInfo, packages: [pkg, ...upgradeInfo.packages] }
    return HttpResponse.json(pkg, { status: 201 })
  }),

  http.delete('/v1/system/upgrade/packages/:id', ({ params }) => {
    upgradeInfo = {
      ...upgradeInfo,
      packages: upgradeInfo.packages.filter(p => p.id !== params.id),
    }
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/v1/system/upgrade/manager', async ({ request }) => {
    const body = (await request.json()) as { package_id: string }
    const pkg = upgradeInfo.packages.find(p => p.id === body.package_id && p.target === 'manager')
    if (!pkg) return HttpResponse.json({ error: '升级包不存在' }, { status: 404 })
    upgradeInfo = { ...upgradeInfo, manager_version: pkg.version }
    return HttpResponse.json({ message: '管理节点 升级任务已下发', version: pkg.version })
  }),

  http.post('/v1/system/upgrade/manager/rollback', () => {
    upgradeInfo = { ...upgradeInfo, manager_version: '2.0.0' }
    return HttpResponse.json({ message: '管理节点 已回滚到上一个版本' })
  }),

  http.post('/v1/system/upgrade/instance', async ({ request }) => {
    const body = (await request.json()) as { package_id: string; node_ids?: string[] }
    const pkg = upgradeInfo.packages.find(p => p.id === body.package_id && p.target === 'instance')
    if (!pkg) return HttpResponse.json({ error: '升级包不存在' }, { status: 404 })
    const ids = body.node_ids ?? []
    upgradeInfo = {
      ...upgradeInfo,
      nodes: upgradeInfo.nodes.map(n =>
        n.type === 'instance' && ids.includes(n.id) ? { ...n, current_version: pkg.version } : n,
      ),
    }
    return HttpResponse.json({ message: '实例 升级任务已下发', count: ids.length })
  }),

  http.post('/v1/system/upgrade/instance/rollback', async ({ request }) => {
    const body = (await request.json()) as { node_ids: string[] }
    const ids = body.node_ids ?? []
    upgradeInfo = {
      ...upgradeInfo,
      nodes: upgradeInfo.nodes.map(n =>
        n.type === 'instance' && ids.includes(n.id) ? { ...n, status: 'rollback' } : n,
      ),
    }
    return HttpResponse.json({ message: '实例 已回滚', count: ids.length })
  }),

  // === 资源池配置 ===

  http.get('/v1/instance_pools', () => HttpResponse.json({ pools: instancePools })),

  http.post('/v1/instance_pools', async ({ request }) => {
    const body = (await request.json()) as Omit<InstancePool, 'id' | 'used'>
    const pool: InstancePool = { id: genId('pool'), used: 0, ...body }
    instancePools = [...instancePools, pool]
    return HttpResponse.json(pool, { status: 201 })
  }),

  http.put('/v1/instance_pools/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<InstancePool>
    const idx = instancePools.findIndex(p => p.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '资源池不存在' }, { status: 404 })
    const updated = { ...instancePools[idx], ...body }
    instancePools = [...instancePools.slice(0, idx), updated, ...instancePools.slice(idx + 1)]
    return HttpResponse.json(updated)
  }),

  http.delete('/v1/instance_pools/:id', ({ params }) => {
    instancePools = instancePools.filter(p => p.id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),

  // === 业务告警 ===

  http.get('/v1/service_warnings', () => HttpResponse.json({ warnings: serviceWarnings })),

  http.post('/v1/service_warnings', async ({ request }) => {
    const body = (await request.json()) as Omit<ServiceWarning, 'id'>
    const item: ServiceWarning = { id: genId('sw'), ...body }
    serviceWarnings = [...serviceWarnings, item]
    return HttpResponse.json(item, { status: 201 })
  }),

  http.put('/v1/service_warnings/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<ServiceWarning>
    const idx = serviceWarnings.findIndex(w => w.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '告警不存在' }, { status: 404 })
    const updated = { ...serviceWarnings[idx], ...body }
    serviceWarnings = [...serviceWarnings.slice(0, idx), updated, ...serviceWarnings.slice(idx + 1)]
    return HttpResponse.json(updated)
  }),

  http.delete('/v1/service_warnings/:id', ({ params }) => {
    serviceWarnings = serviceWarnings.filter(w => w.id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),
]
