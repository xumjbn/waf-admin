// system upgrade API adapter（live）
//
// 端点（waf-control feat/backend-upgrade 起，migration 000016）：
//   GET    /api/v1/system/upgrades                列表（含 is_current/is_latest/type/...）
//   GET    /api/v1/system/upgrades/check          {current, latest, upgrade_available}
//   POST   /api/v1/system/upgrades                注册一条升级记录
//   POST   /api/v1/system/upgrades/{id}/trigger   触发安装
//   POST   /api/v1/system/upgrades/{id}/apply     标记安装完成（is_current=true）
//   DELETE /api/v1/system/upgrades/{id}

import axios from 'axios'
import { useAuthStore } from '@/store/auth'

export type UpgradeType = 'patch' | 'minor' | 'major' | 'security'
export type UpgradeChannel = 'stable' | 'beta' | 'dev'

export interface UpgradePackage {
  id: number
  version: string
  type: UpgradeType
  channel: UpgradeChannel
  fileName: string
  fileSize: number
  sizeLabel: string
  checksum: string
  downloadUrl: string
  notes: string
  changesSummary: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | string
  isCurrent: boolean
  isLatest: boolean
  releasedAt?: string | null
  appliedAt?: string | null
  createdAt: string
}

interface BackendUpgrade {
  id: number
  version: string
  type: string
  channel: string
  file_name: string
  file_size: number
  checksum: string
  download_url: string
  notes: string
  changes_summary: string
  status: string
  is_current: boolean
  is_latest: boolean
  released_at?: string | null
  applied_at?: string | null
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
    type: (b.type as UpgradeType) || 'patch',
    channel: (b.channel as UpgradeChannel) || 'stable',
    fileName: b.file_name,
    fileSize: b.file_size,
    sizeLabel: humanSize(b.file_size),
    checksum: b.checksum || '',
    downloadUrl: b.download_url || '',
    notes: b.notes || '',
    changesSummary: b.changes_summary || '',
    status: b.status,
    isCurrent: !!b.is_current,
    isLatest: !!b.is_latest,
    releasedAt: b.released_at,
    appliedAt: b.applied_at,
    createdAt: b.created_at,
  }
}

export async function listUpgrades(): Promise<UpgradePackage[]> {
  const res = await axios.get<BackendUpgrade[] | { data?: BackendUpgrade[]; upgrades?: BackendUpgrade[] }>(
    '/api/v1/system/upgrades',
    { headers: authHeader() },
  )
  const arr = Array.isArray(res.data) ? res.data : (res.data.data ?? res.data.upgrades ?? [])
  return arr.map(adapt)
}

export interface UpgradeCheckResult {
  current: UpgradePackage | null
  latest: UpgradePackage | null
  upgradeAvailable: boolean
}

export async function checkUpgrade(): Promise<UpgradeCheckResult> {
  const res = await axios.get<{
    current: BackendUpgrade | null
    latest: BackendUpgrade | null
    upgrade_available: boolean
  }>('/api/v1/system/upgrades/check', { headers: authHeader() })
  return {
    current: res.data.current ? adapt(res.data.current) : null,
    latest: res.data.latest ? adapt(res.data.latest) : null,
    upgradeAvailable: !!res.data.upgrade_available,
  }
}

export interface CreateUpgradePayload {
  version: string
  type?: UpgradeType
  channel?: UpgradeChannel
  fileName: string
  fileSize: number
  checksum?: string
  downloadUrl?: string
  notes?: string
  changesSummary?: string
  releasedAt?: string
  isLatest?: boolean
}

export async function createUpgrade(p: CreateUpgradePayload): Promise<UpgradePackage> {
  const res = await axios.post<BackendUpgrade>(
    '/api/v1/system/upgrades',
    {
      version: p.version,
      type: p.type,
      channel: p.channel,
      file_name: p.fileName,
      file_size: p.fileSize,
      checksum: p.checksum,
      download_url: p.downloadUrl,
      notes: p.notes,
      changes_summary: p.changesSummary,
      released_at: p.releasedAt,
      is_latest: p.isLatest,
    },
    { headers: authHeader() },
  )
  return adapt(res.data)
}

export async function triggerUpgrade(id: number): Promise<void> {
  await axios.post(`/api/v1/system/upgrades/${id}/trigger`, {}, { headers: authHeader() })
}

export async function applyUpgrade(id: number): Promise<void> {
  await axios.post(`/api/v1/system/upgrades/${id}/apply`, {}, { headers: authHeader() })
}

export async function deleteUpgrade(id: number): Promise<void> {
  await axios.delete(`/api/v1/system/upgrades/${id}`, { headers: authHeader() })
}
