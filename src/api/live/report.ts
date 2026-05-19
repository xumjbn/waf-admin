// report API adapter（live）
//
// 端点：GET /api/v1/reports/timing
// 后端 timing report 是周期性任务，对应 UI 报表中心『定时任务』列表。
// 其他三类（custom/combined/manual）暂不展示在 NW · 08 首页，留待 PR 扩展。

import axios from 'axios'
import { useAuthStore } from '@/store/auth'

export interface ReportTask {
  n: string       // 名称
  cr: string      // cron 表达式
  next: string    // 下次执行时间（格式化）
  on: boolean     // 启用状态
}

interface BackendTimingReport {
  id: number
  name: string
  cron: string
  next_run_at?: string
  is_enabled?: boolean
  enabled?: boolean
}

function authHeader(): Record<string, string> {
  const t = useAuthStore.getState().token
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function fmtTime(s?: string): string {
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').replace(/:\d+$/, '')
}

function adapt(b: BackendTimingReport): ReportTask {
  return {
    n: b.name,
    cr: b.cron || '—',
    next: fmtTime(b.next_run_at),
    on: b.is_enabled ?? b.enabled ?? true,
  }
}

export async function listReportTasks(): Promise<ReportTask[]> {
  const res = await axios.get<BackendTimingReport[] | { data?: BackendTimingReport[]; items?: BackendTimingReport[] }>(
    '/api/v1/reports/timing',
    { headers: authHeader() },
  )
  const arr = Array.isArray(res.data) ? res.data : (res.data.data ?? res.data.items ?? [])
  return arr.map(adapt)
}
