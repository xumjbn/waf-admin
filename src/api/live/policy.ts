// policy/rule API adapter（live）
//
// 端点：GET/POST/PUT/DELETE /api/v1/policies
//
// 后端 policy.Policy 字段：id, name, category_id, severity, action, is_enabled, description
// 前端 mocks/nebula.ts Rule 字段：id, name, scope, field, match, action, priority,
// enabled, builtin, hits。结构不一一对应（UI 的 field/match/scope 在后端是
// /policies/{id}/rules 子资源），本适配先聚焦"主列表 + 基本 CRUD"，
// 子条件链由 PageRuleEdit 后续单独接 /rules 端点。

import axios from 'axios'
import { useAuthStore } from '@/store/auth'
import type { Rule as UiRule } from '@/mocks/nebula'

interface BackendPolicy {
  id: number
  name: string
  category_id?: number | null
  severity: string         // low / medium / high / critical
  action: string           // block / allow / log / rate / challenge
  is_enabled: boolean
  description?: string
  created_at?: string
  updated_at?: string
}

function authHeader(): Record<string, string> {
  const t = useAuthStore.getState().token
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function mapAction(a: string): UiRule['action'] {
  switch ((a || '').toLowerCase()) {
    case 'block':
      return 'block'
    case 'allow':
      return 'allow'
    case 'rate':
    case 'ratelimit':
      return 'rate'
    case 'challenge':
      return 'challenge'
    case 'log':
    default:
      return 'log'
  }
}

function adapt(p: BackendPolicy, idx: number): UiRule {
  return {
    id: String(p.id),
    name: p.name,
    scope: p.description || '全部站点',
    field: '—', // 详细字段在 /policies/{id}/rules 里
    match: p.severity || '—',
    action: mapAction(p.action),
    priority: idx + 1,
    enabled: p.is_enabled,
    builtin: false,
    hits: 0,
  }
}

export async function listRules(): Promise<UiRule[]> {
  const res = await axios.get<{ data?: BackendPolicy[]; items?: BackendPolicy[]; policies?: BackendPolicy[] }>(
    '/api/v1/policies',
    { headers: authHeader(), params: { page: 1, page_size: 200 } },
  )
  // Handler 写法不一，data/items/policies 三种可能 envelope 都兜
  const arr = res.data.data ?? res.data.items ?? res.data.policies ?? []
  return arr.map(adapt)
}

export interface CreateRulePayload {
  name: string
  description?: string
  severity?: string
  action: UiRule['action']
  enabled?: boolean
}

export async function createRule(p: CreateRulePayload): Promise<UiRule> {
  const body = {
    name: p.name,
    description: p.description ?? '',
    severity: p.severity ?? 'medium',
    action: p.action,
    is_enabled: p.enabled !== false,
  }
  const res = await axios.post<BackendPolicy>('/api/v1/policies', body, { headers: authHeader() })
  return adapt(res.data, 0)
}

export async function updateRule(id: string, p: Partial<CreateRulePayload> & { enabled?: boolean }): Promise<UiRule> {
  const body: Record<string, unknown> = {}
  if (p.name !== undefined) body.name = p.name
  if (p.description !== undefined) body.description = p.description
  if (p.severity !== undefined) body.severity = p.severity
  if (p.action !== undefined) body.action = p.action
  if (p.enabled !== undefined) body.is_enabled = p.enabled
  const res = await axios.put<BackendPolicy>(`/api/v1/policies/${id}`, body, { headers: authHeader() })
  return adapt(res.data, 0)
}

export async function deleteRule(id: string): Promise<void> {
  await axios.delete(`/api/v1/policies/${id}`, { headers: authHeader() })
}
