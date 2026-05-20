// acl API adapter（live = 真后端）
//
// 后端 ACL 规则（migration: acl_rules 表）在 modsec 规则之前生效。
// action: allow / deny
// direction: inbound / outbound （UI 上一般固定 inbound）
//
// 端点：
//   GET    /api/v1/acl/rules
//   POST   /api/v1/acl/rules
//   PUT    /api/v1/acl/rules/{id}
//   DELETE /api/v1/acl/rules/{id}

import axios from 'axios'
import { useAuthStore } from '@/store/auth'

export interface AclRule {
  id: number
  name: string
  description: string
  direction: 'inbound' | 'outbound' | string
  action: 'allow' | 'deny' | string
  protocol: string
  src_ip: string
  src_port?: number | null
  dst_ip: string
  dst_port?: number | null
  priority: number
  is_enabled: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateAclPayload {
  name: string
  description?: string
  direction?: 'inbound' | 'outbound'
  action: 'allow' | 'deny'
  protocol?: string                // tcp / udp / icmp / any（默认 any）
  src_ip: string                   // 单 IP / CIDR / 国家代码
  src_port?: number
  dst_ip?: string
  dst_port?: number
  priority?: number
}

function authHeader(): Record<string, string> {
  const t = useAuthStore.getState().token
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export async function listAclRules(): Promise<AclRule[]> {
  const res = await axios.get<{ data: AclRule[] }>('/api/v1/acl/rules', {
    headers: authHeader(),
  })
  return res.data.data ?? []
}

export async function createAclRule(p: CreateAclPayload): Promise<AclRule> {
  const body = {
    name: p.name,
    description: p.description ?? '',
    direction: p.direction ?? 'inbound',
    action: p.action,
    protocol: p.protocol ?? 'any',
    src_ip: p.src_ip,
    src_port: p.src_port,
    dst_ip: p.dst_ip ?? '',
    dst_port: p.dst_port,
    priority: p.priority ?? 100,
  }
  const res = await axios.post<AclRule>('/api/v1/acl/rules', body, { headers: authHeader() })
  return res.data
}

export async function updateAclRule(
  id: number,
  patch: Partial<AclRule>,
): Promise<AclRule> {
  const res = await axios.put<AclRule>(`/api/v1/acl/rules/${id}`, patch, {
    headers: authHeader(),
  })
  return res.data
}

export async function deleteAclRule(id: number): Promise<void> {
  await axios.delete(`/api/v1/acl/rules/${id}`, { headers: authHeader() })
}

export async function toggleAclRule(id: number, enabled: boolean): Promise<AclRule> {
  return updateAclRule(id, { is_enabled: enabled })
}
