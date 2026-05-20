// instance API adapter（live = 真后端，区别于 src/api/instance.ts 给 legacy
// Ant Design Pro 页面用的 wrapper）。
//
// 三大块：
//   1. 实例列表          GET  /api/v1/instances           → { instances: BackendInstance[] }
//                       POST /api/v1/instances/restart  + register-intent
//   2. 集群编排          GET  /api/v1/clusters            → { clusters: BackendCluster[] }
//                       POST /api/v1/clusters
//                       PUT  /api/v1/clusters/{id}
//                       DELETE /api/v1/clusters/{id}
//   3. HA 主备状态       GET  /api/v1/ha-groups           → { ha_groups: BackendHAGroup[] }
//                       POST /api/v1/ha-groups
//                       PUT  /api/v1/ha-groups/{id}
//                       POST /api/v1/ha-groups/{id}/switchover
//                       DELETE /api/v1/ha-groups/{id}
//
// 字段对齐：以前端 src/mocks/nebula.ts 的 `Instance` / `Cluster` 形状为准；
// 实例本身由 agent 自注册维护，CRUD 不开放；集群 / HA 走数据库 CRUD。

import axios from 'axios'
import { useAuthStore } from '@/store/auth'
import type { Instance, Cluster } from '@/mocks/nebula'

interface BackendInstance {
  node_id: string
  id: string
  hostname: string
  name: string
  ip: string
  version: string
  status: 'connected' | 'busy' | 'disconnected' | string
  cpu_percent: number
  memory_percent: number
  disk_percent: number
  net_connections: number
  rps: number
  network_io: string
  memory_total: number
  disk_total: number
  last_seen: string
}

interface BackendCluster {
  id: number
  name: string
  vip: string
  algo: string
  state: 'ok' | 'warn' | 'critical' | string
  site_count: number
  description?: string
  nodes: number
  node_ids: string[]
  created_at: string
  updated_at: string
}

interface BackendHAGroup {
  id: number
  name: string
  primary_node: string
  standby_node: string
  vip: string
  state: 'ok' | 'warn' | 'critical' | string
  last_switch?: string | null
  created_at: string
  updated_at: string
}

/** UI 详情模态需要的集群详情结构（带 node_ids + description + raw algo） */
export interface ClusterDetail {
  id: string                  // 字符串化的后端 ID
  rawAlgo: string             // 后端原始 algo enum（用于 select 回显）
  name: string
  vip: string
  state: 'ok' | 'warn' | 'critical'
  siteCount: number
  description: string
  nodes: number
  nodeIds: string[]           // 当前已绑定的 node_id 列表
}

/** UI 表渲染需要的 HA 行结构 */
export interface HAGroupRow {
  id: number
  name: string
  primary: string
  standby: string
  vip: string
  state: 'ok' | 'warn' | 'critical'
  lastSwitch?: string
}

