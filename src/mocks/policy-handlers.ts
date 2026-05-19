// MSW handlers for policy management module
// 对照 API_REFERENCE.md §3 + §1.8-1.9 + §6
import { http, HttpResponse } from 'msw'
import type {
  Policy,
  Category,
  Rule,
  CustomParameter,
  GlobalCustomRule,
  CustomRuleNode,
  ChangeHistoryItem,
} from '../api/types/policy'

// === 内存数据存储 ===

let policies: Policy[] = [
  { id: 'policy-001', name: '高级防护策略', policy_level: 'high', engine_mode: 'block' },
  { id: 'policy-002', name: '中级防护策略', policy_level: 'medium', engine_mode: 'warning' },
  { id: 'policy-003', name: '低级防护策略', policy_level: 'low', engine_mode: 'disable' },
]

let categories: Category[] = [
  {
    name: 'sql_injection',
    display_name: 'SQL注入',
    state: 'enable',
    enabled: true,
    policy_id: 'policy-001',
  },
  {
    name: 'xss',
    display_name: '跨站脚本',
    state: 'enable',
    enabled: true,
    policy_id: 'policy-001',
  },
  {
    name: 'command_injection',
    display_name: '命令注入',
    state: 'enable',
    enabled: true,
    policy_id: 'policy-001',
  },
  {
    name: 'path_traversal',
    display_name: '路径遍历',
    state: 'enable',
    enabled: true,
    policy_id: 'policy-001',
  },
  {
    name: 'file_upload',
    display_name: '文件上传',
    state: 'disable',
    enabled: false,
    policy_id: 'policy-001',
  },
  {
    name: 'sql_injection',
    display_name: 'SQL注入',
    state: 'enable',
    enabled: true,
    policy_id: 'policy-002',
  },
  {
    name: 'xss',
    display_name: '跨站脚本',
    state: 'enable',
    enabled: true,
    policy_id: 'policy-002',
  },
  {
    name: 'command_injection',
    display_name: '命令注入',
    state: 'disable',
    enabled: false,
    policy_id: 'policy-002',
  },
  {
    name: 'sql_injection',
    display_name: 'SQL注入',
    state: 'disable',
    enabled: false,
    policy_id: 'policy-003',
  },
  {
    name: 'xss',
    display_name: '跨站脚本',
    state: 'disable',
    enabled: false,
    policy_id: 'policy-003',
  },
]

let rules: Rule[] = [
  {
    id: 'rule-001',
    policy_id: 'policy-001',
    state: 'enable',
    severity: 'critical',
    log: true,
    action: 'deny',
    url: '/admin/*',
    description: '管理后台SQL注入防护',
    enabled: true,
  },
  {
    id: 'rule-002',
    policy_id: 'policy-001',
    state: 'enable',
    severity: 'high',
    log: true,
    action: 'deny',
    url: '/api/*',
    description: 'API接口XSS防护',
    enabled: true,
  },
  {
    id: 'rule-003',
    policy_id: 'policy-001',
    state: 'enable',
    severity: 'medium',
    log: true,
    action: 'pass',
    url: '/upload',
    description: '文件上传检测',
    enabled: true,
  },
  {
    id: 'rule-004',
    policy_id: 'policy-002',
    state: 'enable',
    severity: 'high',
    log: true,
    action: 'deny',
    url: '/*',
    description: '通用SQL注入防护',
    enabled: true,
  },
  {
    id: 'rule-005',
    policy_id: 'policy-002',
    state: 'disable',
    severity: 'medium',
    log: false,
    action: 'pass',
    url: '/*',
    description: '通用XSS检测',
    enabled: false,
  },
]

let customParameters: CustomParameter[] = [
  { name: 'max_file_size', value: 10485760, default_value: 10485760, policy_id: 'policy-001' },
  { name: 'request_cookie_sizes', value: 4096, default_value: 4096, policy_id: 'policy-001' },
  { name: 'request_filename_sizes', value: 1024, default_value: 1024, policy_id: 'policy-001' },
  {
    name: 'combined_file_sizes',
    value: 52428800,
    default_value: 52428800,
    policy_id: 'policy-001',
  },
  { name: 'arg_length', value: 8192, default_value: 8192, policy_id: 'policy-001' },
  { name: 'arg_name_length', value: 256, default_value: 256, policy_id: 'policy-001' },
  { name: 'arg_number', value: 100, default_value: 100, policy_id: 'policy-001' },
  { name: 'request_uri_sizes', value: 8192, default_value: 8192, policy_id: 'policy-001' },
  { name: 'request_header_sizes', value: 8192, default_value: 8192, policy_id: 'policy-001' },
]

