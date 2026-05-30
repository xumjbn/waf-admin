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

function adaptKpi(b: BackendKPI): KPISnapshot {
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

export async function fetchKpiSnapshot(): Promise<KPISnapshot> {
  const res = await axios.get<BackendKPI>('/api/v1/monitor/kpi', { headers: authHeader() })
  return adaptKpi(res.data)
}

// --- NW · 01 总览 dashboard 一次性聚合（KPI + TOP + 类型分布 + 7×24 热力图）

export interface TopThreatSource {
  srcIp: string
  country: string
  count: number
}

export interface AttackTypeSlice {
  type: string
  label: string
  color: string
  count: number
}

export interface DashboardSnapshot {
  kpi: KPISnapshot
  topSources: TopThreatSource[]
  attackTypes: AttackTypeSlice[]
  heatmap: number[][] // [7][24]
  generatedAt: string
}

interface BackendDashboard {
  kpi: BackendKPI
  top_sources: { src_ip: string; country: string; count: number }[] | null
  attack_types: { type: string; label: string; color: string; count: number }[] | null
  heatmap: number[][] | null
  generated_at: string
}

export async function fetchDashboard(window: '24h' | '7d' | '30d' = '24h'): Promise<DashboardSnapshot> {
  const res = await axios.get<BackendDashboard>(
    `/api/v1/monitor/dashboard?window=${window}`,
    { headers: authHeader() },
  )
  const b = res.data
  return {
    kpi: adaptKpi(b.kpi),
    topSources: (b.top_sources ?? []).map(s => ({
      srcIp: s.src_ip,
      country: s.country,
      count: s.count,
    })),
    attackTypes: (b.attack_types ?? []).map(a => ({
      type: a.type,
      label: a.label,
      color: a.color,
      count: a.count,
    })),
    heatmap: b.heatmap ?? [],
    generatedAt: b.generated_at,
  }
}

// --- NW · 02 监控大屏：近 N 分钟 req/block/chal 三路时序

export interface RealtimePoint {
  bucket: string
  requests: number
  blocked: number
  challenged: number
}

export interface RealtimeSeries {
  points: RealtimePoint[]
  topSources: TopThreatSource[]
  generatedAt: string
}

interface BackendRealtime {
  points: { bucket: string; requests: number; blocked: number; challenged: number }[] | null
  top_sources: { src_ip: string; country: string; count: number }[] | null
  generated_at: string
}

// --- NW · 02 集群资源水位（agent 心跳写入 monitor_metrics 的真实采集）

export interface ClusterResources {
  cpuAvgPct: number
  memAvgPct: number
  diskAvgPct: number
  netConnections: number
  rps: number
  nodeCount: number
  generatedAt: string
}

interface BackendClusterResources {
  cpu_avg_pct: number
  mem_avg_pct: number
  disk_avg_pct: number
  net_connections: number
  rps: number
  node_count: number
  generated_at: string
}

// --- NW · 01 站点防护评分（6 维，真配置聚合）

export async function fetchProtectionScore(): Promise<number[]> {
  const res = await axios.get<{ scores: number[] }>(
    '/api/v1/monitor/protection-score',
    { headers: authHeader() },
  )
  return res.data.scores ?? []
}

export async function fetchClusterResources(): Promise<ClusterResources> {
  const res = await axios.get<BackendClusterResources>(
    '/api/v1/monitor/cluster-resources',
    { headers: authHeader() },
  )
  const b = res.data
  return {
    cpuAvgPct: b.cpu_avg_pct ?? 0,
    memAvgPct: b.mem_avg_pct ?? 0,
    diskAvgPct: b.disk_avg_pct ?? 0,
    netConnections: b.net_connections ?? 0,
    rps: b.rps ?? 0,
    nodeCount: b.node_count ?? 0,
    generatedAt: b.generated_at,
  }
}

export async function fetchRealtimeSeries(minutes = 60): Promise<RealtimeSeries> {
  const res = await axios.get<BackendRealtime>(
    `/api/v1/monitor/realtime-series?minutes=${minutes}`,
    { headers: authHeader() },
  )
  const b = res.data
  return {
    points: (b.points ?? []).map(p => ({
      bucket: p.bucket,
      requests: p.requests,
      blocked: p.blocked,
      challenged: p.challenged,
    })),
    topSources: (b.top_sources ?? []).map(s => ({
      srcIp: s.src_ip,
      country: s.country,
      count: s.count,
    })),
    generatedAt: b.generated_at,
  }
}
