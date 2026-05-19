// MSW handlers — 节点管理
// 对照 API_REFERENCE.md §16
import { http, HttpResponse } from 'msw'
import type { Node, ExtensionNode } from '../api/types/node'

let nodes: Node[] = [
  {
    id: 'node-001',
    name: '主控节点',
    ip: '192.168.1.10',
    status: 'online',
    role: 'master',
    version: '2.1.0',
    cpu_percent: 35,
    memory_percent: 62,
    disk_percent: 48,
    uptime: '15天3小时',
    last_heartbeat: new Date().toISOString(),
    created_at: '2024-01-10T08:00:00Z',
  },
  {
    id: 'node-002',
    name: '检测节点-01',
    ip: '192.168.1.20',
    status: 'online',
    role: 'slave',
    version: '2.1.0',
    cpu_percent: 42,
    memory_percent: 55,
    disk_percent: 38,
    uptime: '10天8小时',
    last_heartbeat: new Date().toISOString(),
    created_at: '2024-02-15T10:00:00Z',
  },
  {
    id: 'node-003',
    name: '检测节点-02',
    ip: '192.168.1.30',
    status: 'offline',
    role: 'slave',
    version: '2.0.9',
    cpu_percent: 0,
    memory_percent: 0,
    disk_percent: 52,
    uptime: '0',
    last_heartbeat: '2024-06-01T12:00:00Z',
    created_at: '2024-03-20T14:00:00Z',
  },
]

const extensionNodes: ExtensionNode[] = [
  {
    node_ip: '192.168.1.40',
    hostname: 'waf-node-04',
    os_version: 'Ubuntu 22.04 LTS',
    cpu_cores: 8,
    memory_total: '16 GB',
    disk_total: '500 GB',
    status: 'ready',
  },
  {
    node_ip: '192.168.1.50',
    hostname: 'waf-node-05',
    os_version: 'Ubuntu 22.04 LTS',
    cpu_cores: 16,
    memory_total: '32 GB',
    disk_total: '1 TB',
    status: 'ready',
  },
]

let extendStatus: {
  status: 'idle' | 'running' | 'success' | 'failed'
  progress: number
  message: string
} = {
  status: 'idle',
  progress: 0,
  message: '',
}

const updateNodes = (next: Node[]) => {
  nodes = next
}

export const nodeHandlers = [
  // === §16 节点管理 ===

  http.get('/v1/nodes', () => HttpResponse.json({ nodes })),

  http.get('/v1/nodes/:id', ({ params }) => {
    const node = nodes.find(n => n.id === params.id)
    return node
      ? HttpResponse.json({ node })
      : HttpResponse.json({ error: '节点不存在' }, { status: 404 })
  }),

  http.put('/v1/nodes/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Node>
    const idx = nodes.findIndex(n => n.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '节点不存在' }, { status: 404 })
    const updated = { ...nodes[idx], ...body }
    updateNodes([...nodes.slice(0, idx), updated, ...nodes.slice(idx + 1)])
    return HttpResponse.json({ node: updated })
  }),

  // === §16 扩展节点 ===

  http.get('/v1/extension-nodes/nodes/:nodeIp', ({ params }) => {
    const node = extensionNodes.find(n => n.node_ip === params.nodeIp)
    return node
      ? HttpResponse.json({ node })
      : HttpResponse.json({ error: '扩展节点不存在' }, { status: 404 })
  }),

  http.post('/v1/extension-nodes/scan', () => HttpResponse.json({ nodes: extensionNodes })),

  http.post('/v1/extension-nodes/extend', async () => {
    extendStatus = { status: 'running', progress: 0, message: '正在扩展集群...' }
    setTimeout(() => {
      extendStatus = { status: 'success', progress: 100, message: '集群扩展完成' }
    }, 3000)
    return HttpResponse.json({ message: '开始扩展集群' })
  }),

  http.get('/v1/extension-nodes/extend-status', () => HttpResponse.json(extendStatus)),

  // === §16 服务统计 ===

  http.get('/v1/service-statistics', () =>
    HttpResponse.json({ total_requests: 125847, active_connections: 342 }),
  ),
]
