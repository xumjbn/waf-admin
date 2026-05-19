// system upgrade API adapter（live）
//
// 端点：
//   GET    /api/v1/system/upgrades                → BackendUpgrade[]
//   POST   /api/v1/system/upgrades                → create record from uploaded package
//   POST   /api/v1/system/upgrades/{id}/trigger   → execute upgrade
//   DELETE /api/v1/system/upgrades/{id}
//
// 字段以 PageUpgrade 的 VersionEntry 形态为准（v / d / size / notes / status）。

import axios from 'axios'
import { useAuthStore } from '@/store/auth'

export interface UpgradePackage {
  id: number
  version: string
  fileName: string
  fileSize: number
  sizeLabel: string
  status: string
  createdAt: string
}

interface BackendUpgrade {
  id: number
  version: string
  file_name: string
  file_size: number
  status: string
  created_at: string
  updated_at: string
}

function authHeader(): Record<string, string> {
  const t = useAuthStore.getState().token
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function humanSize(bytes: number): string {
  if (!bytes || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function adapt(b: BackendUpgrade): UpgradePackage {
  return {
    id: b.id,
    version: b.version,
    fileName: b.file_name,
    fileSize: b.file_size,
    sizeLabel: humanSize(b.file_size),
    status: b.status,
    createdAt: b.created_at,
  }
}

export async function listUpgrades(): Promise<UpgradePackage[]> {
  const res = await axios.get<BackendUpgrade[] | { data?: BackendUpgrade[]; upgrades?: BackendUpgrade[] }>(
    '/api/v1/system/upgrades',
    { headers: authHeader() },
  )
  const arr = Array.isArray(res.data)
    ? res.data
    : (res.data.data ?? res.data.upgrades ?? [])
  return arr.map(adapt)
}

export async function createUpgrade(p: { version: string; fileName: string; fileSize: number }): Promise<UpgradePackage> {
  const res = await axios.post<BackendUpgrade>(
    '/api/v1/system/upgrades',
    { version: p.version, file_name: p.fileName, file_size: p.fileSize },
    { headers: authHeader() },
  )
  return adapt(res.data)
}

export async function triggerUpgrade(id: number): Promise<void> {
  await axios.post(`/api/v1/system/upgrades/${id}/trigger`, {}, { headers: authHeader() })
}

export async function deleteUpgrade(id: number): Promise<void> {
  await axios.delete(`/api/v1/system/upgrades/${id}`, { headers: authHeader() })
}
