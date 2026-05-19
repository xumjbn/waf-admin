// ACL 访问控制模块类型定义
// 对应 API_REFERENCE.md §7 访问控制

// ACL 策略
export interface AclPolicy {
  id: string
  name: string
  description?: string
  enabled: boolean
  priority: number
  rule_count?: number
  created_at?: string
  updated_at?: string
}

// ACL 规则
export interface AclRule {
  id: string
  policy_id: string
  source_ip?: string
  destination_ip?: string
  port?: string
  protocol?: 'tcp' | 'udp' | 'icmp' | 'any'
  action: 'allow' | 'deny'
  enabled: boolean
  description?: string
  created_at?: string
}

// 优先级更新
export interface PriorityUpdate {
  direction: 'up' | 'down'
}
