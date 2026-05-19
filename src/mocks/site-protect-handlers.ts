// MSW handlers — 站点防护子资源 (CC + CSRF + 加速器 + 自定义规则 + 防篡改 + 内容注入 + 防盗链)
// 对照 API_REFERENCE.md §1.5 - §1.12
import { http, HttpResponse } from 'msw'
import type {
  CcProtect,
  CsrfProtect,
  Accelerator,
  CustomRule,
  AntiTamper,
  ContentInto,
  AntiStealingLink,
} from '../api/types/site'
import {
  ccProtects,
  updateCcProtects,
  csrfProtects,
  updateCsrfProtects,
  accelerators,
  updateAccelerators,
  customRules,
  updateCustomRules,
  antiTampers,
  updateAntiTampers,
  contentIntos,
  updateContentIntos,
  antiStealingLinks,
  updateAntiStealingLinks,
  genId,
} from './site-mock-data'

export const siteProtectHandlers = [
  // === §1.5 CC 防护 ===

  http.get('/v1/protect_sites/:siteId/cc_protect', ({ params }) =>
    HttpResponse.json({ cc_protect: ccProtects.filter(c => c.site_id === params.siteId) }),
  ),

  http.get('/v1/protect_sites/:siteId/cc_protect/:id', ({ params }) => {
    const cc = ccProtects.find(c => c.id === params.id && c.site_id === params.siteId)
    return cc
      ? HttpResponse.json({ cc_protect: cc })
      : HttpResponse.json({ error: 'CC规则不存在' }, { status: 404 })
  }),

  http.post('/v1/protect_sites/:siteId/cc_protect', async ({ params, request }) => {
    const body = (await request.json()) as Partial<CcProtect>
    const newCc = { id: genId('cc'), site_id: params.siteId as string, ...body } as CcProtect
    updateCcProtects([...ccProtects, newCc])
    return HttpResponse.json({ cc_protect: newCc }, { status: 201 })
  }),

  http.put('/v1/protect_sites/:siteId/cc_protect/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<CcProtect>
    const idx = ccProtects.findIndex(c => c.id === params.id && c.site_id === params.siteId)
    if (idx === -1) return HttpResponse.json({ error: 'CC规则不存在' }, { status: 404 })
    const updated = { ...ccProtects[idx], ...body }
    updateCcProtects([...ccProtects.slice(0, idx), updated, ...ccProtects.slice(idx + 1)])
    return HttpResponse.json({ cc_protect: updated })
  }),

  http.delete('/v1/protect_sites/:siteId/cc_protect/:id', ({ params }) => {
    const idx = ccProtects.findIndex(c => c.id === params.id && c.site_id === params.siteId)
    if (idx === -1) return HttpResponse.json({ error: 'CC规则不存在' }, { status: 404 })
    updateCcProtects([...ccProtects.slice(0, idx), ...ccProtects.slice(idx + 1)])
    return new HttpResponse(null, { status: 204 })
  }),

  // === §1.6 CSRF 防护 ===

  http.get('/v1/protect_sites/:siteId/csrf_protect', ({ params }) =>
    HttpResponse.json({ csrf_protect: csrfProtects.filter(c => c.site_id === params.siteId) }),
  ),

  http.get('/v1/protect_sites/:siteId/csrf_protect/:id', ({ params }) => {
    const csrf = csrfProtects.find(c => c.id === params.id && c.site_id === params.siteId)
    return csrf
      ? HttpResponse.json({ csrf_protect: csrf })
      : HttpResponse.json({ error: 'CSRF规则不存在' }, { status: 404 })
  }),

  http.post('/v1/protect_sites/:siteId/csrf_protect', async ({ params, request }) => {
    const body = (await request.json()) as Partial<CsrfProtect>
    const newCsrf = { id: genId('csrf'), site_id: params.siteId as string, ...body } as CsrfProtect
    updateCsrfProtects([...csrfProtects, newCsrf])
    return HttpResponse.json({ csrf_protect: newCsrf }, { status: 201 })
  }),

  http.put('/v1/protect_sites/:siteId/csrf_protect/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<CsrfProtect>
    const idx = csrfProtects.findIndex(c => c.id === params.id && c.site_id === params.siteId)
    if (idx === -1) return HttpResponse.json({ error: 'CSRF规则不存在' }, { status: 404 })
    const updated = { ...csrfProtects[idx], ...body }
    updateCsrfProtects([...csrfProtects.slice(0, idx), updated, ...csrfProtects.slice(idx + 1)])
    return HttpResponse.json({ csrf_protect: updated })
  }),

  http.delete('/v1/protect_sites/:siteId/csrf_protect/:id', ({ params }) => {
    const idx = csrfProtects.findIndex(c => c.id === params.id && c.site_id === params.siteId)
    if (idx === -1) return HttpResponse.json({ error: 'CSRF规则不存在' }, { status: 404 })
    updateCsrfProtects([...csrfProtects.slice(0, idx), ...csrfProtects.slice(idx + 1)])
    return new HttpResponse(null, { status: 204 })
  }),

  // === §1.7 加速器 ===

  http.get('/v1/protect_sites/:siteId/accelerator', ({ params }) =>
    HttpResponse.json({ accelerator: accelerators.filter(a => a.site_id === params.siteId) }),
  ),

  http.get('/v1/protect_sites/:siteId/accelerator/:id', ({ params }) => {
    const acc = accelerators.find(a => a.id === params.id && a.site_id === params.siteId)
    return acc
      ? HttpResponse.json({ accelerator: acc })
      : HttpResponse.json({ error: '加速器不存在' }, { status: 404 })
  }),

  http.post('/v1/protect_sites/:siteId/accelerator', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Accelerator>
    const newAcc = { id: genId('acc'), site_id: params.siteId as string, ...body } as Accelerator
    updateAccelerators([...accelerators, newAcc])
    return HttpResponse.json({ accelerator: newAcc }, { status: 201 })
  }),

  http.put('/v1/protect_sites/:siteId/accelerator/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Accelerator>
    const idx = accelerators.findIndex(a => a.id === params.id && a.site_id === params.siteId)
    if (idx === -1) return HttpResponse.json({ error: '加速器不存在' }, { status: 404 })
    const updated = { ...accelerators[idx], ...body }
    updateAccelerators([...accelerators.slice(0, idx), updated, ...accelerators.slice(idx + 1)])
    return HttpResponse.json({ accelerator: updated })
  }),

  http.delete('/v1/protect_sites/:siteId/accelerator/:id', ({ params }) => {
    const idx = accelerators.findIndex(a => a.id === params.id && a.site_id === params.siteId)
    if (idx === -1) return HttpResponse.json({ error: '加速器不存在' }, { status: 404 })
    updateAccelerators([...accelerators.slice(0, idx), ...accelerators.slice(idx + 1)])
    return new HttpResponse(null, { status: 204 })
  }),

  // === §1.8 自定义规则 ===

  http.get('/v1/protect_sites/:siteId/custom_rules', ({ params }) =>
    HttpResponse.json({ custom_rules: customRules.filter(r => r.site_id === params.siteId) }),
  ),

  http.get('/v1/protect_sites/:siteId/custom_rules/:id', ({ params }) => {
    const rule = customRules.find(r => r.id === params.id && r.site_id === params.siteId)
    return rule
      ? HttpResponse.json({ custom_rule: rule })
      : HttpResponse.json({ error: '自定义规则不存在' }, { status: 404 })
  }),

  http.post('/v1/protect_sites/:siteId/custom_rules', async ({ params, request }) => {
    const body = (await request.json()) as Partial<CustomRule>
    const newRule = { id: genId('cr'), site_id: params.siteId as string, ...body } as CustomRule
    updateCustomRules([...customRules, newRule])
    return HttpResponse.json({ custom_rule: newRule }, { status: 201 })
  }),

  http.put('/v1/protect_sites/:siteId/custom_rules/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<CustomRule>
    const idx = customRules.findIndex(r => r.id === params.id && r.site_id === params.siteId)
    if (idx === -1) return HttpResponse.json({ error: '自定义规则不存在' }, { status: 404 })
    const updated = { ...customRules[idx], ...body }
    updateCustomRules([...customRules.slice(0, idx), updated, ...customRules.slice(idx + 1)])
    return HttpResponse.json({ custom_rule: updated })
  }),

  http.delete('/v1/protect_sites/:siteId/custom_rules/:id', ({ params }) => {
    const idx = customRules.findIndex(r => r.id === params.id && r.site_id === params.siteId)
    if (idx === -1) return HttpResponse.json({ error: '自定义规则不存在' }, { status: 404 })
    updateCustomRules([...customRules.slice(0, idx), ...customRules.slice(idx + 1)])
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete('/v1/custom_rules/remove/:id', ({ params }) => {
    updateCustomRules(customRules.filter(r => r.id !== params.id))
    return new HttpResponse(null, { status: 204 })
  }),

  http.put('/v1/protect_sites/:siteId/custom_rules/:id/priority', async ({ params, request }) => {
    const body = (await request.json()) as { priority: number }
    const idx = customRules.findIndex(r => r.id === params.id && r.site_id === params.siteId)
    if (idx === -1) return HttpResponse.json({ error: '自定义规则不存在' }, { status: 404 })
    const updated = { ...customRules[idx], priority: body.priority }
    updateCustomRules([...customRules.slice(0, idx), updated, ...customRules.slice(idx + 1)])
    return HttpResponse.json({ message: 'ok' })
  }),

  // === §1.10 防篡改 ===

  http.get('/v1/protect_sites/:siteId/anti_tamper', ({ params }) =>
    HttpResponse.json({ anti_tamper: antiTampers.filter(a => a.site_id === params.siteId) }),
  ),

  http.get('/v1/protect_sites/:siteId/anti_tamper/:id', ({ params }) => {
    const at = antiTampers.find(a => a.id === params.id && a.site_id === params.siteId)
    return at
      ? HttpResponse.json({ anti_tamper: at })
      : HttpResponse.json({ error: '防篡改规则不存在' }, { status: 404 })
  }),

  http.post('/v1/protect_sites/:siteId/anti_tamper', async ({ params, request }) => {
    const body = (await request.json()) as Partial<AntiTamper>
    const newAt = { id: genId('at'), site_id: params.siteId as string, ...body } as AntiTamper
    updateAntiTampers([...antiTampers, newAt])
    return HttpResponse.json({ anti_tamper: newAt }, { status: 201 })
  }),

  http.put('/v1/protect_sites/:siteId/anti_tamper/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<AntiTamper>
    const idx = antiTampers.findIndex(a => a.id === params.id && a.site_id === params.siteId)
    if (idx === -1) return HttpResponse.json({ error: '防篡改规则不存在' }, { status: 404 })
    const updated = { ...antiTampers[idx], ...body }
    updateAntiTampers([...antiTampers.slice(0, idx), updated, ...antiTampers.slice(idx + 1)])
    return HttpResponse.json({ anti_tamper: updated })
  }),

  http.delete('/v1/protect_sites/:siteId/anti_tamper/:id', ({ params }) => {
    const idx = antiTampers.findIndex(a => a.id === params.id && a.site_id === params.siteId)
    if (idx === -1) return HttpResponse.json({ error: '防篡改规则不存在' }, { status: 404 })
    updateAntiTampers([...antiTampers.slice(0, idx), ...antiTampers.slice(idx + 1)])
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete(
    '/v1/protect_sites/:siteId/anti_tamper_study',
    () => new HttpResponse(null, { status: 204 }),
  ),

  http.get('/v1/protect_sites/:siteId/anti_tamper_study', () =>
    HttpResponse.json({ study_data: [] }),
  ),

  // === §1.11 内容注入 ===

  http.get('/v1/protect_sites/:siteId/content_into', ({ params }) =>
    HttpResponse.json({ content_into: contentIntos.filter(c => c.site_id === params.siteId) }),
  ),

  http.get('/v1/protect_sites/:siteId/content_into/:id', ({ params }) => {
    const ci = contentIntos.find(c => c.id === params.id && c.site_id === params.siteId)
    return ci
      ? HttpResponse.json({ content_into: ci })
      : HttpResponse.json({ error: '内容注入规则不存在' }, { status: 404 })
  }),

  http.post('/v1/protect_sites/:siteId/content_into', async ({ params, request }) => {
    const body = (await request.json()) as Partial<ContentInto>
    const newCi = { id: genId('ci'), site_id: params.siteId as string, ...body } as ContentInto
    updateContentIntos([...contentIntos, newCi])
    return HttpResponse.json({ content_into: newCi }, { status: 201 })
  }),

  http.put('/v1/protect_sites/:siteId/content_into/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<ContentInto>
    const idx = contentIntos.findIndex(c => c.id === params.id && c.site_id === params.siteId)
    if (idx === -1) return HttpResponse.json({ error: '内容注入规则不存在' }, { status: 404 })
    const updated = { ...contentIntos[idx], ...body }
    updateContentIntos([...contentIntos.slice(0, idx), updated, ...contentIntos.slice(idx + 1)])
    return HttpResponse.json({ content_into: updated })
  }),

  http.delete('/v1/protect_sites/:siteId/content_into/:id', ({ params }) => {
    const idx = contentIntos.findIndex(c => c.id === params.id && c.site_id === params.siteId)
    if (idx === -1) return HttpResponse.json({ error: '内容注入规则不存在' }, { status: 404 })
    updateContentIntos([...contentIntos.slice(0, idx), ...contentIntos.slice(idx + 1)])
    return new HttpResponse(null, { status: 204 })
  }),

  // === §1.12 防盗链 ===

  http.get('/v1/anti_stealing_link', () =>
    HttpResponse.json({ anti_stealing_link: antiStealingLinks }),
  ),

  http.get('/v1/anti_stealing_link/:id', ({ params }) => {
    const asl = antiStealingLinks.find(a => a.id === params.id)
    return asl
      ? HttpResponse.json({ anti_stealing_link: asl })
      : HttpResponse.json({ error: '防盗链规则不存在' }, { status: 404 })
  }),

  http.post('/v1/anti_stealing_link', async ({ request }) => {
    const body = (await request.json()) as Partial<AntiStealingLink>
    const newAsl = { id: genId('asl'), ...body } as AntiStealingLink
    updateAntiStealingLinks([...antiStealingLinks, newAsl])
    return HttpResponse.json({ anti_stealing_link: newAsl }, { status: 201 })
  }),

  http.put('/v1/anti_stealing_link/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<AntiStealingLink>
    const idx = antiStealingLinks.findIndex(a => a.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '防盗链规则不存在' }, { status: 404 })
    const updated = { ...antiStealingLinks[idx], ...body }
    updateAntiStealingLinks([
      ...antiStealingLinks.slice(0, idx),
      updated,
      ...antiStealingLinks.slice(idx + 1),
    ])
    return HttpResponse.json({ anti_stealing_link: updated })
  }),

  http.delete('/v1/anti_stealing_link/:id', ({ params }) => {
    const idx = antiStealingLinks.findIndex(a => a.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '防盗链规则不存在' }, { status: 404 })
    updateAntiStealingLinks([
      ...antiStealingLinks.slice(0, idx),
      ...antiStealingLinks.slice(idx + 1),
    ])
    return new HttpResponse(null, { status: 204 })
  }),
]
