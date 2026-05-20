// instance API adapter（live = 真后端，区别于 src/api/instance.ts 给 legacy
// Ant Design Pro 页面用的 wrapper）。
//
// 端点：GET /api/v1/instances → { instances: BackendInstance[] }
// 后端 `instancemgmt` 域是 gRPC 拉自 connected agents 的只读视图，
// 没有 cluster / 创建 / 重启 概念，所以本适配只覆盖 list；
// 顶栏『新增节点 / 新建集群』+ 行内『重启』继续走客户端 confirm/state mock。
//
// 字段对齐：以前端 src/mocks/nebula.ts 的 `Instance` 形状为准。

import axios from 'axios'
import { useAuthStore } from '@/store/auth'
import type { Instance } from '@/mocks/nebula'

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

function adapt(b: BackendInstance): Instance {
  return {
    id: b.id || b.node_id || b.hostname,
    cluster: 'cluster-default', // 占位，UI 列别空
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

export async function listInstances(): Promise<Instance[]> {
  const res = await axios.get<{ instances: BackendInstance[] }>('/api/v1/instances', {
    headers: authHeader(),
  })
  return (res.data.instances ?? []).map(adapt)
}
