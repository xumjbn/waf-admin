// attack log API adapter（live = 真后端）
//
// 端点：GET /api/v1/logs/attack → { data: BackendAttackLog[], total, page, page_size }
//
// 字段以前端 mocks/nebula.ts AttackEvent 为准。后端目前没有 geo/UA/method/URI/
// site/domain 等列，缺失字段统一回 '—' / 0；待后端扩展再细化。

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
  action: string         // block / alert / pass
  payload: string
  occurred_at: string
}

function authHeader(): Record<string, string> {
  const t = useAuthStore.getState().token
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function colorOf(t: string): string {
  switch ((t || '').toUpperCase()) {
    case 'SQLI':
    case 'SQL':
      return '#ef4444'
    case 'XSS':
      return '#ec4899'
    case 'CC':
    case 'DDOS':
      return '#f97316'
    case 'BOT':
      return '#22d3ee'
    case 'PATH':
    case 'LFI':
      return '#a855f7'
    default:
      return '#8e84a3'
  }
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
    region: '—',
    country: '—',
    lat: 0,
    lng: 0,
    site: '—',
    domain: '—',
    type,
    typeLabel: type,
    typeColor: colorOf(type),
    risk: '中',
    action: mapAction(b.action),
    method: (b.protocol || 'GET').toUpperCase(),
    uri: '—',
    payload: b.payload || '',
    ruleId: b.rule_id || '—',
    ua: '—',
  }
}

export async function listAttackLogs(opts?: {
  page?: number
  pageSize?: number
  nodeID?: string
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
    },
  })
  return {
    items: (res.data.data ?? []).map(adapt),
    total: res.data.total ?? 0,
  }
}

export async function clearAttackLogs(): Promise<void> {
  await axios.delete('/api/v1/logs/attack', { headers: authHeader() })
}
