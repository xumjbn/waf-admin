import { describe, it, expect, vi, beforeEach } from 'vitest'

// 对照 API_REFERENCE.md §3, §1.8-1.9, §6
vi.mock('../request', () => ({
  requestV1: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}))

import * as api from '../policy'
import { requestV1 } from '../request'

const mockGet = requestV1.get as ReturnType<typeof vi.fn>
const mockPost = requestV1.post as ReturnType<typeof vi.fn>
const mockPut = requestV1.put as ReturnType<typeof vi.fn>
const mockDelete = requestV1.delete as ReturnType<typeof vi.fn>

describe('policy API - 对照 API_REFERENCE.md', () => {
  beforeEach(() => vi.clearAllMocks())

  // §3.1 策略
  it('listPolicies → GET /policies', async () => {
    await api.listPolicies()
    expect(mockGet).toHaveBeenCalledWith('/policies')
  })

  it('createPolicy → POST /policies', async () => {
    const data = { name: 'test', policy_level: 'high' as const }
    await api.createPolicy(data)
    expect(mockPost).toHaveBeenCalledWith('/policies', data)
  })

  it('getPolicy → GET /policies/{id}', async () => {
    await api.getPolicy('p-1')
    expect(mockGet).toHaveBeenCalledWith('/policies/p-1')
  })

  it('updatePolicy → PUT /policies/{id}', async () => {
    const data = { engine_mode: 'block' as const }
    await api.updatePolicy('p-1', data)
    expect(mockPut).toHaveBeenCalledWith('/policies/p-1', data)
  })

  it('deletePolicy → DELETE /policies/{id}', async () => {
    await api.deletePolicy('p-1')
    expect(mockDelete).toHaveBeenCalledWith('/policies/p-1')
  })

  it('getPolicyChangeHistory → GET /policies/{id}/change_history', async () => {
    await api.getPolicyChangeHistory('p-1')
    expect(mockGet).toHaveBeenCalledWith('/policies/p-1/change_history')
  })

  it('upgradePolicy → POST /policies/upgrade', async () => {
    const data = { policy_id: 'p-1' }
    await api.upgradePolicy(data)
    expect(mockPost).toHaveBeenCalledWith('/policies/upgrade', data)
  })

  it('getPolicyUpgradeLog → GET /policies/upgrade/log', async () => {
    await api.getPolicyUpgradeLog()
    expect(mockGet).toHaveBeenCalledWith('/policies/upgrade/log')
  })

  // §3.2 分类
  it('listCategories → GET /policies/{policy_id}/categories', async () => {
    await api.listCategories('p-1')
    expect(mockGet).toHaveBeenCalledWith('/policies/p-1/categories')
  })

  it('getCategory → GET /policies/{policy_id}/categories/{id}', async () => {
    await api.getCategory('p-1', 'c-1')
    expect(mockGet).toHaveBeenCalledWith('/policies/p-1/categories/c-1')
  })

  it('updateCategory → PUT /policies/{policy_id}/categories/{id}', async () => {
    const data = { state: 'enable' as const }
    await api.updateCategory('p-1', 'c-1', data)
    expect(mockPut).toHaveBeenCalledWith('/policies/p-1/categories/c-1', data)
  })

  // §3.3 规则
  it('listRules → GET /policies/{policy_id}/rules', async () => {
    await api.listRules('p-1')
    expect(mockGet).toHaveBeenCalledWith('/policies/p-1/rules')
  })

  it('getRule → GET /policies/{policy_id}/rules/{id}', async () => {
    await api.getRule('p-1', 'r-1')
    expect(mockGet).toHaveBeenCalledWith('/policies/p-1/rules/r-1')
  })

  it('updateRule → PUT /policies/{policy_id}/rules/{id}', async () => {
    const data = { action: 'deny' as const }
    await api.updateRule('p-1', 'r-1', data)
    expect(mockPut).toHaveBeenCalledWith('/policies/p-1/rules/r-1', data)
  })

  // §3.4 自定义参数
  it('listCustomParameters → GET /policies/{policy_id}/custom_parameters', async () => {
    await api.listCustomParameters('p-1')
    expect(mockGet).toHaveBeenCalledWith('/policies/p-1/custom_parameters')
  })

  it('getDefaultCustomParameters → GET /policies/{policy_id}/default_custom_parameters', async () => {
    await api.getDefaultCustomParameters('p-1')
    expect(mockGet).toHaveBeenCalledWith('/policies/p-1/default_custom_parameters')
  })

  it('updateCustomParameter → PUT /policies/{policy_id}/custom_parameters/{name}', async () => {
    await api.updateCustomParameter('p-1', 'max_file_size', 1024)
    expect(mockPut).toHaveBeenCalledWith('/policies/p-1/custom_parameters/max_file_size', {
      value: 1024,
    })
  })

  it('deleteCustomParameter → DELETE /policies/{policy_id}/custom_parameters/{name}', async () => {
    await api.deleteCustomParameter('p-1', 'max_file_size')
    expect(mockDelete).toHaveBeenCalledWith('/policies/p-1/custom_parameters/max_file_size')
  })

  // §1.8 全局自定义规则
  it('listGlobalCustomRules → GET /custom_rules', async () => {
    await api.listGlobalCustomRules()
    expect(mockGet).toHaveBeenCalledWith('/custom_rules')
  })

  it('getGlobalCustomRule → GET /custom_rules/{id}', async () => {
    await api.getGlobalCustomRule('cr-1')
    expect(mockGet).toHaveBeenCalledWith('/custom_rules/cr-1')
  })

  it('createGlobalCustomRule → POST /custom_rules', async () => {
    const data = { name: 'test', type: 'and' as const }
    await api.createGlobalCustomRule(data)
    expect(mockPost).toHaveBeenCalledWith('/custom_rules', data)
  })

  it('updateGlobalCustomRule → PUT /custom_rules/{id}', async () => {
    const data = { state: true }
    await api.updateGlobalCustomRule('cr-1', data)
    expect(mockPut).toHaveBeenCalledWith('/custom_rules/cr-1', data)
  })

  it('deleteGlobalCustomRule → DELETE /custom_rules/{id}', async () => {
    await api.deleteGlobalCustomRule('cr-1')
    expect(mockDelete).toHaveBeenCalledWith('/custom_rules/cr-1')
  })

  // §1.9 自定义规则节点
  it('listCustomRuleNodes → GET /custom_rules/{custom_rule_id}/nodes', async () => {
    await api.listCustomRuleNodes('cr-1')
    expect(mockGet).toHaveBeenCalledWith('/custom_rules/cr-1/nodes')
  })

  it('getCustomRuleNode → GET /custom_rules/{custom_rule_id}/nodes/{id}', async () => {
    await api.getCustomRuleNode('cr-1', 'n-1')
    expect(mockGet).toHaveBeenCalledWith('/custom_rules/cr-1/nodes/n-1')
  })

  it('createCustomRuleNode → POST /custom_rules/{custom_rule_id}/nodes', async () => {
    const data = { variable: 'ARGS', match: 'test' }
    await api.createCustomRuleNode('cr-1', data)
    expect(mockPost).toHaveBeenCalledWith('/custom_rules/cr-1/nodes', data)
  })

  it('updateCustomRuleNode → PUT /custom_rules/{custom_rule_id}/nodes/{id}', async () => {
    const data = { lowercase: true }
    await api.updateCustomRuleNode('cr-1', 'n-1', data)
    expect(mockPut).toHaveBeenCalledWith('/custom_rules/cr-1/nodes/n-1', data)
  })

  it('deleteCustomRuleNode → DELETE /custom_rules/{custom_rule_id}/nodes/{id}', async () => {
    await api.deleteCustomRuleNode('cr-1', 'n-1')
    expect(mockDelete).toHaveBeenCalledWith('/custom_rules/cr-1/nodes/n-1')
  })

  it('updateCustomRuleNodePriority → PUT /custom_rules/{custom_rule_id}/nodes/{id}/priority', async () => {
    await api.updateCustomRuleNodePriority('cr-1', 'n-1', 'up')
    expect(mockPut).toHaveBeenCalledWith('/custom_rules/cr-1/nodes/n-1/priority', {
      direction: 'up',
    })
  })

  // §6 防病毒状态
  it('updateAntiVirusStatus → PUT /anti_virus_status/{site_id}', async () => {
    await api.updateAntiVirusStatus('s-1', true)
    expect(mockPut).toHaveBeenCalledWith('/anti_virus_status/s-1', { enabled: true })
  })
})
