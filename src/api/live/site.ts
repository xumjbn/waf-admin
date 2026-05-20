// site API adapter（live = 真后端）
//
// 端点：
//   GET    /api/v1/sites               → { data: BackendSite[], total, page, size }
//   POST   /api/v1/sites               → { site: BackendSite } (handler 实测返回原对象，做容错)
//   PUT    /api/v1/sites/{id}
//   DELETE /api/v1/sites/{id}
//
// 字段以前端 src/mocks/nebula.ts Site 为准。后端无 rps / blockedRate / instance
// 三个运行时指标列，先回 0 / 占位，等做监控模块时再补 stats 端点。

import axios from 'axios'
import { useAuthStore } from '@/store/auth'
import type { Site } from '@/mocks/nebula'

interface BackendSite {
  id: number
  name: string
  domain: string
  listen_port: number
  ssl_enabled: boolean
  upstream?: unknown
  status: string
  waf_enabled?: boolean
  description?: string
  created_at?: string
  updated_at?: string
}

function authHeader(): Record<string, string> {
  const t = useAuthStore.getState().token
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function deriveProto(b: BackendSite): string {
  return b.ssl_enabled ? 'HTTPS' : 'HTTP'
}

function describeUpstream(u: unknown): string {
  if (!u) return '—'
  if (typeof u === 'string') return u
  // 后端 upstream 是 JSON：尝试取 servers 数组里第一个 host:port，否则 stringify
  try {
    const obj = u as { servers?: Array<{ host?: string; port?: number; address?: string }> }
    const first = obj.servers?.[0]
    if (first) {
      if (first.address) return first.address
      if (first.host && first.port) return `${first.host}:${first.port}`
    }
    return JSON.stringify(u).slice(0, 60)
  } catch {
    return '—'
  }
}

function mapStatus(s: string): Site['state'] {
  switch ((s || '').toLowerCase()) {
    case 'protected':
    case 'active':
    case 'enabled':
      return 'protected'
    case 'observe':
    case 'observing':
      return 'observe'
    case 'paused':
    case 'disabled':
    case 'inactive':
      return 'paused'
    default:
      return 'observe'
  }
}

function adapt(b: BackendSite): Site {
  return {
    id: String(b.id),
    name: b.name,
    domain: b.domain,
    proto: deriveProto(b),
    upstream: describeUpstream(b.upstream),
    instance: '—', // 后端无 site→instance 绑定字段；预留接入位
    rps: 0,
    blockedRate: 0,
    state: mapStatus(b.status),
  }
}

export async function listSites(): Promise<Site[]> {
  const res = await axios.get<{ data: BackendSite[]; total: number }>('/api/v1/sites', {
    headers: authHeader(),
    params: { page: 1, page_size: 100 },
  })
  return (res.data.data ?? []).map(adapt)
}

export interface CreateSitePayload {
  name: string
  domain: string
  listen_port?: number
  ssl_enabled?: boolean
  description?: string
  waf_enabled?: boolean
  upstream?: unknown
}

export async function createSite(p: CreateSitePayload): Promise<Site> {
  const body = {
    name: p.name,
    domain: p.domain,
    listen_port: p.listen_port ?? (p.ssl_enabled ? 443 : 80),
    ssl_enabled: !!p.ssl_enabled,
    ssl_cert: '',
    ssl_key: '',
    upstream: p.upstream ?? { servers: [] },
    waf_enabled: p.waf_enabled !== false,
    description: p.description ?? '',
  }
  const res = await axios.post<BackendSite | { site: BackendSite }>(
    '/api/v1/sites',
    body,
    { headers: authHeader() },
  )
  const raw = (res.data as { site?: BackendSite }).site ?? (res.data as BackendSite)
  return adapt(raw)
}

export async function updateSite(id: string, p: Partial<CreateSitePayload> & { status?: string }): Promise<Site> {
  const body: Record<string, unknown> = {}
  if (p.name !== undefined) body.name = p.name
  if (p.domain !== undefined) body.domain = p.domain
  if (p.listen_port !== undefined) body.listen_port = p.listen_port
  if (p.ssl_enabled !== undefined) body.ssl_enabled = p.ssl_enabled
  if (p.upstream !== undefined) body.upstream = p.upstream
  if (p.description !== undefined) body.description = p.description
  if (p.waf_enabled !== undefined) body.waf_enabled = p.waf_enabled
  if (p.status !== undefined) body.status = p.status
  const res = await axios.put<BackendSite | { site: BackendSite }>(
    `/api/v1/sites/${id}`,
    body,
    { headers: authHeader() },
  )
  const raw = (res.data as { site?: BackendSite }).site ?? (res.data as BackendSite)
  return adapt(raw)
}

export async function deleteSite(id: string): Promise<void> {
  await axios.delete(`/api/v1/sites/${id}`, { headers: authHeader() })
}

// ---------- 站点级防护模块 ----------
// 对应后端 site_modules 表（migration 000020）。每个站点对每个模块有
// (enabled, level) 配置；后端会自动补齐缺省值 enabled=true / level='medium'。

export interface SiteModuleConfig {
  site_id: number
  module: string                          // sqli / xss / rce / lfi-rfi / bot / rate-limit / ip-reputation / virtual-patches
  enabled: boolean
  level: 'low' | 'medium' | 'high'
}

export async function listSiteModules(siteId: string | number): Promise<SiteModuleConfig[]> {
  const res = await axios.get<{ data: SiteModuleConfig[] }>(`/api/v1/sites/${siteId}/modules`, {
    headers: authHeader(),
  })
  return res.data.data ?? []
}

export async function updateSiteModule(
  siteId: string | number,
  module: string,
  patch: Partial<Pick<SiteModuleConfig, 'enabled' | 'level'>>,
): Promise<SiteModuleConfig> {
  const res = await axios.put<SiteModuleConfig>(
    `/api/v1/sites/${siteId}/modules/${encodeURIComponent(module)}`,
    patch,
    { headers: authHeader() },
  )
  return res.data
}
