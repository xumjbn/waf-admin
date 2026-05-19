// log 日志中心模块类型定义
// 字段来源: API_REFERENCE.md §4-§9

// API_REFERENCE.md §4 - 攻击日志
export interface AttackLog {
  id: string
  datetime: string
  src_ip: string
  dst_ip: string
  host: string
  url: string
  action: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  rule_id: string
  rule_name: string
  category: string
  method: string
  protocol: string
  src_port: number
  dst_port: number
  src_geo?: string
  dst_geo?: string
}

// API_REFERENCE.md §4 - 攻击查询条件
export interface AttackQueryCriteria {
  id: string
  name: string
  conditions: Record<string, unknown>
}

// API_REFERENCE.md §4 - 攻击统计信息
export interface AttackStatisticInfo {
  total: number
  blocked: number
  allowed: number
  by_severity: Record<string, number>
  by_category: Record<string, number>
}

// API_REFERENCE.md §4 - 攻击日志备份定时器
export interface AttackLogBackupTiming {
  enabled: boolean
  schedule: string
  backup_path?: string
  retention_days?: number
}

// API_REFERENCE.md §5 - 流量日志
export interface FlowLog {
  id: string
  datetime: string
  src_ip: string
  dst_ip: string
  protocol: string
  app_name?: string
  bytes_in: number
  bytes_out: number
  duration: number
}

// API_REFERENCE.md §5 - 流量查询操作
export interface FlowQueryOperation {
  id: string
  name: string
  conditions: Record<string, unknown>
}

// API_REFERENCE.md §6 - 防病毒日志
export interface AntiVirusLog {
  id: string
  datetime: string
  site_name: string
  file_name: string
  virus_name: string
  action: string
  src_ip: string
}

// API_REFERENCE.md §7 - 防篡改日志
export interface AntiTamperLog {
  id: string
  datetime: string
  site_name: string
  url: string
  file_name: string
  action: string
  status: 'pending' | 'confirmed' | 'rejected'
}

// API_REFERENCE.md §8 - 操作日志
export interface OperationLog {
  id: string
  datetime: string
  user_name: string
  operation: string
  resource: string
  result: 'success' | 'failure'
  detail?: string
}

// API_REFERENCE.md §9 - Web 审计报告
export interface WebAccessReport {
  site_id: string
  rep_type: string
  data: Record<string, unknown>
}

// API_REFERENCE.md §9 - Web 审计统计详情
export interface WebAccessStatistics {
  id: string
  site_id: string
  statistics_data: Record<string, unknown>
}
