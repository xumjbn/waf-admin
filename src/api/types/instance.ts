// 实例 防护实例模块类型定义
// 对应 API_REFERENCE.md §2, §13, §15, §16

// API_REFERENCE.md §2 - 实例 实例
export interface Instance {
  id: string
  name: string
  status: string
  mode: string
  ip: string
  created_at?: string
}

// API_REFERENCE.md §15 - 旁路配置
export interface BypassConfig {
  id: string
  instance_id: string
  name: string
  interface: string
  enabled: boolean
}

// API_REFERENCE.md §15 - 资源池
export interface InstancePool {
  id: string
  name: string
  description?: string
}

// API_REFERENCE.md §16 - HA 集群 (v3)
export interface HaCluster {
  id: string
  name: string
  status: string
  nodes: string[]
}

// API_REFERENCE.md §16 - HA 实例 (v3)
export interface HaInstance {
  id: string
  instance_id: string
  cluster_id: string
  status?: string
}

// API_REFERENCE.md §13 - 负载均衡 VIP
export interface LbVip {
  id: string
  name: string
  address: string
  port: number
  protocol: string
  pool_id?: string
}

// API_REFERENCE.md §13 - 负载均衡 Pool
export interface LbPool {
  id: string
  name: string
  lb_method: string
  protocol: string
}

// API_REFERENCE.md §13 - 健康检查
export interface LbHealthMonitor {
  id: string
  name: string
  type: string
  delay: number
  timeout: number
  max_retries: number
}

// API_REFERENCE.md §13 - 负载均衡成员
export interface LbMemberEntry {
  id: string
  name: string
  address: string
  port: number
  weight: number
}

// API_REFERENCE.md §15 - 网络接口
export interface InstanceInterface {
  id: string
  instance_id: string
  name: string
  ip_address?: string
  netmask?: string
  gateway?: string
}

// API_REFERENCE.md §15 - 网桥
export interface InstanceBridge {
  id: string
  instance_id: string
  name: string
  interfaces?: string[]
}

// Agent 实例管理类型（在线 waf-agent 实例）
export interface AgentInstance {
  node_id: string
  hostname: string
  ip: string
  version: string
  status: string
  cpu_percent: number
  memory_percent: number
  disk_percent: number
  last_seen: string
}
