// MSW handlers for ACL (访问控制) module
// 对照 API_REFERENCE.md §7 访问控制
import { http, HttpResponse } from 'msw'
import type { AclPolicy, AclRule } from '../api/types/acl'

// === 内存数据存储 ===

let aclPolicies: AclPolicy[] = [
  {
    id: 'acl-policy-001',
    name: '办公网络访问策略',
    description: '允许办公网络访问内部资源',
    enabled: true,
    priority: 1,
    rule_count: 3,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'acl-policy-002',
    name: '外部访问限制策略',
    description: '限制外部网络访问敏感资源',
    enabled: true,
    priority: 2,
    rule_count: 2,
    created_at: '2024-01-20T14:30:00Z',
  },
  {
    id: 'acl-policy-003',
    name: '测试环境策略',
    description: '测试环境访问控制',
    enabled: false,
    priority: 3,
    rule_count: 1,
    created_at: '2024-02-01T09:15:00Z',
  },
]

let aclRules: AclRule[] = [
  {
    id: 'acl-rule-001',
    policy_id: 'acl-policy-001',
    source_ip: '192.168.1.0/24',
    destination_ip: '10.0.0.0/8',
    port: '80,443',
    protocol: 'tcp',
    action: 'allow',
    enabled: true,
    description: '允许办公网访问内网HTTP/HTTPS',
    created_at: '2024-01-15T10:05:00Z',
  },
  {
    id: 'acl-rule-002',
    policy_id: 'acl-policy-001',
    source_ip: '192.168.1.0/24',
    destination_ip: '10.0.0.0/8',
    port: '22',
    protocol: 'tcp',
    action: 'allow',
    enabled: true,
    description: '允许办公网SSH访问',
    created_at: '2024-01-15T10:10:00Z',
  },
  {
    id: 'acl-rule-003',
    policy_id: 'acl-policy-001',
    source_ip: '0.0.0.0/0',
    destination_ip: '10.0.0.0/8',
    port: '*',
    protocol: 'any',
    action: 'deny',
    enabled: true,
    description: '拒绝其他所有访问',
    created_at: '2024-01-15T10:15:00Z',
  },
  {
    id: 'acl-rule-004',
    policy_id: 'acl-policy-002',
    source_ip: '0.0.0.0/0',
    destination_ip: '172.16.0.0/12',
    port: '3306,5432',
    protocol: 'tcp',
    action: 'deny',
    enabled: true,
    description: '禁止外部访问数据库端口',
    created_at: '2024-01-20T14:35:00Z',
  },
  {
    id: 'acl-rule-005',
    policy_id: 'acl-policy-002',
    source_ip: '10.0.0.0/8',
    destination_ip: '172.16.0.0/12',
    port: '3306,5432',
    protocol: 'tcp',
    action: 'allow',
    enabled: true,
    description: '允许内网访问数据库',
    created_at: '2024-01-20T14:40:00Z',
  },
  {
    id: 'acl-rule-006',
    policy_id: 'acl-policy-003',
    source_ip: '192.168.100.0/24',
    destination_ip: '192.168.200.0/24',
    port: '*',
    protocol: 'any',
    action: 'allow',
    enabled: false,
    description: '测试网段互通',
    created_at: '2024-02-01T09:20:00Z',
  },
]

// === 辅助函数 ===

const genId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

const recalcRuleCount = (policyId: string) => aclRules.filter(r => r.policy_id === policyId).length

// === Handlers ===

