// monitor API adapter（live）
//
// 后端 /monitor 域端点：
//   GET /api/v1/monitor/metric          → 当前指标快照
//   GET /api/v1/monitor/metricspec      → 指标规格定义
//   PUT /api/v1/monitor/realtime        → 自定义实时查询
//   PUT /api/v1/monitor/history         → 历史查询
//
// 字段以前端实时监控 NW · 02 的 UI 形态为准；本适配仅暴露 list endpoint，
// 复杂时序查询由各图组件单独 PUT。

import axios from 'axios'
import { useAuthStore } from '@/store/auth'

export interface MetricPoint {
  name: string
  value: number
  unit?: string
  label?: string
  ts?: string
}

interface BackendMetric {
  name: string
  value: number
  unit?: string
  label?: string
  ts?: string
}

function authHeader(): Record<string, string> {
  const t = useAuthStore.getState().token
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export async function listMetrics(): Promise<MetricPoint[]> {
  const res = await axios.get<BackendMetric[] | { data?: BackendMetric[]; items?: BackendMetric[] }>(
    '/api/v1/monitor/metric',
    { headers: authHeader() },
  )
  const arr = Array.isArray(res.data) ? res.data : (res.data.data ?? res.data.items ?? [])
  return arr.map(m => ({
    name: m.name,
    value: m.value,
    unit: m.unit,
    label: m.label,
    ts: m.ts,
  }))
}

export async function listMetricSpecs(): Promise<MetricPoint[]> {
  const res = await axios.get<BackendMetric[] | { data?: BackendMetric[] }>(
    '/api/v1/monitor/metricspec',
    { headers: authHeader() },
  )
  const arr = Array.isArray(res.data) ? res.data : (res.data.data ?? [])
  return arr.map(m => ({
    name: m.name,
    value: m.value,
    unit: m.unit,
    label: m.label,
  }))
}

export interface RealtimeQuery {
  metrics: string[]
  range_seconds?: number
  group_by?: string[]
}

export async function queryRealtime(q: RealtimeQuery): Promise<MetricPoint[]> {
  const res = await axios.put<BackendMetric[] | { data?: BackendMetric[] }>(
    '/api/v1/monitor/realtime',
    q,
    { headers: authHeader() },
  )
  const arr = Array.isArray(res.data) ? res.data : (res.data.data ?? [])
  return arr.map(m => ({
    name: m.name,
    value: m.value,
    unit: m.unit,
    label: m.label,
    ts: m.ts,
  }))
}
