// MSW handlers — 站点核心 CRUD + LB + 实例 + ACL
// 对照 API_REFERENCE.md §1.1 - §1.4
import { http, HttpResponse } from 'msw'
import type { ProtectSite, LbMember, InstanceProtectMember, AclProtect } from '../api/types/site'
import {
  sites,
  updateSites,
  lbMembers,
  updateLbMembers,
  instanceMembers,
  updateInstanceMembers,
  aclProtects,
  updateAclProtects,
  genId,
} from './site-mock-data'

export const siteHandlers = [
  // === §1.1 站点 CRUD ===

  http.get('/v1/protect_sites', () => HttpResponse.json({ protect_sites: sites })),

  http.get('/v1/protect_sites/:id', ({ params }) => {
    const site = sites.find(s => s.id === params.id)
    return site
      ? HttpResponse.json({ protect_site: site })
      : HttpResponse.json({ error: '站点不存在' }, { status: 404 })
  }),

  http.post('/v1/protect_sites', async ({ request }) => {
    const body = (await request.json()) as Partial<ProtectSite>
    const newSite = {
      id: genId('site'),
      created_at: new Date().toISOString(),
      ...body,
    } as ProtectSite
    updateSites([...sites, newSite])
    return HttpResponse.json({ protect_site: newSite }, { status: 201 })
  }),

  http.put('/v1/protect_sites/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<ProtectSite>
    const idx = sites.findIndex(s => s.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '站点不存在' }, { status: 404 })
    const updated = { ...sites[idx], ...body }
    updateSites([...sites.slice(0, idx), updated, ...sites.slice(idx + 1)])
    return HttpResponse.json({ protect_site: updated })
  }),

  http.delete('/v1/protect_sites/:id', ({ params }) => {
    const idx = sites.findIndex(s => s.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '站点不存在' }, { status: 404 })
    updateSites([...sites.slice(0, idx), ...sites.slice(idx + 1)])
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/v1/site_and_protect', async ({ request }) => {
    const body = (await request.json()) as {
      site: Partial<ProtectSite>
      members: Partial<InstanceProtectMember>[]
    }
    const newSite = {
      id: genId('site'),
      created_at: new Date().toISOString(),
      ...body.site,
    } as ProtectSite
    updateSites([...sites, newSite])
    const newMembers = body.members.map(
      m => ({ id: genId('inst-m'), site_id: newSite.id, ...m }) as InstanceProtectMember,
    )
    updateInstanceMembers([...instanceMembers, ...newMembers])
    return HttpResponse.json({ protect_site: newSite }, { status: 201 })
  }),

  // === §1.2 LB 防护 ===

  http.get('/v1/protect_sites/:siteId/lbs', ({ params }) =>
    HttpResponse.json({ lbs: lbMembers.filter(m => m.site_id === params.siteId) }),
  ),

  http.get('/v1/protect_sites/:siteId/lbs/:id', ({ params }) => {
    const lb = lbMembers.find(m => m.id === params.id && m.site_id === params.siteId)
    return lb
      ? HttpResponse.json({ lb })
      : HttpResponse.json({ error: 'LB成员不存在' }, { status: 404 })
  }),

  http.post('/v1/protect_sites/:siteId/lbs', async ({ params, request }) => {
    const body = (await request.json()) as Partial<LbMember>
    const newLb = { id: genId('lb'), site_id: params.siteId as string, ...body } as LbMember
    updateLbMembers([...lbMembers, newLb])
    return HttpResponse.json({ lb: newLb }, { status: 201 })
  }),

  http.put('/v1/protect_sites/:siteId/lbs/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<LbMember>
    const idx = lbMembers.findIndex(m => m.id === params.id && m.site_id === params.siteId)
    if (idx === -1) return HttpResponse.json({ error: 'LB成员不存在' }, { status: 404 })
    const updated = { ...lbMembers[idx], ...body }
    updateLbMembers([...lbMembers.slice(0, idx), updated, ...lbMembers.slice(idx + 1)])
    return HttpResponse.json({ lb: updated })
  }),

  http.delete('/v1/protect_sites/:siteId/lbs/:id', ({ params }) => {
    const idx = lbMembers.findIndex(m => m.id === params.id && m.site_id === params.siteId)
    if (idx === -1) return HttpResponse.json({ error: 'LB成员不存在' }, { status: 404 })
    updateLbMembers([...lbMembers.slice(0, idx), ...lbMembers.slice(idx + 1)])
    return new HttpResponse(null, { status: 204 })
  }),

  // === §1.3 实例 防护成员 ===

  http.get('/v1/protect_sites/:siteId/instance_protect', ({ params }) =>
    HttpResponse.json({ instance_protect: instanceMembers.filter(m => m.site_id === params.siteId) }),
  ),

  http.get('/v1/protect_sites/:siteId/instance_protect/:id', ({ params }) => {
    const member = instanceMembers.find(m => m.id === params.id && m.site_id === params.siteId)
    return member
      ? HttpResponse.json({ instance_protect: member })
      : HttpResponse.json({ error: '实例成员不存在' }, { status: 404 })
  }),

  http.post('/v1/protect_sites/:siteId/instance_protect', async ({ params, request }) => {
    const body = (await request.json()) as Partial<InstanceProtectMember>
    const newMember = {
      id: genId('inst-m'),
      site_id: params.siteId as string,
      ...body,
    } as InstanceProtectMember
    updateInstanceMembers([...instanceMembers, newMember])
    return HttpResponse.json({ instance_protect: newMember }, { status: 201 })
  }),

  http.put('/v1/protect_sites/:siteId/instance_protect/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<InstanceProtectMember>
    const idx = instanceMembers.findIndex(m => m.id === params.id && m.site_id === params.siteId)
    if (idx === -1) return HttpResponse.json({ error: '实例成员不存在' }, { status: 404 })
    const updated = { ...instanceMembers[idx], ...body }
    updateInstanceMembers([...instanceMembers.slice(0, idx), updated, ...instanceMembers.slice(idx + 1)])
    return HttpResponse.json({ instance_protect: updated })
  }),

  http.delete('/v1/protect_sites/:siteId/instance_protect/:id', ({ params }) => {
    const idx = instanceMembers.findIndex(m => m.id === params.id && m.site_id === params.siteId)
    if (idx === -1) return HttpResponse.json({ error: '实例成员不存在' }, { status: 404 })
    updateInstanceMembers([...instanceMembers.slice(0, idx), ...instanceMembers.slice(idx + 1)])
    return new HttpResponse(null, { status: 204 })
  }),

  // === §1.4 ACL 防护 ===

  http.get('/v1/protect_sites/:siteId/acl_protect', ({ params }) =>
    HttpResponse.json({ acl_protect: aclProtects.filter(a => a.site_id === params.siteId) }),
  ),

  http.get('/v1/protect_sites/:siteId/acl_protect/:id', ({ params }) => {
    const acl = aclProtects.find(a => a.id === params.id && a.site_id === params.siteId)
    return acl
      ? HttpResponse.json({ acl_protect: acl })
      : HttpResponse.json({ error: 'ACL规则不存在' }, { status: 404 })
  }),

  http.post('/v1/protect_sites/:siteId/acl_protect', async ({ params, request }) => {
    const body = (await request.json()) as Partial<AclProtect>
    const newAcl = { id: genId('acl'), site_id: params.siteId as string, ...body } as AclProtect
    updateAclProtects([...aclProtects, newAcl])
    return HttpResponse.json({ acl_protect: newAcl }, { status: 201 })
  }),

  http.put('/v1/protect_sites/:siteId/acl_protect/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<AclProtect>
    const idx = aclProtects.findIndex(a => a.id === params.id && a.site_id === params.siteId)
    if (idx === -1) return HttpResponse.json({ error: 'ACL规则不存在' }, { status: 404 })
    const updated = { ...aclProtects[idx], ...body }
    updateAclProtects([...aclProtects.slice(0, idx), updated, ...aclProtects.slice(idx + 1)])
    return HttpResponse.json({ acl_protect: updated })
  }),

  http.delete('/v1/protect_sites/:siteId/acl_protect/:id', ({ params }) => {
    const idx = aclProtects.findIndex(a => a.id === params.id && a.site_id === params.siteId)
    if (idx === -1) return HttpResponse.json({ error: 'ACL规则不存在' }, { status: 404 })
    updateAclProtects([...aclProtects.slice(0, idx), ...aclProtects.slice(idx + 1)])
    return new HttpResponse(null, { status: 204 })
  }),

  http.put('/v1/protect_sites/:siteId/acl_protect/:id/priority', async ({ params }) => {
    const idx = aclProtects.findIndex(a => a.id === params.id && a.site_id === params.siteId)
    if (idx === -1) return HttpResponse.json({ error: 'ACL规则不存在' }, { status: 404 })
    return HttpResponse.json({ message: 'ok' })
  }),
]
