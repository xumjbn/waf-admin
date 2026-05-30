// attack log API adapter（live = 真后端）
//
// 端点：
//   GET    /api/v1/logs/attack                   → { data: BackendAttackLog[], total, page, page_size }
//   GET    /api/v1/logs/attack/{id}              → BackendAttackLog
//   GET    /api/v1/logs/attack/{id}/related      → { data: BackendAttackLog[], total, src_ip }
//   POST   /api/v1/logs/attack/{id}/ban          → 创建 acl 黑名单规则
//   POST   /api/v1/logs/attack/{id}/whitelist    → 创建 acl 白名单规则
//   DELETE /api/v1/logs/attack                   → 清空攻击日志
//
// 字段以前端 mocks/nebula.ts AttackEvent 为准。waf-control migration 000011
// 起已经补齐 region/country/lat/lng/site/domain/type_label/type_color/risk/
// method/uri/user_agent，前端不再回填 '—'。

import axios from 'axios'
import { useAuthStore } from '@/store/auth'
import type { AttackEvent } from '@/mocks/nebula'

interface BackendAttackLog {
  id: number
  node_id: number
  src_ip: string
  dst_ip: string
  src_port: number
  dst_port: number
  protocol: string
  attack_type: string
  rule_id: string
  action: string // block / alert / pass / challenge
  payload: string
  occurred_at: string
  // migration 000011 起
  region: string
  country: string
  lat: number
  lng: number
  site: string
  domain: string
  type_label: string
  type_color: string
  risk: string // 高/中/低
  method: string
  uri: string
  user_agent: string
}

function authHeader(): Record<string, string> {
  const t = useAuthStore.getState().token
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function mapAction(a: string): AttackEvent['action'] {
  switch ((a || '').toLowerCase()) {
    case 'block':
    case 'blocked':
      return 'blocked'
    case 'challenge':
    case 'challenged':
      return 'challenged'
    case 'log':
    case 'logged':
    case 'pass':
    case 'alert':
    default:
      return 'logged'
  }
}

function adapt(b: BackendAttackLog): AttackEvent {
  const ts = b.occurred_at ? new Date(b.occurred_at).getTime() : 0
  const t = b.occurred_at
    ? new Date(b.occurred_at).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    : '—'
  const type = b.attack_type || 'UNKNOWN'
  return {
    id: String(b.id),
    t,
    ts: Number.isNaN(ts) ? 0 : ts,
    ip: b.src_ip || '—',
    region: b.region || '—',
    country: b.country || '—',
    lat: b.lat ?? 0,
    lng: b.lng ?? 0,
    site: b.site || '—',
    domain: b.domain || '—',
    type,
    typeLabel: b.type_label || type,
    typeColor: b.type_color || '#8e84a3',
    risk: (b.risk as AttackEvent['risk']) || '中',
    action: mapAction(b.action),
    method: (b.method || b.protocol || 'GET').toUpperCase(),
    uri: b.uri || '—',
    payload: b.payload || '',
    ruleId: b.rule_id || '—',
    ua: b.user_agent || '—',
  }
}

export async function listAttackLogs(opts?: {
  page?: number
  pageSize?: number
  nodeID?: string
  risk?: string
  site?: string
  country?: string
  srcIP?: string
}): Promise<{ items: AttackEvent[]; total: number }> {
  const res = await axios.get<{
    data: BackendAttackLog[]
    total: number
    page: number
    page_size: number
  }>('/api/v1/logs/attack', {
    headers: authHeader(),
    params: {
      page: opts?.page ?? 1,
      page_size: opts?.pageSize ?? 50,
      node_id: opts?.nodeID,
      risk: opts?.risk || undefined,
      site: opts?.site || undefined,
      country: opts?.country || undefined,
      src_ip: opts?.srcIP || undefined,
    },
  })
  return {
    items: (res.data.data ?? []).map(adapt),
    total: res.data.total ?? 0,
  }
}

// 攻击日志按小时趋势（可选 site / ruleId 过滤）。喂 RuleEdit 命中趋势 / site 详情趋势。
export interface AttackTrendPoint {
  t: string
  count: number
}

export async function attackTrend(opts?: {
  hours?: number
  site?: string
  ruleId?: string
}): Promise<AttackTrendPoint[]> {
  const res = await axios.get<{ points: AttackTrendPoint[] }>('/api/v1/logs/attack/trend', {
    headers: authHeader(),
    params: {
      hours: opts?.hours ?? 24,
      site: opts?.site || undefined,
      rule_id: opts?.ruleId || undefined,
    },
  })
  return res.data.points ?? []
}

export async function clearAttackLogs(): Promise<void> {
  await axios.delete('/api/v1/logs/attack', { headers: authHeader() })
}

export async function getAttackLog(id: string | number): Promise<AttackEvent> {
  const res = await axios.get<BackendAttackLog>(`/api/v1/logs/attack/${id}`, { headers: authHeader() })
  return adapt(res.data)
}

export async function banAttackerIP(id: string | number): Promise<void> {
  await axios.post(`/api/v1/logs/attack/${id}/ban`, {}, { headers: authHeader() })
}

export async function whitelistAttackerIP(id: string | number): Promise<void> {
  await axios.post(`/api/v1/logs/attack/${id}/whitelist`, {}, { headers: authHeader() })
}

export async function listRelatedEvents(
  id: string | number,
  limit = 50,
): Promise<{ items: AttackEvent[]; total: number; srcIP: string }> {
  const res = await axios.get<{ data: BackendAttackLog[]; total: number; src_ip: string }>(
    `/api/v1/logs/attack/${id}/related`,
    { headers: authHeader(), params: { limit } },
  )
  return {
    items: (res.data.data ?? []).map(adapt),
    total: res.data.total ?? 0,
    srcIP: res.data.src_ip ?? '',
  }
}

export async function ingestAttackLog(payload: Partial<BackendAttackLog>): Promise<number> {
  const res = await axios.post<{ id: number }>('/api/v1/logs/attack', payload, { headers: authHeader() })
  return res.data.id
}
