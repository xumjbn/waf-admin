// report API adapter（live）
//
// 端点：GET /api/v1/reports/timing
// 后端 timing report 是周期性任务，对应 UI 报表中心『定时任务』列表。
// 其他三类（custom/combined/manual）暂不展示在 NW · 08 首页，留待 PR 扩展。

import axios from 'axios'
import { useAuthStore } from '@/store/auth'

export interface ReportTask {
  id: number      // 定时报表 id（开关 / 触发用）
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
    id: b.id,
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

// 启用/停用定时任务 —— 调度器据此决定是否到点执行。
export async function setReportTaskEnabled(id: number, enabled: boolean): Promise<void> {
  await axios.post(
    `/api/v1/reports/timing/${id}/enabled`,
    { enabled },
    { headers: authHeader() },
  )
}

// --- 统一列表（NW · 08 报表中心 - migration 000014 起）

export type ReportKind = 'custom' | 'combined' | 'timing' | 'manual'

export interface ReportUnifiedItem {
  id: number
  type: ReportKind
  name: string
  description: string
  schedule: string
  is_enabled: boolean
  last_run_at?: string | null
  next_run_at?: string | null
  created_at: string
}

export async function listAllReports(): Promise<ReportUnifiedItem[]> {
  const res = await axios.get<{ data: ReportUnifiedItem[] }>('/api/v1/reports/all', { headers: authHeader() })
  return res.data.data ?? []
}

export async function runReport(kind: ReportKind, id: number): Promise<void> {
  await axios.post(`/api/v1/reports/${kind}/${id}/run`, {}, { headers: authHeader() })
}

// 下载报表（浏览器自动触发文件下载）。
export function downloadReportUrl(kind: ReportKind, id: number): string {
  return `/api/v1/reports/${kind}/${id}/download`
}

export async function downloadReport(kind: ReportKind, id: number): Promise<Blob> {
  const res = await axios.get(downloadReportUrl(kind, id), {
    headers: authHeader(),
    responseType: 'blob',
  })
  return res.data as Blob
}
