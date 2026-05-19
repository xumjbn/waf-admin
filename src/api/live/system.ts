// system API adapter（live）
//
// 端点：
//   GET    /api/v1/system/settings              → BackendSetting[] | { data }
//   PUT    /api/v1/system/settings              → upsert single
//   DELETE /api/v1/system/settings/{key}
//   GET    /api/v1/system/licenses
//   GET    /api/v1/system/upgrades              → upgrade history
//
// NW · 09 系统管理页主要是装饰性 chrome；本适配先暴露最常用的 settings
// list/upsert，license 与 upgrade 各起一个 hook 留给未来对接。

import axios from 'axios'
import { useAuthStore } from '@/store/auth'

export interface SystemSetting {
  key: string
  value: string
  description?: string
  updated_at?: string
}

interface BackendSetting {
  key: string
  value: string
  description?: string
  updated_at?: string
}

function authHeader(): Record<string, string> {
  const t = useAuthStore.getState().token
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export async function listSettings(): Promise<SystemSetting[]> {
  const res = await axios.get<BackendSetting[] | { data?: BackendSetting[]; items?: BackendSetting[] }>(
    '/api/v1/system/settings',
    { headers: authHeader() },
  )
  const arr = Array.isArray(res.data) ? res.data : (res.data.data ?? res.data.items ?? [])
  return arr.map(s => ({
    key: s.key,
    value: s.value,
    description: s.description,
    updated_at: s.updated_at,
  }))
}

export async function upsertSetting(s: SystemSetting): Promise<void> {
  await axios.put(
    '/api/v1/system/settings',
    { key: s.key, value: s.value, description: s.description ?? '' },
    { headers: authHeader() },
  )
}

export async function deleteSetting(key: string): Promise<void> {
  await axios.delete(`/api/v1/system/settings/${encodeURIComponent(key)}`, {
    headers: authHeader(),
  })
}

export interface SystemLicense {
  id: number
  customer: string
  product: string
  status: string
  expires_at?: string
}

export async function listLicenses(): Promise<SystemLicense[]> {
  const res = await axios.get<SystemLicense[] | { data?: SystemLicense[] }>(
    '/api/v1/system/licenses',
    { headers: authHeader() },
  )
  return Array.isArray(res.data) ? res.data : (res.data.data ?? [])
}
