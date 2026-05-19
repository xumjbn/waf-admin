// aggregation 监控模块类型定义
// 字段来源: api/cloudinstance/common/db/models/ + api/cloudinstance/service/

// API_REFERENCE.md §11 - 系统监控
export interface SystemResource {
  cpu_percent: number
  memory_percent: number
  memory_total: number | string
  disk_percent: number
  disk_total: number | string
  net_connections: number
  network_io: string
}

export interface NicInterface {
  name: string
  state: 'up' | 'down'
  addresses?: Array<{ ip: string }>
}

export interface InstanceMonitorData {
  id: string
  name: string
  system_resources: SystemResource
  interfaces: NicInterface[]
  datetime: string
}

export interface SystemMonitorAllResponse {
  system_resources?: SystemResource
  interfaces?: NicInterface[]
  datetime?: string
  manager?: {
    system_resources: SystemResource
    interfaces: NicInterface[]
    datetime: string
  }
  instances?: InstanceMonitorData[]
}

export interface SystemResourceHistoryParams {
  begin_time: string
  end_time: string
  entries: string
}

// API_REFERENCE.md §4 - 攻击日志/统计
export interface AttackRecord {
  datetime: string
  src_ip: string
  dst_ip: string
  host: string
  action: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  src_geo_coord: [number, number]
  dst_geo_coord: [number, number]
}

export interface AttackStatsResponse {
  statistic_info: AttackRecord[]
}

export interface AttackSeverity {
  critical: number
  high: number
  medium: number
  low: number
  info: number
}

export interface AttackSourceTop {
  src_ip: string
  count: number
}

// 站点统计 (attacks_monitor 用)
export interface SiteStats {
  idle: number
  on: number
  off: number
}

// 运行模式
export interface RunningMode {
  running_mode: 'standalone' | 'physical_cluster' | 'virtual_cluster'
}

// 流量监控
export interface FlowTop10Item {
  name: string
  value: number
}

// 服务监控
export interface ServiceMetric {
  timestamp: string
  value: number
}

export interface MonitorMetricParams {
  node_id?: string
  metric_name?: string
  begin_time?: string
  end_time?: string
}
