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

// --- KPI snapshot（NW · 02 仪表盘顶部 5 张卡）

export interface KPISnapshot {
  blockedToday: number
  totalRequestsToday: number
  avgLatencyMs: number
  blockedRatePct: number
  activeHighAlerts: number
  sparkBlocked: number[]
  sparkRequests: number[]
  sparkLatency: number[]
  sparkBlockRate: number[]
  sparkAlerts: number[]
  generatedAt: string
}

interface BackendKPI {
  blocked_today: number
  total_requests_today: number
  avg_latency_ms: number
  blocked_rate_pct: number
  active_high_alerts: number
  spark_blocked: number[]
  spark_requests: number[]
  spark_latency: number[]
  spark_block_rate: number[]
  spark_alerts: number[]
  generated_at: string
}

export async function fetchKpiSnapshot(): Promise<KPISnapshot> {
  const res = await axios.get<BackendKPI>('/api/v1/monitor/kpi', { headers: authHeader() })
  const b = res.data
  return {
    blockedToday: b.blocked_today,
    totalRequestsToday: b.total_requests_today,
    avgLatencyMs: b.avg_latency_ms,
    blockedRatePct: b.blocked_rate_pct,
    activeHighAlerts: b.active_high_alerts,
    sparkBlocked: b.spark_blocked ?? [],
    sparkRequests: b.spark_requests ?? [],
    sparkLatency: b.spark_latency ?? [],
    sparkBlockRate: b.spark_block_rate ?? [],
    sparkAlerts: b.spark_alerts ?? [],
    generatedAt: b.generated_at,
  }
}