export const aclHandlers = [
  // GET /api/v1/acl_policies
  http.get('/api/v1/acl_policies', () => HttpResponse.json({ policies: aclPolicies })),

  // GET /api/v1/acl_policies/:id
  http.get('/api/v1/acl_policies/:id', ({ params }) => {
    const policy = aclPolicies.find(p => p.id === params.id)
    return policy
      ? HttpResponse.json(policy)
      : HttpResponse.json({ error: 'ACL策略不存在' }, { status: 404 })
  }),

  // POST /api/v1/acl_policies
  http.post('/api/v1/acl_policies', async ({ request }) => {
    const body = (await request.json()) as Partial<AclPolicy>
    const maxPriority = aclPolicies.reduce((max, p) => Math.max(max, p.priority), 0)
    const newPolicy: AclPolicy = {
      id: genId('acl-policy'),
      name: body.name ?? '',
      description: body.description,
      enabled: body.enabled ?? true,
      priority: maxPriority + 1,
      rule_count: 0,
      created_at: new Date().toISOString(),
    }
    aclPolicies = [...aclPolicies, newPolicy]
    return HttpResponse.json(newPolicy, { status: 201 })
  }),

  // PUT /api/v1/acl_policies/:id
  http.put('/api/v1/acl_policies/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<AclPolicy>
    const index = aclPolicies.findIndex(p => p.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ error: 'ACL策略不存在' }, { status: 404 })
    }
    const updated = { ...aclPolicies[index], ...body, updated_at: new Date().toISOString() }
    aclPolicies = [...aclPolicies.slice(0, index), updated, ...aclPolicies.slice(index + 1)]
    return HttpResponse.json(updated)
  }),

  // DELETE /api/v1/acl_policies/:id
  http.delete('/api/v1/acl_policies/:id', ({ params }) => {
    const index = aclPolicies.findIndex(p => p.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ error: 'ACL策略不存在' }, { status: 404 })
    }
    aclPolicies = [...aclPolicies.slice(0, index), ...aclPolicies.slice(index + 1)]
    aclRules = aclRules.filter(r => r.policy_id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),

  // PUT /api/v1/acl_policies/:id/priority
  http.put('/api/v1/acl_policies/:id/priority', async ({ params, request }) => {
    const body = (await request.json()) as { direction: 'up' | 'down' }
    const sorted = [...aclPolicies].sort((a, b) => a.priority - b.priority)
    const idx = sorted.findIndex(p => p.id === params.id)
    if (idx === -1) {
      return HttpResponse.json({ error: 'ACL策略不存在' }, { status: 404 })
    }
    const swapIdx = body.direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) {
      return HttpResponse.json({ error: '无法调整优先级' }, { status: 400 })
    }
    const tmpPriority = sorted[idx].priority
    sorted[idx] = { ...sorted[idx], priority: sorted[swapIdx].priority }
    sorted[swapIdx] = { ...sorted[swapIdx], priority: tmpPriority }
    aclPolicies = sorted
    return HttpResponse.json({ message: 'ok' })
  }),

  // === ACL 规则 ===

  // GET /api/v1/acl_policies/:policyId/rules
  http.get('/api/v1/acl_policies/:policyId/rules', ({ params }) =>
    HttpResponse.json({ rules: aclRules.filter(r => r.policy_id === params.policyId) }),
  ),

  // GET /api/v1/acl_policies/:policyId/rules/:id
  http.get('/api/v1/acl_policies/:policyId/rules/:id', ({ params }) => {
    const rule = aclRules.find(r => r.id === params.id && r.policy_id === params.policyId)
    return rule
      ? HttpResponse.json(rule)
      : HttpResponse.json({ error: 'ACL规则不存在' }, { status: 404 })
  }),

  // POST /api/v1/acl_policies/:policyId/rules
  http.post('/api/v1/acl_policies/:policyId/rules', async ({ params, request }) => {
    const body = (await request.json()) as Partial<AclRule>
    const policyId = params.policyId as string
    const newRule: AclRule = {
      id: genId('acl-rule'),
      policy_id: policyId,
      source_ip: body.source_ip,
      destination_ip: body.destination_ip,
      port: body.port,
      protocol: body.protocol ?? 'any',
      action: body.action ?? 'deny',
      enabled: body.enabled ?? true,
      description: body.description,
      created_at: new Date().toISOString(),
    }
    aclRules = [...aclRules, newRule]
    // 更新策略的 rule_count
    const pIdx = aclPolicies.findIndex(p => p.id === policyId)
    if (pIdx !== -1) {
      const updated = { ...aclPolicies[pIdx], rule_count: recalcRuleCount(policyId) }
      aclPolicies = [...aclPolicies.slice(0, pIdx), updated, ...aclPolicies.slice(pIdx + 1)]
    }
    return HttpResponse.json(newRule, { status: 201 })
  }),

  // PUT /api/v1/acl_policies/:policyId/rules/:id
  http.put('/api/v1/acl_policies/:policyId/rules/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<AclRule>
    const index = aclRules.findIndex(r => r.id === params.id && r.policy_id === params.policyId)
    if (index === -1) {
      return HttpResponse.json({ error: 'ACL规则不存在' }, { status: 404 })
    }
    const updated = { ...aclRules[index], ...body }
    aclRules = [...aclRules.slice(0, index), updated, ...aclRules.slice(index + 1)]
    return HttpResponse.json(updated)
  }),

  // DELETE /api/v1/acl_policies/:policyId/rules/:id
  http.delete('/api/v1/acl_policies/:policyId/rules/:id', ({ params }) => {
    const policyId = params.policyId as string
    const index = aclRules.findIndex(r => r.id === params.id && r.policy_id === policyId)
    if (index === -1) {
      return HttpResponse.json({ error: 'ACL规则不存在' }, { status: 404 })
    }
    aclRules = [...aclRules.slice(0, index), ...aclRules.slice(index + 1)]
    // 更新策略的 rule_count
    const pIdx = aclPolicies.findIndex(p => p.id === policyId)
    if (pIdx !== -1) {
      const updated = { ...aclPolicies[pIdx], rule_count: recalcRuleCount(policyId) }
      aclPolicies = [...aclPolicies.slice(0, pIdx), updated, ...aclPolicies.slice(pIdx + 1)]
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
