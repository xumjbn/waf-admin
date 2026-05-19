// policy 防护策略模块类型定义
// 字段来源: api/cloudinstance/common/db/models/ + api/cloudinstance/service/

// API_REFERENCE.md §3.1 - 策略
export interface Policy {
  id: string
  name: string
  policy_level: 'high' | 'medium' | 'low'
  engine_mode: 'block' | 'warning' | 'disable'
}

// API_REFERENCE.md §3.2 - 分类
export interface Category {
  name: string
  display_name: string
  state: 'enable' | 'disable'
  enabled: boolean
  policy_id: string
}

// API_REFERENCE.md §3.3 - 规则
export interface Rule {
  id: string
  policy_id: string
  state: 'enable' | 'disable'
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  log: boolean
  action: 'deny' | 'pass' | 'allow' | 'drop' | 'redirect'
  url: string
  description: string
  enabled: boolean
}

// API_REFERENCE.md §3.4 - 自定义参数
export type CustomParameterName =
  | 'max_file_size'
  | 'request_cookie_sizes'
  | 'request_filename_sizes'
  | 'combined_file_sizes'
  | 'arg_length'
  | 'arg_name_length'
  | 'arg_number'
  | 'request_uri_sizes'
  | 'request_header_sizes'

export interface CustomParameter {
  name: CustomParameterName
  value: number
  default_value: number
  policy_id: string
}

// API_REFERENCE.md §1.8 - 全局自定义规则
export interface GlobalCustomRule {
  id: string
  name: string
  type: 'and' | 'or'
  position: 'before' | 'after'
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  log: boolean
  action: 'deny' | 'pass' | 'allow' | 'drop' | 'redirect'
  url: string
  state: boolean
  site_id: string
}

// API_REFERENCE.md §1.9 - 自定义规则节点
export interface CustomRuleNode {
  id: string
  rule_id: string
  variable: string
  match: string
  lowercase: boolean
  length: boolean
  decodeurl: boolean
  decodehtml: boolean
  decodebase64: boolean
  decodehex: boolean
}

// API_REFERENCE.md §3.1 - 变更历史
export interface ChangeHistoryItem {
  timestamp: string
  user: string
  action: string
  details: string
}
