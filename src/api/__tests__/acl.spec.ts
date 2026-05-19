import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { aclHandlers } from '@/mocks/acl-handlers'
import {
  listAclPolicies,
  getAclPolicy,
  createAclPolicy,
  updateAclPolicy,
  deleteAclPolicy,
  updateAclPolicyPriority,
  listAclRules,
  getAclRule,
  createAclRule,
  updateAclRule,
  deleteAclRule,
} from '../acl'

const server = setupServer(...aclHandlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('ACL API', () => {
  describe('ACL Policies', () => {
    it('listAclPolicies - 获取策略列表', async () => {
      const res = await listAclPolicies()
      expect(res.policies).toBeDefined()
      expect(Array.isArray(res.policies)).toBe(true)
      expect(res.policies.length).toBeGreaterThan(0)
    })

    it('getAclPolicy - 获取单个策略', async () => {
      const list = await listAclPolicies()
      const firstId = list.policies[0].id
      const policy = await getAclPolicy(firstId)
      expect(policy.id).toBe(firstId)
      expect(policy.name).toBeDefined()
    })

    it('createAclPolicy - 创建策略', async () => {
      const newPolicy = {
        name: '测试策略',
        description: '这是一个测试策略',
        enabled: true,
      }
      const created = await createAclPolicy(newPolicy)
      expect(created.id).toBeDefined()
      expect(created.name).toBe(newPolicy.name)
      expect(created.enabled).toBe(true)
    })

    it('updateAclPolicy - 更新策略', async () => {
      const list = await listAclPolicies()
      const firstId = list.policies[0].id
      const updated = await updateAclPolicy(firstId, { name: '更新后的策略名' })
      expect(updated.id).toBe(firstId)
      expect(updated.name).toBe('更新后的策略名')
    })

    it('deleteAclPolicy - 删除策略', async () => {
      const list = await listAclPolicies()
      const firstId = list.policies[0].id
      await expect(deleteAclPolicy(firstId)).resolves.toBeDefined()
    })

    it('updateAclPolicyPriority - 调整优先级', async () => {
      const list = await listAclPolicies()
      const firstId = list.policies[0].id
      const res = await updateAclPolicyPriority(firstId, 'down')
      expect(res.message).toBe('ok')
    })
  })

  describe('ACL Rules', () => {
    it('listAclRules - 获取规则列表', async () => {
      const policies = await listAclPolicies()
      const policyId = policies.policies[0].id
      const res = await listAclRules(policyId)
      expect(res.rules).toBeDefined()
      expect(Array.isArray(res.rules)).toBe(true)
    })

    it('getAclRule - 获取单个规则', async () => {
      const policies = await listAclPolicies()
      const policyId = policies.policies[0].id
      const rules = await listAclRules(policyId)
      if (rules.rules.length > 0) {
        const ruleId = rules.rules[0].id
        const rule = await getAclRule(policyId, ruleId)
        expect(rule.id).toBe(ruleId)
        expect(rule.policy_id).toBe(policyId)
      }
    })

    it('createAclRule - 创建规则', async () => {
      const policies = await listAclPolicies()
      const policyId = policies.policies[0].id
      const newRule = {
        source_ip: '192.168.1.0/24',
        destination_ip: '10.0.0.0/8',
        port: '8080',
        protocol: 'tcp' as const,
        action: 'allow' as const,
        enabled: true,
        description: '测试规则',
      }
      const created = await createAclRule(policyId, newRule)
      expect(created.id).toBeDefined()
      expect(created.policy_id).toBe(policyId)
      expect(created.source_ip).toBe(newRule.source_ip)
    })

    it('updateAclRule - 更新规则', async () => {
      const policies = await listAclPolicies()
      const policyId = policies.policies[0].id
      const rules = await listAclRules(policyId)
      if (rules.rules.length > 0) {
        const ruleId = rules.rules[0].id
        const updated = await updateAclRule(policyId, ruleId, { port: '9090' })
        expect(updated.id).toBe(ruleId)
        expect(updated.port).toBe('9090')
      }
    })

    it('deleteAclRule - 删除规则', async () => {
      const policies = await listAclPolicies()
      const policyId = policies.policies[0].id
      const rules = await listAclRules(policyId)
      if (rules.rules.length > 0) {
        const ruleId = rules.rules[0].id
        await expect(deleteAclRule(policyId, ruleId)).resolves.toBeDefined()
      }
    })
  })
})