let globalCustomRules: GlobalCustomRule[] = [
  {
    id: 'gcr-001',
    name: '自定义SQL注入规则',
    type: 'and',
    position: 'before',
    severity: 'critical',
    log: true,
    action: 'deny',
    url: '/api/*',
    state: true,
    site_id: 'site-001',
  },
  {
    id: 'gcr-002',
    name: '自定义XSS规则',
    type: 'or',
    position: 'after',
    severity: 'high',
    log: true,
    action: 'deny',
    url: '/*',
    state: true,
    site_id: 'site-001',
  },
  {
    id: 'gcr-003',
    name: '自定义命令注入规则',
    type: 'and',
    position: 'before',
    severity: 'high',
    log: true,
    action: 'drop',
    url: '/exec',
    state: false,
    site_id: 'site-002',
  },
]

let customRuleNodes: CustomRuleNode[] = [
  {
    id: 'crn-001',
    rule_id: 'gcr-001',
    variable: 'ARGS',
    match: 'union.*select',
    lowercase: true,
    length: false,
    decodeurl: true,
    decodehtml: false,
    decodebase64: false,
    decodehex: false,
  },
  {
    id: 'crn-002',
    rule_id: 'gcr-001',
    variable: 'REQUEST_BODY',
    match: 'drop.*table',
    lowercase: true,
    length: false,
    decodeurl: true,
    decodehtml: false,
    decodebase64: false,
    decodehex: false,
  },
  {
    id: 'crn-003',
    rule_id: 'gcr-002',
    variable: 'ARGS',
    match: '<script',
    lowercase: true,
    length: false,
    decodeurl: true,
    decodehtml: true,
    decodebase64: false,
    decodehex: false,
  },
  {
    id: 'crn-004',
    rule_id: 'gcr-003',
    variable: 'ARGS',
    match: 'bash|sh|cmd',
    lowercase: true,
    length: false,
    decodeurl: true,
    decodehtml: false,
    decodebase64: false,
    decodehex: false,
  },
]

let changeHistory: ChangeHistoryItem[] = [
  {
    timestamp: '2024-06-15T10:30:00Z',
    user: 'admin',
    action: 'update',
    details: '更新策略引擎模式为阻断',
  },
  {
    timestamp: '2024-06-10T14:20:00Z',
    user: 'admin',
    action: 'create',
    details: '创建高级防护策略',
  },
  {
    timestamp: '2024-05-20T09:00:00Z',
    user: 'security',
    action: 'update',
    details: '启用SQL注入防护分类',
  },
]

// === 辅助函数 ===

const genId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

// === 策略 CRUD ===

