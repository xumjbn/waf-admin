// site 站点管理模块类型定义
// 字段来源: api/cloudinstance/common/db/models/ + api/cloudinstance/service/

// API_REFERENCE.md §1.1 - 站点基础
export interface ProtectSite {
  id: string
  name: string
  domains: string
  domain_match: 'exact' | 'prefix' | 'suffix' | 'regex'
  policy_id?: string
  admin_state_up: boolean
  status: 'active' | 'inactive' | 'error'
  forbidden_type: 'block' | 'redirect'
  redirect_url?: string
  ip_src?: string
  proxy_header_info?: string
  ssl_public_key?: string
  ssl_private_key?: string
  ssl_chain_file?: string
  check_request_body: boolean
  check_response_body: boolean
  front_keepalive: number
  front_timeout: number
  backend_keepalive: number
  backend_timeout: number
  log_level: 'debug' | 'info' | 'warn' | 'error'
  audit_status: boolean
  anti_virus: boolean
  anti_tamper_alarm: boolean
  tamper_recv_mail?: string
  server_info_hide: boolean
  created_at?: string
}

// API_REFERENCE.md §1.2 - LB 防护成员
export interface LbMember {
  id: string
  site_id: string
  name: string
  lb_pool_id: string
  backend_address: string
  backend_protocol_port: number
}

// API_REFERENCE.md §1.3 - 实例 防护成员
export interface InstanceProtectMember {
  id: string
  site_id: string
  name: string
  member_type: 'transparent' | 'reverse' | 'bypass'
  protocol: 'http' | 'https' | 'upgrade_http'
  instance_id?: string
  address: string
  local_address?: string
  protocol_port: number
  backend_address: string
  backend_protocol_port: number
  service_subnet_id?: string
  link?: string
  vlan_id?: string
  bypass_if?: string
}

export type ProtectAction = 'deny' | 'pass' | 'allow' | 'drop' | 'redirect'

// API_REFERENCE.md §1.4 - ACL 防护
export interface AclProtect {
  id: string
  site_id: string
  name: string
  type: ProtectAction
  redirect_url?: string
  ip_src?: string
  ip_match?: string
  url?: string
  log: boolean
  state: boolean
}

// API_REFERENCE.md §1.5 - CC 防护
export interface CcProtect {
  id: string
  site_id: string
  name: string
  url: string
  rate: number
  time: number
  action: ProtectAction
  ip_src?: string
  redirect_url?: string
  log: boolean
  state: boolean
}

// API_REFERENCE.md §1.6 - CSRF 防护
export interface CsrfProtect {
  id: string
  site_id: string
  name: string
  url: string
  action: ProtectAction
  redirect_url?: string
  log: boolean
  state: boolean
}

// API_REFERENCE.md §1.7 - 加速器
export interface Accelerator {
  id: string
  site_id: string
  name: string
  url: string
  is_global: 'enable' | 'disable'
  filetypes?: string
  expired_time: number
}

// API_REFERENCE.md §1.8 - 自定义规则
export interface CustomRule {
  id: string
  site_id: string
  name: string
  priority?: number
}

// API_REFERENCE.md §1.10 - 防篡改
export interface AntiTamper {
  id: string
  site_id: string
  name: string
  url: string
  file_type?: string
  action: 'deny' | 'allow'
  max_file_size?: number
  log: boolean
  status: boolean
}

// API_REFERENCE.md §1.11 - 内容注入
export interface ContentInto {
  id: string
  site_id: string
  url: string
  name: string
  file?: string
}

// API_REFERENCE.md §1.12 - 防盗链
export interface AntiStealingLink {
  id: string
  name: string
  trust_hosts?: string
  file_types?: string
  action?: string
  log: boolean
  enabled: boolean
}

// API_REFERENCE.md §1.1 - 站点统计
export interface SiteStatsResponse {
  idle: number
  on: number
  off: number
}

// API_REFERENCE.md §1.1 - 创建站点+防护规则组合
export interface SiteAndProtectPayload {
  site: Omit<ProtectSite, 'id' | 'created_at'>
  members: Array<Omit<InstanceProtectMember, 'id' | 'site_id'>>
}