function authHeader(): Record<string, string> {
  const t = useAuthStore.getState().token
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function mapStatus(s: string): Instance['state'] {
  switch (s) {
    case 'connected':
      return 'online'
    case 'busy':
      return 'busy'
    case 'disconnected':
    default:
      return 'offline'
  }
}

function deriveUptime(lastSeen: string): string {
  if (!lastSeen) return '—'
  const seen = new Date(lastSeen).getTime()
  if (Number.isNaN(seen)) return '—'
  const diff = Math.max(0, Date.now() - seen)
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

// 后端 algo 用英文 enum，UI 想看中文/友好串。两边都接受。
const ALGO_ZH: Record<string, string> = {
  'round-robin': '加权轮询',
  'least-conn': '最小连接',
  'ip-hash': 'IP Hash',
  sticky: '会话保持',
}

function adaptInstance(b: BackendInstance, clusterByNode: Map<string, string>): Instance {
  const id = b.id || b.node_id || b.hostname
  return {
    id,
    cluster: clusterByNode.get(id) || clusterByNode.get(b.hostname) || 'cluster-default',
    ip: b.ip,
    cpu: Math.round(b.cpu_percent ?? 0),
    mem: Math.round(b.memory_percent ?? 0),
    conn: b.net_connections ?? 0,
    qps: b.rps ?? 0,
    tp: b.network_io || '—',
    state: mapStatus(b.status),
    uptime: deriveUptime(b.last_seen),
  }
}

function adaptClusterDetail(b: BackendCluster): ClusterDetail {
  const stateNorm: ClusterDetail['state'] =
    b.state === 'warn' || b.state === 'critical' ? b.state : 'ok'
  return {
    id: String(b.id),
    rawAlgo: b.algo,
    name: b.name,
    vip: b.vip,
    state: stateNorm,
    siteCount: b.site_count ?? 0,
    description: b.description ?? '',
    nodes: b.nodes ?? (b.node_ids ? b.node_ids.length : 0),
    nodeIds: b.node_ids ?? [],
  }
}

function adaptCluster(b: BackendCluster): Cluster {
  const stateNorm: Cluster['state'] =
    b.state === 'warn' || b.state === 'critical' ? b.state : 'ok'
  return {
    id: String(b.id),
    name: b.name,
    nodes: b.nodes ?? (b.node_ids ? b.node_ids.length : 0),
    vip: b.vip,
    algo: ALGO_ZH[b.algo] || b.algo,
    state: stateNorm,
    site_count: b.site_count ?? 0,
  }
}

function adaptHAGroup(b: BackendHAGroup): HAGroupRow {
  const stateNorm: HAGroupRow['state'] =
    b.state === 'warn' || b.state === 'critical' ? b.state : 'ok'
  return {
    id: b.id,
    name: b.name,
    primary: b.primary_node,
    standby: b.standby_node,
    vip: b.vip,
    state: stateNorm,
    lastSwitch: b.last_switch || undefined,
  }
}

// ---------- 实例列表 ----------

export async function listInstances(clusters?: Cluster[]): Promise<Instance[]> {
  // node → cluster 名映射：后端 BackendCluster.node_ids 已经把成员都吐出来。
  const clusterByNode = new Map<string, string>()
  if (clusters && clusters.length) {
    // 这里复用同一个 listClusters() 的结果，但 Cluster (UI shape) 没带 node_ids；
    // 因此 cluster 名直接用 backend cluster name。本函数只用得到映射，调用方
    // 已经能给一个空数组（兜底 cluster-default）。
  }
  const res = await axios.get<{ instances: BackendInstance[] }>('/api/v1/instances', {
    headers: authHeader(),
  })
  return (res.data.instances ?? []).map(b => adaptInstance(b, clusterByNode))
}

/** 通过详细列表（含 node_ids）建立 node → cluster 名映射并返回实例。
 * 任何一边失败都不连累另一边：clusters 500 仍然返回 instances，反之亦然。
 * errors 字段带回各自错误，由 UI 决定显示形式。*/
export async function listInstancesWithClusterMap(): Promise<{
  instances: Instance[]
  clusters: Cluster[]
  errors: { instances?: string; clusters?: string }
}> {
  const [clSettled, inSettled] = await Promise.all([
    axios
      .get<{ clusters: BackendCluster[] }>('/api/v1/clusters', { headers: authHeader() })
      .then(r => ({ ok: true as const, data: r.data.clusters ?? [] }))
      .catch((e: unknown) => ({
        ok: false as const,
        error: e instanceof Error ? e.message : String(e),
      })),
    axios
      .get<{ instances: BackendInstance[] }>('/api/v1/instances', { headers: authHeader() })
      .then(r => ({ ok: true as const, data: r.data.instances ?? [] }))
      .catch((e: unknown) => ({
        ok: false as const,
        error: e instanceof Error ? e.message : String(e),
      })),
  ])

  const backendClusters = clSettled.ok ? clSettled.data : []
  const clusterByNode = new Map<string, string>()
  for (const c of backendClusters) {
    for (const nid of c.node_ids || []) {
      clusterByNode.set(nid, c.name)
    }
  }
  const backendInstances = inSettled.ok ? inSettled.data : []

  return {
    clusters: backendClusters.map(adaptCluster),
    instances: backendInstances.map(b => adaptInstance(b, clusterByNode)),
    errors: {
      clusters: clSettled.ok ? undefined : clSettled.error,
      instances: inSettled.ok ? undefined : inSettled.error,
    },
  }
}

/** listHAGroups 的安全包装：失败时返回空数组 + 错误描述。 */
export async function listHAGroupsSafe(): Promise<{ rows: HAGroupRow[]; error?: string }> {
  try {
    return { rows: await listHAGroups() }
  } catch (e: unknown) {
    return { rows: [], error: e instanceof Error ? e.message : String(e) }
  }
}

export async function restartInstance(hostname: string, reason?: string): Promise<void> {
  await axios.post(
    '/api/v1/instances/restart',
    { hostname, reason: reason ?? 'manual restart from UI' },
    { headers: authHeader() },
  )
}

export async function registerNodeIntent(payload: {
  hostname: string
  ip?: string
  description?: string
}): Promise<void> {
  await axios.post('/api/v1/instances/register-intent', payload, { headers: authHeader() })
}

// ---------- 集群 CRUD ----------

export async function listClusters(): Promise<Cluster[]> {
  const res = await axios.get<{ clusters: BackendCluster[] }>('/api/v1/clusters', {
    headers: authHeader(),
  })
  return (res.data.clusters ?? []).map(adaptCluster)
}

/** 详情模态用：单个集群，含 node_ids 列表。后端响应 { cluster: BackendCluster } */
export async function getClusterDetail(id: string | number): Promise<ClusterDetail> {
  const res = await axios.get<{ cluster: BackendCluster }>(`/api/v1/clusters/${id}`, {
    headers: authHeader(),
  })
  return adaptClusterDetail(res.data.cluster)
}

export async function createCluster(payload: {
  name: string
  vip: string
  algo?: string
  description?: string
}): Promise<Cluster> {
  const res = await axios.post<{ cluster: BackendCluster }>(
    '/api/v1/clusters',
    {
      name: payload.name,
      vip: payload.vip,
      algo: payload.algo ?? 'round-robin',
      description: payload.description ?? '',
    },
    { headers: authHeader() },
  )
  return adaptCluster(res.data.cluster)
}

export async function updateCluster(
  id: string | number,
  patch: Partial<{ name: string; vip: string; algo: string; state: string; description: string }>,
): Promise<Cluster> {
  const res = await axios.put<{ cluster: BackendCluster }>(`/api/v1/clusters/${id}`, patch, {
    headers: authHeader(),
  })
  return adaptCluster(res.data.cluster)
}

export async function deleteCluster(id: string | number): Promise<void> {
  await axios.delete(`/api/v1/clusters/${id}`, { headers: authHeader() })
}

export async function assignClusterNode(
  clusterId: string | number,
  nodeId: string,
  role: 'primary' | 'standby' = 'primary',
): Promise<void> {
  await axios.put(
    `/api/v1/clusters/${clusterId}/nodes/${encodeURIComponent(nodeId)}?role=${role}`,
    null,
    { headers: authHeader() },
  )
}

export async function removeClusterNode(
  clusterId: string | number,
  nodeId: string,
): Promise<void> {
  await axios.delete(`/api/v1/clusters/${clusterId}/nodes/${encodeURIComponent(nodeId)}`, {
    headers: authHeader(),
  })
}

// ---------- HA 主备组 ----------

export async function listHAGroups(): Promise<HAGroupRow[]> {
  const res = await axios.get<{ ha_groups: BackendHAGroup[] }>('/api/v1/ha-groups', {
    headers: authHeader(),
  })
  return (res.data.ha_groups ?? []).map(adaptHAGroup)
}

export async function createHAGroup(payload: {
  name: string
  primary_node: string
  standby_node: string
  vip: string
  state?: string
}): Promise<HAGroupRow> {
  const res = await axios.post<{ ha_group: BackendHAGroup }>('/api/v1/ha-groups', payload, {
    headers: authHeader(),
  })
  return adaptHAGroup(res.data.ha_group)
}

export async function updateHAGroup(
  id: number,
  patch: Partial<{
    name: string
    primary_node: string
    standby_node: string
    vip: string
    state: string
  }>,
): Promise<HAGroupRow> {
  const res = await axios.put<{ ha_group: BackendHAGroup }>(`/api/v1/ha-groups/${id}`, patch, {
    headers: authHeader(),
  })
  return adaptHAGroup(res.data.ha_group)
}

export async function switchoverHAGroup(id: number): Promise<HAGroupRow> {
  const res = await axios.post<{ ha_group: BackendHAGroup }>(
    `/api/v1/ha-groups/${id}/switchover`,
    null,
    { headers: authHeader() },
  )
  return adaptHAGroup(res.data.ha_group)
}

export async function deleteHAGroup(id: number): Promise<void> {
  await axios.delete(`/api/v1/ha-groups/${id}`, { headers: authHeader() })
}