export const policyHandlers = [
  // GET /v1/policies
  http.get('/v1/policies', () => HttpResponse.json({ policies })),

  // GET /v1/policies/:id
  http.get('/v1/policies/:id', ({ params }) => {
    const policy = policies.find(p => p.id === params.id)
    return policy
      ? HttpResponse.json(policy)
      : HttpResponse.json({ error: '策略不存在' }, { status: 404 })
  }),

  // POST /v1/policies
  http.post('/v1/policies', async ({ request }) => {
    const body = (await request.json()) as Partial<Policy>
    const newPolicy: Policy = { id: genId('policy'), ...body } as Policy
    policies = [...policies, newPolicy]
    return HttpResponse.json(newPolicy, { status: 201 })
  }),

  // PUT /v1/policies/:id
  http.put('/v1/policies/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Policy>
    const index = policies.findIndex(p => p.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ error: '策略不存在' }, { status: 404 })
    }
    const updated = { ...policies[index], ...body }
    policies = [...policies.slice(0, index), updated, ...policies.slice(index + 1)]
    return HttpResponse.json(updated)
  }),

  // DELETE /v1/policies/:id
  http.delete('/v1/policies/:id', ({ params }) => {
    const index = policies.findIndex(p => p.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ error: '策略不存在' }, { status: 404 })
    }
    policies = [...policies.slice(0, index), ...policies.slice(index + 1)]
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /v1/policies/:id/change_history
  http.get('/v1/policies/:id/change_history', ({ params }) => {
    const policy = policies.find(p => p.id === params.id)
    if (!policy) {
      return HttpResponse.json({ error: '策略不存在' }, { status: 404 })
    }
    return HttpResponse.json({ history: changeHistory })
  }),

  // POST /v1/policies/upgrade
  http.post('/v1/policies/upgrade', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ message: '策略升级成功', data: body })
  }),

  // GET /v1/policies/upgrade/log
  http.get('/v1/policies/upgrade/log', () =>
    HttpResponse.json({ logs: [{ timestamp: '2024-06-15T10:00:00Z', message: '策略升级完成' }] }),
  ),

  // === 分类 ===

  // GET /v1/policies/:policyId/categories
  http.get('/v1/policies/:policyId/categories', ({ params }) =>
    HttpResponse.json({ categories: categories.filter(c => c.policy_id === params.policyId) }),
  ),

  // GET /v1/policies/:policyId/categories/:id
  http.get('/v1/policies/:policyId/categories/:id', ({ params }) => {
    const category = categories.find(c => c.name === params.id && c.policy_id === params.policyId)
    return category
      ? HttpResponse.json(category)
      : HttpResponse.json({ error: '分类不存在' }, { status: 404 })
  }),

  // PUT /v1/policies/:policyId/categories/:id
  http.put('/v1/policies/:policyId/categories/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Category>
    const index = categories.findIndex(c => c.name === params.id && c.policy_id === params.policyId)
    if (index === -1) {
      return HttpResponse.json({ error: '分类不存在' }, { status: 404 })
    }
    const updated = { ...categories[index], ...body }
    categories = [...categories.slice(0, index), updated, ...categories.slice(index + 1)]
    return HttpResponse.json(updated)
  }),

  // === 规则 ===

  // GET /v1/policies/:policyId/rules
  http.get('/v1/policies/:policyId/rules', ({ params }) =>
    HttpResponse.json({ rules: rules.filter(r => r.policy_id === params.policyId) }),
  ),

  // GET /v1/policies/:policyId/rules/:id
  http.get('/v1/policies/:policyId/rules/:id', ({ params }) => {
    const rule = rules.find(r => r.id === params.id && r.policy_id === params.policyId)
    return rule
      ? HttpResponse.json(rule)
      : HttpResponse.json({ error: '规则不存在' }, { status: 404 })
  }),

  // PUT /v1/policies/:policyId/rules/:id
  http.put('/v1/policies/:policyId/rules/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Rule>
    const index = rules.findIndex(r => r.id === params.id && r.policy_id === params.policyId)
    if (index === -1) {
      return HttpResponse.json({ error: '规则不存在' }, { status: 404 })
    }
    const updated = { ...rules[index], ...body }
    rules = [...rules.slice(0, index), updated, ...rules.slice(index + 1)]
    return HttpResponse.json(updated)
  }),

  // === 自定义参数 ===

  // GET /v1/policies/:policyId/custom_parameters
  http.get('/v1/policies/:policyId/custom_parameters', ({ params }) =>
    HttpResponse.json({
      parameters: customParameters.filter(p => p.policy_id === params.policyId),
    }),
  ),

  // GET /v1/policies/:policyId/default_custom_parameters
  http.get('/v1/policies/:policyId/default_custom_parameters', ({ params }) => {
    const defaults = customParameters
      .filter(p => p.policy_id === params.policyId)
      .map(p => ({ ...p, value: p.default_value }))
    return HttpResponse.json({ parameters: defaults })
  }),

  // PUT /v1/policies/:policyId/custom_parameters/:name
  http.put('/v1/policies/:policyId/custom_parameters/:name', async ({ params, request }) => {
    const body = (await request.json()) as { value: number }
    const index = customParameters.findIndex(
      p => p.name === params.name && p.policy_id === params.policyId,
    )
    if (index === -1) {
      return HttpResponse.json({ error: '参数不存在' }, { status: 404 })
    }
    const updated = { ...customParameters[index], value: body.value }
    customParameters = [
      ...customParameters.slice(0, index),
      updated,
      ...customParameters.slice(index + 1),
    ]
    return HttpResponse.json(updated)
  }),

  // DELETE /v1/policies/:policyId/custom_parameters/:name
  http.delete('/v1/policies/:policyId/custom_parameters/:name', ({ params }) => {
    const index = customParameters.findIndex(
      p => p.name === params.name && p.policy_id === params.policyId,
    )
    if (index === -1) {
      return HttpResponse.json({ error: '参数不存在' }, { status: 404 })
    }
    const param = customParameters[index]
    const reset = { ...param, value: param.default_value }
    customParameters = [
      ...customParameters.slice(0, index),
      reset,
      ...customParameters.slice(index + 1),
    ]
    return new HttpResponse(null, { status: 204 })
  }),

  // === 全局自定义规则 ===

  // GET /v1/custom_rules
  http.get('/v1/custom_rules', () => HttpResponse.json({ custom_rules: globalCustomRules })),

  // GET /v1/custom_rules/:id
  http.get('/v1/custom_rules/:id', ({ params }) => {
    const rule = globalCustomRules.find(r => r.id === params.id)
    return rule
      ? HttpResponse.json(rule)
      : HttpResponse.json({ error: '全局自定义规则不存在' }, { status: 404 })
  }),

  // POST /v1/custom_rules
  http.post('/v1/custom_rules', async ({ request }) => {
    const body = (await request.json()) as Partial<GlobalCustomRule>
    const newRule: GlobalCustomRule = { id: genId('gcr'), ...body } as GlobalCustomRule
    globalCustomRules = [...globalCustomRules, newRule]
    return HttpResponse.json(newRule, { status: 201 })
  }),

  // PUT /v1/custom_rules/:id
  http.put('/v1/custom_rules/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<GlobalCustomRule>
    const index = globalCustomRules.findIndex(r => r.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ error: '全局自定义规则不存在' }, { status: 404 })
    }
    const updated = { ...globalCustomRules[index], ...body }
    globalCustomRules = [
      ...globalCustomRules.slice(0, index),
      updated,
      ...globalCustomRules.slice(index + 1),
    ]
    return HttpResponse.json(updated)
  }),

  // DELETE /v1/custom_rules/:id
  http.delete('/v1/custom_rules/:id', ({ params }) => {
    const index = globalCustomRules.findIndex(r => r.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ error: '全局自定义规则不存在' }, { status: 404 })
    }
    globalCustomRules = [
      ...globalCustomRules.slice(0, index),
      ...globalCustomRules.slice(index + 1),
    ]
    return new HttpResponse(null, { status: 204 })
  }),

  // === 自定义规则节点 ===

  // GET /v1/custom_rules/:customRuleId/nodes
  http.get('/v1/custom_rules/:customRuleId/nodes', ({ params }) =>
    HttpResponse.json({ nodes: customRuleNodes.filter(n => n.rule_id === params.customRuleId) }),
  ),

  // GET /v1/custom_rules/:customRuleId/nodes/:id
  http.get('/v1/custom_rules/:customRuleId/nodes/:id', ({ params }) => {
    const node = customRuleNodes.find(n => n.id === params.id && n.rule_id === params.customRuleId)
    return node
      ? HttpResponse.json(node)
      : HttpResponse.json({ error: '节点不存在' }, { status: 404 })
  }),

  // POST /v1/custom_rules/:customRuleId/nodes
  http.post('/v1/custom_rules/:customRuleId/nodes', async ({ params, request }) => {
    const body = (await request.json()) as Partial<CustomRuleNode>
    const newNode: CustomRuleNode = {
      id: genId('crn'),
      rule_id: params.customRuleId as string,
      ...body,
    } as CustomRuleNode
    customRuleNodes = [...customRuleNodes, newNode]
    return HttpResponse.json(newNode, { status: 201 })
  }),

  // PUT /v1/custom_rules/:customRuleId/nodes/:id
  http.put('/v1/custom_rules/:customRuleId/nodes/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<CustomRuleNode>
    const index = customRuleNodes.findIndex(
      n => n.id === params.id && n.rule_id === params.customRuleId,
    )
    if (index === -1) {
      return HttpResponse.json({ error: '节点不存在' }, { status: 404 })
    }
    const updated = { ...customRuleNodes[index], ...body }
    customRuleNodes = [
      ...customRuleNodes.slice(0, index),
      updated,
      ...customRuleNodes.slice(index + 1),
    ]
    return HttpResponse.json(updated)
  }),

  // DELETE /v1/custom_rules/:customRuleId/nodes/:id
  http.delete('/v1/custom_rules/:customRuleId/nodes/:id', ({ params }) => {
    const index = customRuleNodes.findIndex(
      n => n.id === params.id && n.rule_id === params.customRuleId,
    )
    if (index === -1) {
      return HttpResponse.json({ error: '节点不存在' }, { status: 404 })
    }
    customRuleNodes = [...customRuleNodes.slice(0, index), ...customRuleNodes.slice(index + 1)]
    return new HttpResponse(null, { status: 204 })
  }),

  // PUT /v1/custom_rules/:customRuleId/nodes/:id/priority
  http.put('/v1/custom_rules/:customRuleId/nodes/:id/priority', async ({ params }) => {
    const index = customRuleNodes.findIndex(
      n => n.id === params.id && n.rule_id === params.customRuleId,
    )
    if (index === -1) {
      return HttpResponse.json({ error: '节点不存在' }, { status: 404 })
    }
    return HttpResponse.json({ message: 'ok' })
  }),

  // === 防病毒状态 ===

  // PUT /v1/anti_virus_status/:siteId
  http.put('/v1/anti_virus_status/:siteId', async ({ params, request }) => {
    const body = (await request.json()) as { enabled: boolean }
    return HttpResponse.json({ site_id: params.siteId, anti_virus: body.enabled })
  }),
]
