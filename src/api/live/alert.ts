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

// --- channels（NW · 06 alert channel 全 CRUD，migration 000013 起）

export type ChannelKind = 'email' | 'wechat' | 'dingtalk' | 'pagerduty' | 'webhook' | 'sms'

export interface Channel {
  id: number
  name: string
  kind: ChannelKind
  target: string
  description: string
  severity: 'info' | 'warn' | 'critical'
  config: Record<string, unknown>
  is_enabled: boolean
}

interface BackendChannel {
  id: number
  name: string
  kind: string
  target: string
  description: string
  severity: string
  config?: Record<string, unknown> | string | null
  is_enabled: boolean
}

function parseConfig(c: BackendChannel['config']): Record<string, unknown> {
  if (!c) return {}
  if (typeof c === 'string') {
    try { return JSON.parse(c) as Record<string, unknown> } catch { return {} }
  }
  return c
}

function adaptChannel(b: BackendChannel): Channel {
  return {
    id: b.id,
    name: b.name,
    kind: (b.kind as ChannelKind) || 'webhook',
    target: b.target || '',
    description: b.description || '',
    severity: (b.severity as Channel['severity']) || 'warn',
    config: parseConfig(b.config),
    is_enabled: !!b.is_enabled,
  }
}

export async function listAlertChannels(): Promise<{ channels: Channel[]; kinds: ChannelKind[] }> {
  const res = await axios.get<{ data: BackendChannel[]; kinds: ChannelKind[] }>(
    '/api/v1/alert/channels',
    { headers: authHeader() },
  )
  return {
    channels: (res.data.data ?? []).map(adaptChannel),
    kinds: res.data.kinds ?? ['email', 'wechat', 'dingtalk', 'pagerduty', 'webhook', 'sms'],
  }
}

export interface SaveChannelPayload {
  name: string
  kind: ChannelKind
  target: string
  description?: string
  severity?: Channel['severity']
  config?: Record<string, unknown>
  is_enabled?: boolean
}

export async function createAlertChannel(p: SaveChannelPayload): Promise<Channel> {
  const res = await axios.post<BackendChannel>('/api/v1/alert/channels', p, { headers: authHeader() })
  return adaptChannel(res.data)
}

export async function updateAlertChannel(id: number, p: Partial<SaveChannelPayload>): Promise<Channel> {
  const res = await axios.put<BackendChannel>(`/api/v1/alert/channels/${id}`, p, { headers: authHeader() })
  return adaptChannel(res.data)
}

export async function deleteAlertChannel(id: number): Promise<void> {
  await axios.delete(`/api/v1/alert/channels/${id}`, { headers: authHeader() })
}

export async function testAlertChannel(id: number): Promise<Alert> {
  const res = await axios.post<BackendEvent>(
    `/api/v1/alert/channels/${id}/test`,
    {},
    { headers: authHeader() },
  )
  return adapt(res.data)
}
