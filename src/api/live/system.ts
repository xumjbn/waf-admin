// system API adapter（live）
//
// 端点（waf-control feat/backend-system 起，migration 000015）：
//   GET    /api/v1/system/settings              → BackendSetting[] | { data }
//   PUT    /api/v1/system/settings              → upsert single
//   DELETE /api/v1/system/settings/{key}
//   GET    /api/v1/system/license               → 当前激活的许可证（单数）
//   GET    /api/v1/system/licenses              → 全部许可证（含 status）
//   POST   /api/v1/system/licenses              → 创建并激活新许可证
//   POST   /api/v1/system/licenses/{id}/activate
//   DELETE /api/v1/system/licenses/{id}
//
// NW · 09 系统管理页面同时消费 settings 列表 + 当前 license 卡。

import axios from 'axios'
import { useAuthStore } from '@/store/auth'

export interface SystemSetting {
  key: string
  value: string
  category?: string
  description?: string
  updated_at?: string
}

interface BackendSetting {
  key: string
  value: string
  category?: string
  description?: string
  updated_at?: string
}

function authHeader(): Record<string, string> {
  const t = useAuthStore.getState().token
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export async function listSettings(category?: string): Promise<SystemSetting[]> {
  const res = await axios.get<BackendSetting[] | { data?: BackendSetting[]; items?: BackendSetting[] }>(
    '/api/v1/system/settings',
    { headers: authHeader(), params: category ? { category } : undefined },
  )
  const arr = Array.isArray(res.data) ? res.data : (res.data.data ?? res.data.items ?? [])
  return arr.map(s => ({
    key: s.key,
    value: s.value,
    category: s.category,
    description: s.description,
    updated_at: s.updated_at,
  }))
}

export async function upsertSetting(s: SystemSetting): Promise<void> {
  await axios.put(
    '/api/v1/system/settings',
    { key: s.key, value: s.value, category: s.category ?? 'basic', description: s.description ?? '' },
    { headers: authHeader() },
  )
}

export async function deleteSetting(key: string): Promise<void> {
  await axios.delete(`/api/v1/system/settings/${encodeURIComponent(key)}`, { headers: authHeader() })
}

// --- License

export type LicenseStatus = 'active' | 'grace' | 'expired' | 'inactive'

export interface SystemLicense {
  id: number
  license_key: string
  product_name: string
  edition: 'community' | 'enterprise' | 'oem' | string
  customer: string
  contact_email: string
  max_nodes: number
  issued_at?: string
  expires_at?: string
  grace_until?: string | null
  is_active: boolean
  status: LicenseStatus
  created_at?: string
}

export async function listLicenses(): Promise<SystemLicense[]> {
  const res = await axios.get<{ data?: SystemLicense[] }>('/api/v1/system/licenses', { headers: authHeader() })
  return res.data.data ?? []
}

export async function currentLicense(): Promise<SystemLicense | null> {
  try {
    const res = await axios.get<SystemLicense>('/api/v1/system/license', { headers: authHeader() })
    return res.data
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null
    throw err
  }
}

export interface CreateLicensePayload {
  license_key: string
  product_name?: string
  edition?: SystemLicense['edition']
  customer?: string
  contact_email?: string
  max_nodes?: number
  expires_at: string  // RFC3339
  grace_until?: string
}

export async function createLicense(p: CreateLicensePayload): Promise<SystemLicense> {
  const res = await axios.post<SystemLicense>('/api/v1/system/licenses', p, { headers: authHeader() })
  return res.data
}

export async function activateLicense(id: number): Promise<void> {
  await axios.post(`/api/v1/system/licenses/${id}/activate`, {}, { headers: authHeader() })
}

export async function deleteLicense(id: number): Promise<void> {
  await axios.delete(`/api/v1/system/licenses/${id}`, { headers: authHeader() })
}
