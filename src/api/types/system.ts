// 系统管理模块类型定义
// 对应 API_REFERENCE.md §10, §15

// API_REFERENCE.md §10 - 系统时间
export interface SystemTime {
  time: string
  timezone?: string
}

// API_REFERENCE.md §10 - 故障转移设置
export interface FailoverSetting {
  enabled: boolean
  timeout?: number
  retry_count?: number
}

// API_REFERENCE.md §10 - 运行模式
export interface RunningMode {
  mode: string
}

// API_REFERENCE.md §10 - 会话超时
export interface SessionTimeout {
  timeout: number
}

// API_REFERENCE.md §10 - 密码更换周期
export interface PasswordChangeCycle {
  cycle: number
}

// API_REFERENCE.md §10 - 邮件设置
export interface MailSetting {
  smtp_server: string
  smtp_port: number
  username?: string
  password?: string
  from_address: string
  use_tls?: boolean
}

// API_REFERENCE.md §10 - Syslog 设置
export interface SyslogSetting {
  enabled: boolean
  server: string
  port: number
  protocol: 'udp' | 'tcp'
}

// API_REFERENCE.md §10 - DNS 设置
export interface DnsSetting {
  primary_dns: string
  secondary_dns?: string
}

// API_REFERENCE.md §10 - SNMP 设置
export interface SnmpSetting {
  enabled: boolean
  community?: string
  version?: string
}

// API_REFERENCE.md §10 - JVM 设置
export interface JvmSetting {
  heap_size?: string
  gc_type?: string
}

// API_REFERENCE.md §15 - 许可证
export interface License {
  id: string
  name: string
  type: string
  status: string
  expires_at?: string
}

// API_REFERENCE.md §15 - 密码长度配置
export interface PasswordLengthConfig {
  min_length: number
  max_length?: number
}

// API_REFERENCE.md §15 - 尝试次数限制配置
export interface AttemptLimitConfig {
  max_attempts: number
  lockout_duration?: number
}

// API_REFERENCE.md §15 - 可信主机配置
export interface AuthHostConfig {
  enabled: boolean
  whitelist_mode?: boolean
}

// API_REFERENCE.md §15 - 可信主机
export interface AuthHost {
  id: string
  ip: string
  description?: string
}

// API_REFERENCE.md §15 - 监控告警
export interface MonitorWarning {
  id: string
  name: string
  type: string
  threshold: number
  enabled: boolean
}

// API_REFERENCE.md §15 - 攻击日志备份定时
export interface AttackLogBackupTiming {
  enabled: boolean
  schedule?: string
  retention_days?: number
}

// 系统升级 — 对应 manager system/upgrade/views.py
export type UpgradeTarget = 'manager' | 'instance'
export type UpgradeMode = 'standalone' | 'cluster' | 'ha'

export interface UpgradePackage {
  id: string
  name: string
  target: UpgradeTarget
  version: string
  size: number
  uploaded_at: string
  description?: string
}

export interface UpgradableNode {
  id: string
  name: string
  type: UpgradeTarget
  current_version: string
  status: 'idle' | 'upgrading' | 'failed' | 'rollback'
}

export interface UpgradeInfo {
  mode: UpgradeMode
  manager_version: string
  nodes: UpgradableNode[]
  packages: UpgradePackage[]
}

export interface UpgradeAction {
  package_id: string
  node_ids?: string[]
}

// 资源池配置 — 对应 manager system/instance_pools
export interface InstancePool {
  id: string
  flavor: string
  capacity: number
  used: number
  reserved: number
  description?: string
}

// 业务告警 — 对应 manager system/service_warning
export type ServiceWarningType = 'site_down' | 'cert_expire' | 'cc_attack' | 'qps_spike'

export interface ServiceWarning {
  id: string
  name: string
  type: ServiceWarningType
  target: string
  threshold: number
  enabled: boolean
  notify_email?: string
}
