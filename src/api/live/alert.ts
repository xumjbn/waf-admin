// alert API adapter（live）
//
// 端点：
//   GET /api/v1/alert/events       → BackendEvent[]（list 直接返回数组或信封）
//   PUT /api/v1/alert/events/{id}/status
//   POST /api/v1/alert/events/mark-all-read
//   GET /api/v1/alert/events/stats
//
// 字段以前端 mocks/nebula.ts Alert 为准。

import axios from 'axios'
import { useAuthStore } from '@/store/auth'
import type { Alert } from '@/mocks/nebula'

interface BackendEvent {
  id: number
  policy_id: number | null
  level: string
  kind: string
  target: string
  message: string
  status: 'open' | 'ack' | 'closed' | string
  occurred_at: string
  handled_at: string | null
  handled_by: string
}

function authHeader(): Record<string, string> {
  const t = useAuthStore.getState().token
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function mapLevel(l: string): Alert['level'] {
  switch ((l || '').toLowerCase()) {
    case 'critical':
    case 'crit':
      return 'critical'
    case 'warn':
    case 'warning':
      return 'warn'
    case 'info':
    default:
      return 'info'
  }
}

function mapStatus(s: string): Alert['status'] {
  switch ((s || '').toLowerCase()) {
    case 'open':
      return 'open'
    case 'ack':
    case 'acknowledged':
      return 'ack'
    case 'closed':
    case 'resolved':
      return 'closed'
    default:
      return 'open'
  }
}

function fmtTime(s: string): string {
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
}

function adapt(b: BackendEvent): Alert {
  const status = mapStatus(b.status)
  return {
    id: String(b.id),
    t: fmtTime(b.occurred_at),
    level: mapLevel(b.level),
    kind: b.kind || '未分类',
    site: b.target || '—',
    msg: b.message || '',
    status,
    ack: status === 'ack',
  }
}

export async function listAlerts(): Promise<Alert[]> {
  const res = await axios.get<BackendEvent[] | { data?: BackendEvent[]; events?: BackendEvent[] }>(
    '/api/v1/alert/events',
    { headers: authHeader() },
  )
  const arr = Array.isArray(res.data)
    ? res.data
    : (res.data.data ?? res.data.events ?? [])
  return arr.map(adapt)
}

export async function setAlertStatus(id: string, status: Alert['status']): Promise<void> {
  await axios.put(
    `/api/v1/alert/events/${id}/status`,
    { status, handled_by: 'admin' },
    { headers: authHeader() },
  )
}

export async function markAllAlertsRead(): Promise<void> {
  await axios.post('/api/v1/alert/events/mark-all-read', {}, { headers: authHeader() })
}

export interface AlertStats {
  open: number
  ack: number
  closed: number
  today: number
}

export async function alertStats(): Promise<AlertStats> {
  const res = await axios.get<AlertStats>('/api/v1/alert/events/stats', { headers: authHeader() })
  return res.data
}
