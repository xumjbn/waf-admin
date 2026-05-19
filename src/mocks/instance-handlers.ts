// MSW handlers — 实例 防护实例模块
// 对照 API_REFERENCE.md §2, §13, §15, §16
import { http, HttpResponse } from 'msw'
import type {
  Instance,
  BypassConfig,
  InstancePool,
  HaCluster,
  HaInstance,
  LbVip,
  LbPool,
  LbHealthMonitor,
  LbMemberEntry,
  InstanceInterface,
  InstanceBridge,
} from '../api/types/instance'

// === 辅助函数 ===

const genId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

// === 内存数据存储 ===

let instances: Instance[] = [
  {
    id: 'inst-001',
    name: 'WAF-Node-01',
    status: 'active',
    mode: 'inline',
    ip: '192.168.1.11',
    created_at: '2024-01-15T08:00:00Z',
  },
  {
    id: 'inst-002',
    name: 'WAF-Node-02',
    status: 'active',
    mode: 'inline',
    ip: '192.168.1.12',
    created_at: '2024-01-15T08:30:00Z',
  },
  {
    id: 'inst-003',
    name: 'WAF-Node-03',
    status: 'inactive',
    mode: 'monitor',
    ip: '192.168.1.13',
    created_at: '2024-02-01T10:00:00Z',
  },
  {
    id: 'inst-004',
    name: 'WAF-Node-04',
    status: 'active',
    mode: 'inline',
    ip: '192.168.1.14',
    created_at: '2024-02-10T14:20:00Z',
  },
]

let lbVips: LbVip[] = [
  {
    id: 'vip-001',
    name: '主VIP',
    address: '10.0.0.100',
    port: 80,
    protocol: 'http',
    pool_id: 'pool-001',
  },
  {
    id: 'vip-002',
    name: '备用VIP',
    address: '10.0.0.101',
    port: 443,
    protocol: 'https',
    pool_id: 'pool-002',
  },
]

let lbPools: LbPool[] = [
  { id: 'pool-001', name: 'HTTP后端池', lb_method: 'round_robin', protocol: 'http' },
  { id: 'pool-002', name: 'HTTPS后端池', lb_method: 'least_connections', protocol: 'https' },
]

let lbHealthMonitors: LbHealthMonitor[] = [
  { id: 'hm-001', name: 'HTTP健康检查', type: 'http', delay: 5, timeout: 3, max_retries: 3 },
  { id: 'hm-002', name: 'TCP健康检查', type: 'tcp', delay: 10, timeout: 5, max_retries: 2 },
]

let lbMembers: LbMemberEntry[] = [
  { id: 'member-001', name: '后端服务器1', address: '192.168.2.10', port: 8080, weight: 100 },
  { id: 'member-002', name: '后端服务器2', address: '192.168.2.11', port: 8080, weight: 100 },
  { id: 'member-003', name: '后端服务器3', address: '192.168.2.12', port: 8080, weight: 50 },
]

let bypassConfigs: BypassConfig[] = [
  { id: 'bypass-001', instance_id: 'inst-001', name: '管理流量旁路', interface: 'eth0', enabled: true },
  { id: 'bypass-002', instance_id: 'inst-001', name: '监控流量旁路', interface: 'eth1', enabled: false },
  { id: 'bypass-003', instance_id: 'inst-002', name: '备份流量旁路', interface: 'eth0', enabled: true },
]

let instancePools: InstancePool[] = [
  { id: 'pool-001', name: '生产资源池', description: '生产环境实例资源池' },
  { id: 'pool-002', name: '测试资源池', description: '测试环境实例资源池' },
]

let haClusters: HaCluster[] = [
  { id: 'ha-001', name: 'HA主集群', status: 'active', nodes: ['inst-001', 'inst-002'] },
]

let haInstances: HaInstance[] = [
  { id: 'ha-inst-001', instance_id: 'inst-001', cluster_id: 'ha-001', status: 'master' },
  { id: 'ha-inst-002', instance_id: 'inst-002', cluster_id: 'ha-001', status: 'backup' },
]

