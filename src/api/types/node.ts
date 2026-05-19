// node 节点管理模块类型定义
// 对应 API_REFERENCE.md §16

// §16 - 节点基础信息
export interface Node {
  id: string
  name: string
  ip: string
  status: 'online' | 'offline' | 'error'
  role: 'master' | 'slave'
  version?: string
  cpu_percent?: number
  memory_percent?: number
  disk_percent?: number
  uptime?: string
  last_heartbeat?: string
  created_at?: string
}

// §16 - 扩展节点信息
export interface ExtensionNode {
  node_ip: string
  hostname: string
  os_version?: string
  cpu_cores?: number
  memory_total?: string
  disk_total?: string
  status: 'ready' | 'extending' | 'error'
}

// §16 - 扩展集群请求
export interface ExtendClusterPayload {
  node_ips: string[]
}

// §16 - 扩展状态
export interface ExtendStatus {
  status: 'idle' | 'running' | 'success' | 'failed'
  progress?: number
  message?: string
}

// §16 - 扫描结果
export interface ScanResult {
  nodes: ExtensionNode[]
}

// §16 - 服务统计
export interface ServiceStatistics {
  total_requests: number
  active_connections: number
}
