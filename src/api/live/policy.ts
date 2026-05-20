// policy/rule API adapter（live）
//
// 端点（waf-control feat/backend-policy 起，与前端 mocks/nebula.ts Rule 列对齐）：
//   GET    /api/v1/policies                          列表
//   POST   /api/v1/policies                          新建
//   GET    /api/v1/policies/{id}                     详情
//   PUT    /api/v1/policies/{id}                     编辑（含 enabled / priority / scope / ...）
//   DELETE /api/v1/policies/{id}                     删除
//   POST   /api/v1/policies/{id}/hit  { delta }      agent 命中计数

import axios from 'axios'
import { useAuthStore } from '@/store/auth'
import type { Rule as UiRule } from '@/mocks/nebula'

interface BackendPolicy {
  id: number
  name: string
  category_id?: number | null
  severity: string // low / medium / high / critical
  action: string // block / allow / log / rate / challenge
  is_enabled: boolean
  description?: string
  created_at?: string
  updated_at?: string
  // migration 000012 起
  scope: string
  field: string
  match: string
  priority: number
  builtin: boolean
  hits: number
  last_hit_at?: string | null
  modsec_id?: string // migration 000018 起，仅 builtin 规则有
  category?: string  // migration 000019：防护模块（sqli/xss/rce/.../custom）
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

function adapt(p: BackendPolicy): UiRule {
  // builtin 规则显示成 "M-120001 经典 SQL 关键字注入" 让用户一眼看出对应 modsec id
  const displayName = p.modsec_id ? `M-${p.modsec_id} ${p.name}` : p.name
  return {
    id: String(p.id),
    name: displayName,
    scope: p.scope || '全部站点',
    field: p.field || '—',
    match: p.match || p.severity || '—',
    action: mapAction(p.action),
    priority: p.priority ?? 100,
    enabled: p.is_enabled,
    builtin: !!p.builtin,
    hits: p.hits ?? 0,
    category: p.category || 'custom',
  }
}

export async function listRules(): Promise<UiRule[]> {
  const res = await axios.get<{ data?: BackendPolicy[]; items?: BackendPolicy[]; policies?: BackendPolicy[] }>(
    '/api/v1/policies',
    { headers: authHeader(), params: { page: 1, page_size: 200 } },
  )
  const arr = res.data.data ?? res.data.items ?? res.data.policies ?? []
  return arr.map(adapt)
}

export interface SaveRulePayload {
  name: string
  description?: string
  severity?: string
  action: UiRule['action']
  enabled?: boolean
  scope?: string
  field?: string
  match?: string
  priority?: number
  builtin?: boolean
}

function toBackend(p: Partial<SaveRulePayload>) {
  return {
    name: p.name,
    description: p.description,
    severity: p.severity,
    action: p.action,
    is_enabled: p.enabled,
    scope: p.scope,
    field: p.field,
    match: p.match,
    priority: p.priority,
    builtin: p.builtin,
  }
}

export async function createRule(p: SaveRulePayload): Promise<UiRule> {
  const res = await axios.post<BackendPolicy>('/api/v1/policies', toBackend(p), { headers: authHeader() })
  return adapt(res.data)
}

export async function updateRule(id: string | number, p: Partial<SaveRulePayload>): Promise<UiRule> {
  const res = await axios.put<BackendPolicy>(`/api/v1/policies/${id}`, toBackend(p), { headers: authHeader() })
  return adapt(res.data)
}

export async function deleteRule(id: string | number): Promise<void> {
  await axios.delete(`/api/v1/policies/${id}`, { headers: authHeader() })
}

export async function toggleRule(id: string | number, enabled: boolean): Promise<UiRule> {
  return updateRule(id, { enabled })
}

export async function incrementHits(id: string | number, delta = 1): Promise<UiRule> {
  const res = await axios.post<BackendPolicy>(
    `/api/v1/policies/${id}/hit`,
    { delta },
    { headers: authHeader() },
  )
  return adapt(res.data)
}

// 手动触发 builtin 规则同步（管理员添加新 .conf 后立即生效，不必重启 control）
export interface SyncBuiltinResult {
  dir: string
  inserted: number
  updated: number
  total: number
}
export async function syncBuiltin(): Promise<SyncBuiltinResult> {
  const res = await axios.post<SyncBuiltinResult>(
    '/api/v1/policies/sync-builtin',
    null,
    { headers: authHeader() },
  )
  return res.data
}