let instanceInterfaces: InstanceInterface[] = [
  {
    id: 'if-001',
    instance_id: 'inst-001',
    name: 'eth0',
    ip_address: '192.168.1.11',
    netmask: '255.255.255.0',
    gateway: '192.168.1.1',
  },
  {
    id: 'if-002',
    instance_id: 'inst-001',
    name: 'eth1',
    ip_address: '10.0.0.11',
    netmask: '255.255.255.0',
    gateway: '10.0.0.1',
  },
  {
    id: 'if-003',
    instance_id: 'inst-001',
    name: 'eth2',
    ip_address: '172.16.0.11',
    netmask: '255.255.0.0',
  },
  {
    id: 'if-004',
    instance_id: 'inst-002',
    name: 'eth0',
    ip_address: '192.168.1.12',
    netmask: '255.255.255.0',
    gateway: '192.168.1.1',
  },
]

let instanceBridges: InstanceBridge[] = [
  { id: 'br-001', instance_id: 'inst-001', name: 'br0', interfaces: ['eth0', 'eth1'] },
  { id: 'br-002', instance_id: 'inst-002', name: 'br0', interfaces: ['eth0', 'eth2'] },
]

// === 实例 管理 CRUD ===

export const instanceHandlers = [
  http.get('/v1/instances', () => HttpResponse.json({ instances })),

  http.get('/v1/instances/:id', ({ params }) => {
    const inst = instances.find(a => a.id === params.id)
    return inst
      ? HttpResponse.json({ instance: inst })
      : HttpResponse.json({ error: '实例不存在' }, { status: 404 })
  }),

  http.post('/v1/instances', async ({ request }) => {
    const body = (await request.json()) as Partial<Instance>
    const newInstance: Instance = { id: genId('inst'), created_at: new Date().toISOString(), ...body } as Instance
    instances = [...instances, newInstance]
    return HttpResponse.json({ instance: newInstance }, { status: 201 })
  }),

  http.put('/v1/instances/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Instance>
    const idx = instances.findIndex(a => a.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '实例不存在' }, { status: 404 })
    const updated = { ...instances[idx], ...body }
    instances = [...instances.slice(0, idx), updated, ...instances.slice(idx + 1)]
    return HttpResponse.json({ instance: updated })
  }),

  http.delete('/v1/instances/:id', ({ params }) => {
    const idx = instances.findIndex(a => a.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '实例不存在' }, { status: 404 })
    instances = [...instances.slice(0, idx), ...instances.slice(idx + 1)]
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete('/v1/instance_pools/:instancePoolId/instances/:id', ({ params }) => {
    const idx = instances.findIndex(a => a.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '实例不存在' }, { status: 404 })
    return new HttpResponse(null, { status: 204 })
  }),

  // === 负载均衡 VIP ===

  http.get('/v1/lb/vips', () => HttpResponse.json({ vips: lbVips })),

  http.get('/v1/lb/vips/:id', ({ params }) => {
    const vip = lbVips.find(v => v.id === params.id)
    return vip
      ? HttpResponse.json({ vip })
      : HttpResponse.json({ error: 'VIP不存在' }, { status: 404 })
  }),

  http.post('/v1/lb/vips', async ({ request }) => {
    const body = (await request.json()) as Partial<LbVip>
    const newVip: LbVip = { id: genId('vip'), ...body } as LbVip
    lbVips = [...lbVips, newVip]
    return HttpResponse.json({ vip: newVip }, { status: 201 })
  }),

  http.put('/v1/lb/vips/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<LbVip>
    const idx = lbVips.findIndex(v => v.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'VIP不存在' }, { status: 404 })
    const updated = { ...lbVips[idx], ...body }
    lbVips = [...lbVips.slice(0, idx), updated, ...lbVips.slice(idx + 1)]
    return HttpResponse.json({ vip: updated })
  }),

  http.delete('/v1/lb/vips/:id', ({ params }) => {
    const idx = lbVips.findIndex(v => v.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'VIP不存在' }, { status: 404 })
    lbVips = [...lbVips.slice(0, idx), ...lbVips.slice(idx + 1)]
    return new HttpResponse(null, { status: 204 })
  }),

  // === 负载均衡 Pool ===

  http.get('/v1/lb/pools', () => HttpResponse.json({ pools: lbPools })),

  http.get('/v1/lb/pools/:id', ({ params }) => {
    const pool = lbPools.find(p => p.id === params.id)
    return pool
      ? HttpResponse.json({ pool })
      : HttpResponse.json({ error: 'Pool不存在' }, { status: 404 })
  }),

  http.post('/v1/lb/pools', async ({ request }) => {
    const body = (await request.json()) as Partial<LbPool>
    const newPool: LbPool = { id: genId('pool'), ...body } as LbPool
    lbPools = [...lbPools, newPool]
    return HttpResponse.json({ pool: newPool }, { status: 201 })
  }),

  http.put('/v1/lb/pools/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<LbPool>
    const idx = lbPools.findIndex(p => p.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Pool不存在' }, { status: 404 })
    const updated = { ...lbPools[idx], ...body }
    lbPools = [...lbPools.slice(0, idx), updated, ...lbPools.slice(idx + 1)]
    return HttpResponse.json({ pool: updated })
  }),

  http.delete('/v1/lb/pools/:id', ({ params }) => {
    const idx = lbPools.findIndex(p => p.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'Pool不存在' }, { status: 404 })
    lbPools = [...lbPools.slice(0, idx), ...lbPools.slice(idx + 1)]
    return new HttpResponse(null, { status: 204 })
  }),

  // === 健康检查 ===

  http.get('/v1/lb/healthmonitors', () => HttpResponse.json({ healthmonitors: lbHealthMonitors })),

  http.get('/v1/lb/healthmonitors/:id', ({ params }) => {
    const hm = lbHealthMonitors.find(h => h.id === params.id)
    return hm
      ? HttpResponse.json({ healthmonitor: hm })
      : HttpResponse.json({ error: '健康检查不存在' }, { status: 404 })
  }),

  http.post('/v1/lb/healthmonitors', async ({ request }) => {
    const body = (await request.json()) as Partial<LbHealthMonitor>
    const item: LbHealthMonitor = { id: genId('hm'), ...body } as LbHealthMonitor
    lbHealthMonitors = [...lbHealthMonitors, item]
    return HttpResponse.json({ healthmonitor: item }, { status: 201 })
  }),

  http.put('/v1/lb/healthmonitors/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<LbHealthMonitor>
    const idx = lbHealthMonitors.findIndex(h => h.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '健康检查不存在' }, { status: 404 })
    const updated = { ...lbHealthMonitors[idx], ...body }
    lbHealthMonitors = [
      ...lbHealthMonitors.slice(0, idx),
      updated,
      ...lbHealthMonitors.slice(idx + 1),
    ]
    return HttpResponse.json({ healthmonitor: updated })
  }),

  http.delete('/v1/lb/healthmonitors/:id', ({ params }) => {
    const idx = lbHealthMonitors.findIndex(h => h.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '健康检查不存在' }, { status: 404 })
    lbHealthMonitors = [...lbHealthMonitors.slice(0, idx), ...lbHealthMonitors.slice(idx + 1)]
    return new HttpResponse(null, { status: 204 })
  }),

  // === 负载均衡成员 ===

  http.get('/v1/lb/members', () => HttpResponse.json({ members: lbMembers })),

  http.get('/v1/lb/members/:id', ({ params }) => {
    const m = lbMembers.find(m => m.id === params.id)
    return m
      ? HttpResponse.json({ member: m })
      : HttpResponse.json({ error: '成员不存在' }, { status: 404 })
  }),

  http.post('/v1/lb/members', async ({ request }) => {
    const body = (await request.json()) as Partial<LbMemberEntry>
    const item: LbMemberEntry = { id: genId('member'), ...body } as LbMemberEntry
    lbMembers = [...lbMembers, item]
    return HttpResponse.json({ member: item }, { status: 201 })
  }),

  http.put('/v1/lb/members/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<LbMemberEntry>
    const idx = lbMembers.findIndex(m => m.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '成员不存在' }, { status: 404 })
    const updated = { ...lbMembers[idx], ...body }
    lbMembers = [...lbMembers.slice(0, idx), updated, ...lbMembers.slice(idx + 1)]
    return HttpResponse.json({ member: updated })
  }),

  http.delete('/v1/lb/members/:id', ({ params }) => {
    const idx = lbMembers.findIndex(m => m.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '成员不存在' }, { status: 404 })
    lbMembers = [...lbMembers.slice(0, idx), ...lbMembers.slice(idx + 1)]
    return new HttpResponse(null, { status: 204 })
  }),

  // === 旁路配置 ===

  http.get('/v1/instances/:instanceId/bypass_cfg', ({ params }) =>
    HttpResponse.json({ bypass_cfg: bypassConfigs.filter(b => b.instance_id === params.instanceId) }),
  ),

  http.get('/v1/instances/:instanceId/bypass_cfg/:id', ({ params }) => {
    const cfg = bypassConfigs.find(b => b.id === params.id && b.instance_id === params.instanceId)
    return cfg
      ? HttpResponse.json({ bypass_cfg: cfg })
      : HttpResponse.json({ error: '旁路配置不存在' }, { status: 404 })
  }),

  http.post('/v1/instances/:instanceId/bypass_cfg', async ({ params, request }) => {
    const body = (await request.json()) as Partial<BypassConfig>
    const item: BypassConfig = {
      id: genId('bypass'),
      instance_id: params.instanceId as string,
      ...body,
    } as BypassConfig
    bypassConfigs = [...bypassConfigs, item]
    return HttpResponse.json({ bypass_cfg: item }, { status: 201 })
  }),

  http.put('/v1/instances/:instanceId/bypass_cfg/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<BypassConfig>
    const idx = bypassConfigs.findIndex(b => b.id === params.id && b.instance_id === params.instanceId)
    if (idx === -1) return HttpResponse.json({ error: '旁路配置不存在' }, { status: 404 })
    const updated = { ...bypassConfigs[idx], ...body }
    bypassConfigs = [...bypassConfigs.slice(0, idx), updated, ...bypassConfigs.slice(idx + 1)]
    return HttpResponse.json({ bypass_cfg: updated })
  }),

  http.delete('/v1/instances/:instanceId/bypass_cfg/:id', ({ params }) => {
    const idx = bypassConfigs.findIndex(b => b.id === params.id && b.instance_id === params.instanceId)
    if (idx === -1) return HttpResponse.json({ error: '旁路配置不存在' }, { status: 404 })
    bypassConfigs = [...bypassConfigs.slice(0, idx), ...bypassConfigs.slice(idx + 1)]
    return new HttpResponse(null, { status: 204 })
  }),

  // === 资源池 ===

  http.get('/v1/instance_pools', () => HttpResponse.json({ instance_pools: instancePools })),

  http.get('/v1/instance_pools/:id', ({ params }) => {
    const pool = instancePools.find(p => p.id === params.id)
    return pool
      ? HttpResponse.json({ instance_pool: pool })
      : HttpResponse.json({ error: '资源池不存在' }, { status: 404 })
  }),

  http.post('/v1/instance_pools', async ({ request }) => {
    const body = (await request.json()) as Partial<InstancePool>
    const item: InstancePool = { id: genId('instpool'), ...body } as InstancePool
    instancePools = [...instancePools, item]
    return HttpResponse.json({ instance_pool: item }, { status: 201 })
  }),

  http.put('/v1/instance_pools/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<InstancePool>
    const idx = instancePools.findIndex(p => p.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '资源池不存在' }, { status: 404 })
    const updated = { ...instancePools[idx], ...body }
    instancePools = [...instancePools.slice(0, idx), updated, ...instancePools.slice(idx + 1)]
    return HttpResponse.json({ instance_pool: updated })
  }),

  http.delete('/v1/instance_pools/:id', ({ params }) => {
    const idx = instancePools.findIndex(p => p.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '资源池不存在' }, { status: 404 })
    instancePools = [...instancePools.slice(0, idx), ...instancePools.slice(idx + 1)]
    return new HttpResponse(null, { status: 204 })
  }),

  // === HA 集群 (v3) ===

  http.get('/v3/ha-cluster', () => HttpResponse.json({ clusters: haClusters })),

  http.get('/v3/ha-cluster/:id', ({ params }) => {
    const cluster = haClusters.find(c => c.id === params.id)
    return cluster
      ? HttpResponse.json({ cluster })
      : HttpResponse.json({ error: 'HA集群不存在' }, { status: 404 })
  }),

  http.post('/v3/ha-cluster', async ({ request }) => {
    const body = (await request.json()) as Partial<HaCluster>
    const item: HaCluster = { id: genId('ha'), ...body } as HaCluster
    haClusters = [...haClusters, item]
    return HttpResponse.json({ cluster: item }, { status: 201 })
  }),

  http.put('/v3/ha-cluster/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<HaCluster>
    const idx = haClusters.findIndex(c => c.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'HA集群不存在' }, { status: 404 })
    const updated = { ...haClusters[idx], ...body }
    haClusters = [...haClusters.slice(0, idx), updated, ...haClusters.slice(idx + 1)]
    return HttpResponse.json({ cluster: updated })
  }),

  http.delete('/v3/ha-cluster/:id', ({ params }) => {
    const idx = haClusters.findIndex(c => c.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: 'HA集群不存在' }, { status: 404 })
    haClusters = [...haClusters.slice(0, idx), ...haClusters.slice(idx + 1)]
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/v3/ha-cluster/:clusterId/ha-instance', ({ params }) =>
    HttpResponse.json({ ha_instances: haInstances.filter(h => h.cluster_id === params.clusterId) }),
  ),

  http.get('/v3/ha-cluster/:clusterId/ha-instance/:instanceId', ({ params }) => {
    const ha = haInstances.find(h => h.instance_id === params.instanceId && h.cluster_id === params.clusterId)
    return ha
      ? HttpResponse.json({ ha_instance: ha })
      : HttpResponse.json({ error: 'HA节点不存在' }, { status: 404 })
  }),

  http.post('/v3/ha-cluster/:clusterId/ha-instance', async ({ params, request }) => {
    const body = (await request.json()) as Partial<HaInstance>
    const item: HaInstance = {
      id: genId('ha-inst'),
      cluster_id: params.clusterId as string,
      ...body,
    } as HaInstance
    haInstances = [...haInstances, item]
    return HttpResponse.json({ ha_instance: item }, { status: 201 })
  }),

  http.put('/v3/ha-cluster/:clusterId/ha-instance/:instanceId', async ({ params, request }) => {
    const body = (await request.json()) as Partial<HaInstance>
    const idx = haInstances.findIndex(
      h => h.instance_id === params.instanceId && h.cluster_id === params.clusterId,
    )
    if (idx === -1) return HttpResponse.json({ error: 'HA节点不存在' }, { status: 404 })
    const updated = { ...haInstances[idx], ...body }
    haInstances = [...haInstances.slice(0, idx), updated, ...haInstances.slice(idx + 1)]
    return HttpResponse.json({ ha_instance: updated })
  }),

  http.delete('/v3/ha-cluster/:clusterId/ha-instance/:instanceId', ({ params }) => {
    const idx = haInstances.findIndex(
      h => h.instance_id === params.instanceId && h.cluster_id === params.clusterId,
    )
    if (idx === -1) return HttpResponse.json({ error: 'HA节点不存在' }, { status: 404 })
    haInstances = [...haInstances.slice(0, idx), ...haInstances.slice(idx + 1)]
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/v3/ha-instance/:id', ({ params }) => {
    const ha = haInstances.find(h => h.id === params.id || h.instance_id === params.id)
    return ha
      ? HttpResponse.json({ ha_instance: ha })
      : HttpResponse.json({ error: 'HA节点不存在' }, { status: 404 })
  }),

  http.get('/v3/ha-cluster/ha-instance/:instanceId/status', ({ params }) => {
    const ha = haInstances.find(h => h.instance_id === params.instanceId)
    return ha
      ? HttpResponse.json({ status: ha.status ?? 'unknown' })
      : HttpResponse.json({ error: 'HA节点不存在' }, { status: 404 })
  }),

  // === 网络接口 ===

  http.get('/v1/instance_networks/:instanceId/interfaces', ({ params }) =>
    HttpResponse.json({ interfaces: instanceInterfaces.filter(i => i.instance_id === params.instanceId) }),
  ),

  http.get('/v1/instance_networks/:instanceId/interfaces/:id', ({ params }) => {
    const iface = instanceInterfaces.find(i => i.id === params.id && i.instance_id === params.instanceId)
    return iface
      ? HttpResponse.json({ interface: iface })
      : HttpResponse.json({ error: '接口不存在' }, { status: 404 })
  }),

  http.post('/v1/instance_networks/:instanceId/interfaces', async ({ params, request }) => {
    const body = (await request.json()) as Partial<InstanceInterface>
    const item: InstanceInterface = {
      id: genId('if'),
      instance_id: params.instanceId as string,
      ...body,
    } as InstanceInterface
    instanceInterfaces = [...instanceInterfaces, item]
    return HttpResponse.json({ interface: item }, { status: 201 })
  }),

  http.put('/v1/instance_networks/:instanceId/interfaces/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<InstanceInterface>
    const idx = instanceInterfaces.findIndex(i => i.id === params.id && i.instance_id === params.instanceId)
    if (idx === -1) return HttpResponse.json({ error: '接口不存在' }, { status: 404 })
    const updated = { ...instanceInterfaces[idx], ...body }
    instanceInterfaces = [...instanceInterfaces.slice(0, idx), updated, ...instanceInterfaces.slice(idx + 1)]
    return HttpResponse.json({ interface: updated })
  }),

  http.delete('/v1/instance_networks/:instanceId/interfaces/:id', ({ params }) => {
    const idx = instanceInterfaces.findIndex(i => i.id === params.id && i.instance_id === params.instanceId)
    if (idx === -1) return HttpResponse.json({ error: '接口不存在' }, { status: 404 })
    instanceInterfaces = [...instanceInterfaces.slice(0, idx), ...instanceInterfaces.slice(idx + 1)]
    return new HttpResponse(null, { status: 204 })
  }),

  // === 网桥 ===

  http.get('/v1/instance_networks/:instanceId/bridges', ({ params }) =>
    HttpResponse.json({ bridges: instanceBridges.filter(b => b.instance_id === params.instanceId) }),
  ),

  http.get('/v1/instance_networks/:instanceId/bridges/:id', ({ params }) => {
    const br = instanceBridges.find(b => b.id === params.id && b.instance_id === params.instanceId)
    return br
      ? HttpResponse.json({ bridge: br })
      : HttpResponse.json({ error: '网桥不存在' }, { status: 404 })
  }),

  http.post('/v1/instance_networks/:instanceId/bridges', async ({ params, request }) => {
    const body = (await request.json()) as Partial<InstanceBridge>
    const item: InstanceBridge = {
      id: genId('br'),
      instance_id: params.instanceId as string,
      ...body,
    } as InstanceBridge
    instanceBridges = [...instanceBridges, item]
    return HttpResponse.json({ bridge: item }, { status: 201 })
  }),

  http.put('/v1/instance_networks/:instanceId/bridges/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<InstanceBridge>
    const idx = instanceBridges.findIndex(b => b.id === params.id && b.instance_id === params.instanceId)
    if (idx === -1) return HttpResponse.json({ error: '网桥不存在' }, { status: 404 })
    const updated = { ...instanceBridges[idx], ...body }
    instanceBridges = [...instanceBridges.slice(0, idx), updated, ...instanceBridges.slice(idx + 1)]
    return HttpResponse.json({ bridge: updated })
  }),

  http.delete('/v1/instance_networks/:instanceId/bridges/:id', ({ params }) => {
    const idx = instanceBridges.findIndex(b => b.id === params.id && b.instance_id === params.instanceId)
    if (idx === -1) return HttpResponse.json({ error: '网桥不存在' }, { status: 404 })
    instanceBridges = [...instanceBridges.slice(0, idx), ...instanceBridges.slice(idx + 1)]
    return new HttpResponse(null, { status: 204 })
  }),
]
