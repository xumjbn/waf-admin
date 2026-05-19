import { describe, it, expect, vi, beforeEach } from 'vitest'

// 对照 API_REFERENCE.md §1.1 - §1.12
vi.mock('../request', () => ({
  requestV1: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}))

import * as api from '../site'
import { requestV1 } from '../request'

const mockGet = requestV1.get as ReturnType<typeof vi.fn>
const mockPost = requestV1.post as ReturnType<typeof vi.fn>
const mockPut = requestV1.put as ReturnType<typeof vi.fn>
const mockDelete = requestV1.delete as ReturnType<typeof vi.fn>

describe('site API - 对照 API_REFERENCE.md', () => {
  beforeEach(() => vi.clearAllMocks())

  // §1.1 站点 CRUD
  it('listSites → GET /protect_sites', async () => {
    await api.listSites()
    expect(mockGet).toHaveBeenCalledWith('/protect_sites')
  })

  it('getSite → GET /protect_sites/{id}', async () => {
    await api.getSite('s1')
    expect(mockGet).toHaveBeenCalledWith('/protect_sites/s1')
  })

  it('createSite → POST /protect_sites', async () => {
    const data = { name: 'test' } as Parameters<typeof api.createSite>[0]
    await api.createSite(data)
    expect(mockPost).toHaveBeenCalledWith('/protect_sites', data)
  })

  it('updateSite → PUT /protect_sites/{id}', async () => {
    await api.updateSite('s1', { name: 'updated' })
    expect(mockPut).toHaveBeenCalledWith('/protect_sites/s1', { name: 'updated' })
  })

  it('deleteSite → DELETE /protect_sites/{id}', async () => {
    await api.deleteSite('s1')
    expect(mockDelete).toHaveBeenCalledWith('/protect_sites/s1')
  })

  it('getSiteStats → GET /site_stats', async () => {
    await api.getSiteStats()
    expect(mockGet).toHaveBeenCalledWith('/site_stats')
  })

  it('createSiteAndProtect → POST /site_and_protect', async () => {
    const data = { site: {}, members: [] } as unknown as Parameters<
      typeof api.createSiteAndProtect
    >[0]
    await api.createSiteAndProtect(data)
    expect(mockPost).toHaveBeenCalledWith('/site_and_protect', data)
  })

  // §1.2 LB 防护
  it('listLbMembers → GET /protect_sites/{site_id}/lbs', async () => {
    await api.listLbMembers('s1')
    expect(mockGet).toHaveBeenCalledWith('/protect_sites/s1/lbs')
  })

  it('getLbMember → GET /protect_sites/{site_id}/lbs/{lb_id}', async () => {
    await api.getLbMember('s1', 'lb1')
    expect(mockGet).toHaveBeenCalledWith('/protect_sites/s1/lbs/lb1')
  })

  it('createLbMember → POST /protect_sites/{site_id}/lbs', async () => {
    const data = { name: 'lb' } as Parameters<typeof api.createLbMember>[1]
    await api.createLbMember('s1', data)
    expect(mockPost).toHaveBeenCalledWith('/protect_sites/s1/lbs', data)
  })

  it('updateLbMember → PUT /protect_sites/{site_id}/lbs/{id}', async () => {
    await api.updateLbMember('s1', 'lb1', { name: 'updated' })
    expect(mockPut).toHaveBeenCalledWith('/protect_sites/s1/lbs/lb1', { name: 'updated' })
  })

  it('deleteLbMember → DELETE /protect_sites/{site_id}/lbs/{id}', async () => {
    await api.deleteLbMember('s1', 'lb1')
    expect(mockDelete).toHaveBeenCalledWith('/protect_sites/s1/lbs/lb1')
  })

  // §1.3 实例 防护成员
  it('listInstanceMembers → GET /protect_sites/{site_id}/instance_protect', async () => {
    await api.listInstanceMembers('s1')
    expect(mockGet).toHaveBeenCalledWith('/protect_sites/s1/instance_protect')
  })

  it('getInstanceMember → GET /protect_sites/{site_id}/instance_protect/{member_id}', async () => {
    await api.getInstanceMember('s1', 'm1')
    expect(mockGet).toHaveBeenCalledWith('/protect_sites/s1/instance_protect/m1')
  })

  it('createInstanceMember → POST /protect_sites/{site_id}/instance_protect', async () => {
    const data = { name: 'instance' } as Parameters<typeof api.createInstanceMember>[1]
    await api.createInstanceMember('s1', data)
    expect(mockPost).toHaveBeenCalledWith('/protect_sites/s1/instance_protect', data)
  })

  it('updateInstanceMember → PUT /protect_sites/{site_id}/instance_protect/{id}', async () => {
    await api.updateInstanceMember('s1', 'm1', { name: 'updated' })
    expect(mockPut).toHaveBeenCalledWith('/protect_sites/s1/instance_protect/m1', { name: 'updated' })
  })

  it('deleteInstanceMember → DELETE /protect_sites/{site_id}/instance_protect/{id}', async () => {
    await api.deleteInstanceMember('s1', 'm1')
    expect(mockDelete).toHaveBeenCalledWith('/protect_sites/s1/instance_protect/m1')
  })

  // §1.4 ACL 防护
  it('listAclProtect → GET /protect_sites/{site_id}/acl_protect', async () => {
    await api.listAclProtect('s1')
    expect(mockGet).toHaveBeenCalledWith('/protect_sites/s1/acl_protect')
  })

  it('getAclProtect → GET /protect_sites/{site_id}/acl_protect/{acl_id}', async () => {
    await api.getAclProtect('s1', 'acl1')
    expect(mockGet).toHaveBeenCalledWith('/protect_sites/s1/acl_protect/acl1')
  })

  it('createAclProtect → POST /protect_sites/{site_id}/acl_protect', async () => {
    const data = { name: 'acl' } as Parameters<typeof api.createAclProtect>[1]
    await api.createAclProtect('s1', data)
    expect(mockPost).toHaveBeenCalledWith('/protect_sites/s1/acl_protect', data)
  })

  it('updateAclProtect → PUT /protect_sites/{site_id}/acl_protect/{id}', async () => {
    await api.updateAclProtect('s1', 'acl1', { name: 'updated' })
    expect(mockPut).toHaveBeenCalledWith('/protect_sites/s1/acl_protect/acl1', { name: 'updated' })
  })

  it('deleteAclProtect → DELETE /protect_sites/{site_id}/acl_protect/{id}', async () => {
    await api.deleteAclProtect('s1', 'acl1')
    expect(mockDelete).toHaveBeenCalledWith('/protect_sites/s1/acl_protect/acl1')
  })

  it('updateAclPriority → PUT /protect_sites/{site_id}/acl_protect/{id}/priority', async () => {
    await api.updateAclPriority('s1', 'acl1', 10)
    expect(mockPut).toHaveBeenCalledWith('/protect_sites/s1/acl_protect/acl1/priority', {
      priority: 10,
    })
  })

  // §1.5 CC 防护
  it('listCcProtect → GET /protect_sites/{site_id}/cc_protect', async () => {
    await api.listCcProtect('s1')
    expect(mockGet).toHaveBeenCalledWith('/protect_sites/s1/cc_protect')
  })

  it('getCcProtect → GET /protect_sites/{site_id}/cc_protect/{cc_id}', async () => {
    await api.getCcProtect('s1', 'cc1')
    expect(mockGet).toHaveBeenCalledWith('/protect_sites/s1/cc_protect/cc1')
  })

  it('createCcProtect → POST /protect_sites/{site_id}/cc_protect', async () => {
    const data = { name: 'cc' } as Parameters<typeof api.createCcProtect>[1]
    await api.createCcProtect('s1', data)
    expect(mockPost).toHaveBeenCalledWith('/protect_sites/s1/cc_protect', data)
  })

  it('updateCcProtect → PUT /protect_sites/{site_id}/cc_protect/{id}', async () => {
    await api.updateCcProtect('s1', 'cc1', { name: 'updated' })
    expect(mockPut).toHaveBeenCalledWith('/protect_sites/s1/cc_protect/cc1', { name: 'updated' })
  })

  it('deleteCcProtect → DELETE /protect_sites/{site_id}/cc_protect/{id}', async () => {
    await api.deleteCcProtect('s1', 'cc1')
    expect(mockDelete).toHaveBeenCalledWith('/protect_sites/s1/cc_protect/cc1')
  })

  // §1.6 CSRF 防护
  it('listCsrfProtect → GET /protect_sites/{site_id}/csrf_protect', async () => {
    await api.listCsrfProtect('s1')
    expect(mockGet).toHaveBeenCalledWith('/protect_sites/s1/csrf_protect')
  })

  it('getCsrfProtect → GET /protect_sites/{site_id}/csrf_protect/{csrf_id}', async () => {
    await api.getCsrfProtect('s1', 'csrf1')
    expect(mockGet).toHaveBeenCalledWith('/protect_sites/s1/csrf_protect/csrf1')
  })

  it('createCsrfProtect → POST /protect_sites/{site_id}/csrf_protect', async () => {
    const data = { name: 'csrf' } as Parameters<typeof api.createCsrfProtect>[1]
    await api.createCsrfProtect('s1', data)
    expect(mockPost).toHaveBeenCalledWith('/protect_sites/s1/csrf_protect', data)
  })

  it('updateCsrfProtect → PUT /protect_sites/{site_id}/csrf_protect/{id}', async () => {
    await api.updateCsrfProtect('s1', 'csrf1', { name: 'updated' })
    expect(mockPut).toHaveBeenCalledWith('/protect_sites/s1/csrf_protect/csrf1', {
      name: 'updated',
    })
  })

  it('deleteCsrfProtect → DELETE /protect_sites/{site_id}/csrf_protect/{id}', async () => {
    await api.deleteCsrfProtect('s1', 'csrf1')
    expect(mockDelete).toHaveBeenCalledWith('/protect_sites/s1/csrf_protect/csrf1')
  })

  // §1.7 加速器
  it('listAccelerator → GET /protect_sites/{site_id}/accelerator', async () => {
    await api.listAccelerator('s1')
    expect(mockGet).toHaveBeenCalledWith('/protect_sites/s1/accelerator')
  })

  it('getAccelerator → GET /protect_sites/{site_id}/accelerator/{accelerator_id}', async () => {
    await api.getAccelerator('s1', 'acc1')
    expect(mockGet).toHaveBeenCalledWith('/protect_sites/s1/accelerator/acc1')
  })

  it('createAccelerator → POST /protect_sites/{site_id}/accelerator', async () => {
    const data = { name: 'acc' } as Parameters<typeof api.createAccelerator>[1]
    await api.createAccelerator('s1', data)
    expect(mockPost).toHaveBeenCalledWith('/protect_sites/s1/accelerator', data)
  })

  it('updateAccelerator → PUT /protect_sites/{site_id}/accelerator/{id}', async () => {
    await api.updateAccelerator('s1', 'acc1', { name: 'updated' })
    expect(mockPut).toHaveBeenCalledWith('/protect_sites/s1/accelerator/acc1', { name: 'updated' })
  })

  it('deleteAccelerator → DELETE /protect_sites/{site_id}/accelerator/{id}', async () => {
    await api.deleteAccelerator('s1', 'acc1')
    expect(mockDelete).toHaveBeenCalledWith('/protect_sites/s1/accelerator/acc1')
  })

  // §1.8 自定义规则
  it('listCustomRules → GET /protect_sites/{site_id}/custom_rules', async () => {
    await api.listCustomRules('s1')
    expect(mockGet).toHaveBeenCalledWith('/protect_sites/s1/custom_rules')
  })

  it('getCustomRule → GET /protect_sites/{site_id}/custom_rules/{custom_rule_id}', async () => {
    await api.getCustomRule('s1', 'r1')
    expect(mockGet).toHaveBeenCalledWith('/protect_sites/s1/custom_rules/r1')
  })

  it('createCustomRule → POST /protect_sites/{site_id}/custom_rules', async () => {
    const data = { name: 'rule' } as Parameters<typeof api.createCustomRule>[1]
    await api.createCustomRule('s1', data)
    expect(mockPost).toHaveBeenCalledWith('/protect_sites/s1/custom_rules', data)
  })

  it('updateCustomRule → PUT /protect_sites/{site_id}/custom_rules/{id}', async () => {
    await api.updateCustomRule('s1', 'r1', { name: 'updated' })
    expect(mockPut).toHaveBeenCalledWith('/protect_sites/s1/custom_rules/r1', { name: 'updated' })
  })

  it('deleteCustomRule → DELETE /protect_sites/{site_id}/custom_rules/{id}', async () => {
    await api.deleteCustomRule('s1', 'r1')
    expect(mockDelete).toHaveBeenCalledWith('/protect_sites/s1/custom_rules/r1')
  })

  it('removeCustomRuleSites → DELETE /custom_rules/remove/{id}', async () => {
    await api.removeCustomRuleSites('r1')
    expect(mockDelete).toHaveBeenCalledWith('/custom_rules/remove/r1')
  })

  it('createCustomRuleRelevance → POST /protect_sites/{site_id}/custom_rules', async () => {
    await api.createCustomRuleRelevance('s1', { rule_ids: ['r1', 'r2'] })
    expect(mockPost).toHaveBeenCalledWith('/protect_sites/s1/custom_rules', {
      rule_ids: ['r1', 'r2'],
    })
  })

  it('updateCustomRulePriority → PUT /protect_sites/{site_id}/custom_rules/{id}/priority', async () => {
    await api.updateCustomRulePriority('s1', 'r1', 5)
    expect(mockPut).toHaveBeenCalledWith('/protect_sites/s1/custom_rules/r1/priority', {
      priority: 5,
    })
  })

  // §1.10 防篡改
  it('listAntiTamper → GET /protect_sites/{site_id}/anti_tamper', async () => {
    await api.listAntiTamper('s1')
    expect(mockGet).toHaveBeenCalledWith('/protect_sites/s1/anti_tamper')
  })

  it('getAntiTamper → GET /protect_sites/{site_id}/anti_tamper/{id}', async () => {
    await api.getAntiTamper('s1', 'at1')
    expect(mockGet).toHaveBeenCalledWith('/protect_sites/s1/anti_tamper/at1')
  })

  it('createAntiTamper → POST /protect_sites/{site_id}/anti_tamper', async () => {
    const data = { name: 'tamper' } as Parameters<typeof api.createAntiTamper>[1]
    await api.createAntiTamper('s1', data)
    expect(mockPost).toHaveBeenCalledWith('/protect_sites/s1/anti_tamper', data)
  })

  it('updateAntiTamper → PUT /protect_sites/{site_id}/anti_tamper/{id}', async () => {
    await api.updateAntiTamper('s1', 'at1', { name: 'updated' })
    expect(mockPut).toHaveBeenCalledWith('/protect_sites/s1/anti_tamper/at1', { name: 'updated' })
  })

  it('deleteAntiTamper → DELETE /protect_sites/{site_id}/anti_tamper/{id}', async () => {
    await api.deleteAntiTamper('s1', 'at1')
    expect(mockDelete).toHaveBeenCalledWith('/protect_sites/s1/anti_tamper/at1')
  })

  it('deleteAntiTamperStudy → DELETE /protect_sites/{site_id}/anti_tamper_study', async () => {
    await api.deleteAntiTamperStudy('s1')
    expect(mockDelete).toHaveBeenCalledWith('/protect_sites/s1/anti_tamper_study')
  })

  it('getAntiTamperStudy → GET /protect_sites/{site_id}/anti_tamper_study', async () => {
    await api.getAntiTamperStudy('s1')
    expect(mockGet).toHaveBeenCalledWith('/protect_sites/s1/anti_tamper_study')
  })

  // §1.11 内容注入
  it('listContentInto → GET /protect_sites/{site_id}/content_into', async () => {
    await api.listContentInto('s1')
    expect(mockGet).toHaveBeenCalledWith('/protect_sites/s1/content_into')
  })

  it('getContentInto → GET /protect_sites/{site_id}/content_into/{id}', async () => {
    await api.getContentInto('s1', 'ci1')
    expect(mockGet).toHaveBeenCalledWith('/protect_sites/s1/content_into/ci1')
  })

  it('createContentInto → POST /protect_sites/{site_id}/content_into', async () => {
    const data = { name: 'content' } as Parameters<typeof api.createContentInto>[1]
    await api.createContentInto('s1', data)
    expect(mockPost).toHaveBeenCalledWith('/protect_sites/s1/content_into', data)
  })

  it('updateContentInto → PUT /protect_sites/{site_id}/content_into/{id}', async () => {
    await api.updateContentInto('s1', 'ci1', { name: 'updated' })
    expect(mockPut).toHaveBeenCalledWith('/protect_sites/s1/content_into/ci1', { name: 'updated' })
  })

  it('deleteContentInto → DELETE /protect_sites/{site_id}/content_into/{id}', async () => {
    await api.deleteContentInto('s1', 'ci1')
    expect(mockDelete).toHaveBeenCalledWith('/protect_sites/s1/content_into/ci1')
  })

  // §1.12 防盗链
  it('listAntiStealingLink → GET /anti_stealing_link', async () => {
    await api.listAntiStealingLink()
    expect(mockGet).toHaveBeenCalledWith('/anti_stealing_link')
  })

  it('getAntiStealingLink → GET /anti_stealing_link/{id}', async () => {
    await api.getAntiStealingLink('asl1')
    expect(mockGet).toHaveBeenCalledWith('/anti_stealing_link/asl1')
  })

  it('createAntiStealingLink → POST /anti_stealing_link', async () => {
    const data = { name: 'link' } as Parameters<typeof api.createAntiStealingLink>[0]
    await api.createAntiStealingLink(data)
    expect(mockPost).toHaveBeenCalledWith('/anti_stealing_link', data)
  })

  it('updateAntiStealingLink → PUT /anti_stealing_link/{id}', async () => {
    await api.updateAntiStealingLink('asl1', { name: 'updated' })
    expect(mockPut).toHaveBeenCalledWith('/anti_stealing_link/asl1', { name: 'updated' })
  })

  it('deleteAntiStealingLink → DELETE /anti_stealing_link/{id}', async () => {
    await api.deleteAntiStealingLink('asl1')
    expect(mockDelete).toHaveBeenCalledWith('/anti_stealing_link/asl1')
  })
})
