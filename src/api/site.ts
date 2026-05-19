// site 站点管理模块 API
// 对应 API_REFERENCE.md §1.1 - §1.12
import { requestV1 } from './request'
import type {
  ProtectSite,
  LbMember,
  InstanceProtectMember,
  AclProtect,
  CcProtect,
  CsrfProtect,
  Accelerator,
  CustomRule,
  AntiTamper,
  ContentInto,
  AntiStealingLink,
  SiteStatsResponse,
  SiteAndProtectPayload,
} from './types/site'

// === §1.1 站点 CRUD ===

// API_REFERENCE.md §1.1 - GET /protect_sites
export const listSites = () =>
  requestV1.get<never, { protect_sites: ProtectSite[] }>('/protect_sites')

// API_REFERENCE.md §1.1 - GET /protect_sites/{id}
export const getSite = (id: string) =>
  requestV1.get<never, { protect_site: ProtectSite }>(`/protect_sites/${id}`)

// API_REFERENCE.md §1.1 - POST /protect_sites
export const createSite = (data: Omit<ProtectSite, 'id' | 'created_at'>) =>
  requestV1.post<never, { protect_site: ProtectSite }>('/protect_sites', data)

// API_REFERENCE.md §1.1 - PUT /protect_sites/{id}
export const updateSite = (id: string, data: Partial<ProtectSite>) =>
  requestV1.put<never, { protect_site: ProtectSite }>(`/protect_sites/${id}`, data)

// API_REFERENCE.md §1.1 - DELETE /protect_sites/{id}
export const deleteSite = (id: string) => requestV1.delete(`/protect_sites/${id}`)

// API_REFERENCE.md §1.1 - GET /site_stats
export const getSiteStats = () => requestV1.get<never, SiteStatsResponse>('/site_stats')

// API_REFERENCE.md §1.1 - POST /site_and_protect
export const createSiteAndProtect = (data: SiteAndProtectPayload) =>
  requestV1.post<never, { protect_site: ProtectSite }>('/site_and_protect', data)

// === §1.2 LB 防护 ===

// API_REFERENCE.md §1.2 - GET /protect_sites/{site_id}/lbs
export const listLbMembers = (siteId: string) =>
  requestV1.get<never, { lbs: LbMember[] }>(`/protect_sites/${siteId}/lbs`)

// API_REFERENCE.md §1.2 - GET /protect_sites/{site_id}/lbs/{lb_id}
export const getLbMember = (siteId: string, lbId: string) =>
  requestV1.get<never, { lb: LbMember }>(`/protect_sites/${siteId}/lbs/${lbId}`)

// API_REFERENCE.md §1.2 - POST /protect_sites/{site_id}/lbs
export const createLbMember = (siteId: string, data: Omit<LbMember, 'id' | 'site_id'>) =>
  requestV1.post<never, { lb: LbMember }>(`/protect_sites/${siteId}/lbs`, data)

// API_REFERENCE.md §1.2 - PUT /protect_sites/{site_id}/lbs/{id}
export const updateLbMember = (siteId: string, id: string, data: Partial<LbMember>) =>
  requestV1.put<never, { lb: LbMember }>(`/protect_sites/${siteId}/lbs/${id}`, data)

// API_REFERENCE.md §1.2 - DELETE /protect_sites/{site_id}/lbs/{id}
export const deleteLbMember = (siteId: string, id: string) =>
  requestV1.delete(`/protect_sites/${siteId}/lbs/${id}`)

// === §1.3 实例 防护成员 ===

// API_REFERENCE.md §1.3 - GET /protect_sites/{site_id}/instance_protect
export const listInstanceMembers = (siteId: string) =>
  requestV1.get<never, { instance_protect: InstanceProtectMember[] }>(`/protect_sites/${siteId}/instance_protect`)

// API_REFERENCE.md §1.3 - GET /protect_sites/{site_id}/instance_protect/{member_id}
export const getInstanceMember = (siteId: string, memberId: string) =>
  requestV1.get<never, { instance_protect: InstanceProtectMember }>(
    `/protect_sites/${siteId}/instance_protect/${memberId}`,
  )

// API_REFERENCE.md §1.3 - POST /protect_sites/{site_id}/instance_protect
export const createInstanceMember = (siteId: string, data: Omit<InstanceProtectMember, 'id' | 'site_id'>) =>
  requestV1.post<never, { instance_protect: InstanceProtectMember }>(
    `/protect_sites/${siteId}/instance_protect`,
    data,
  )

// API_REFERENCE.md §1.3 - PUT /protect_sites/{site_id}/instance_protect/{id}
export const updateInstanceMember = (siteId: string, id: string, data: Partial<InstanceProtectMember>) =>
  requestV1.put<never, { instance_protect: InstanceProtectMember }>(
    `/protect_sites/${siteId}/instance_protect/${id}`,
    data,
  )

// API_REFERENCE.md §1.3 - DELETE /protect_sites/{site_id}/instance_protect/{id}
export const deleteInstanceMember = (siteId: string, id: string) =>
  requestV1.delete(`/protect_sites/${siteId}/instance_protect/${id}`)

// === §1.4 ACL 防护 ===

// API_REFERENCE.md §1.4 - GET /protect_sites/{site_id}/acl_protect
export const listAclProtect = (siteId: string) =>
  requestV1.get<never, { acl_protect: AclProtect[] }>(`/protect_sites/${siteId}/acl_protect`)

// API_REFERENCE.md §1.4 - GET /protect_sites/{site_id}/acl_protect/{acl_id}
export const getAclProtect = (siteId: string, aclId: string) =>
  requestV1.get<never, { acl_protect: AclProtect }>(`/protect_sites/${siteId}/acl_protect/${aclId}`)

// API_REFERENCE.md §1.4 - POST /protect_sites/{site_id}/acl_protect
export const createAclProtect = (siteId: string, data: Omit<AclProtect, 'id' | 'site_id'>) =>
  requestV1.post<never, { acl_protect: AclProtect }>(`/protect_sites/${siteId}/acl_protect`, data)

// API_REFERENCE.md §1.4 - PUT /protect_sites/{site_id}/acl_protect/{id}
export const updateAclProtect = (siteId: string, id: string, data: Partial<AclProtect>) =>
  requestV1.put<never, { acl_protect: AclProtect }>(
    `/protect_sites/${siteId}/acl_protect/${id}`,
    data,
  )

// API_REFERENCE.md §1.4 - DELETE /protect_sites/{site_id}/acl_protect/{id}
export const deleteAclProtect = (siteId: string, id: string) =>
  requestV1.delete(`/protect_sites/${siteId}/acl_protect/${id}`)

// API_REFERENCE.md §1.4 - PUT /protect_sites/{site_id}/acl_protect/{id}/priority
export const updateAclPriority = (siteId: string, id: string, priority: number) =>
  requestV1.put(`/protect_sites/${siteId}/acl_protect/${id}/priority`, { priority })

// === §1.5 CC 防护 ===

// API_REFERENCE.md §1.5 - GET /protect_sites/{site_id}/cc_protect
export const listCcProtect = (siteId: string) =>
  requestV1.get<never, { cc_protect: CcProtect[] }>(`/protect_sites/${siteId}/cc_protect`)

// API_REFERENCE.md §1.5 - GET /protect_sites/{site_id}/cc_protect/{cc_id}
export const getCcProtect = (siteId: string, ccId: string) =>
  requestV1.get<never, { cc_protect: CcProtect }>(`/protect_sites/${siteId}/cc_protect/${ccId}`)

// API_REFERENCE.md §1.5 - POST /protect_sites/{site_id}/cc_protect
export const createCcProtect = (siteId: string, data: Omit<CcProtect, 'id' | 'site_id'>) =>
  requestV1.post<never, { cc_protect: CcProtect }>(`/protect_sites/${siteId}/cc_protect`, data)

// API_REFERENCE.md §1.5 - PUT /protect_sites/{site_id}/cc_protect/{id}
export const updateCcProtect = (siteId: string, id: string, data: Partial<CcProtect>) =>
  requestV1.put<never, { cc_protect: CcProtect }>(`/protect_sites/${siteId}/cc_protect/${id}`, data)

// API_REFERENCE.md §1.5 - DELETE /protect_sites/{site_id}/cc_protect/{id}
export const deleteCcProtect = (siteId: string, id: string) =>
  requestV1.delete(`/protect_sites/${siteId}/cc_protect/${id}`)

// === §1.6 CSRF 防护 ===

// API_REFERENCE.md §1.6 - GET /protect_sites/{site_id}/csrf_protect
export const listCsrfProtect = (siteId: string) =>
  requestV1.get<never, { csrf_protect: CsrfProtect[] }>(`/protect_sites/${siteId}/csrf_protect`)

// API_REFERENCE.md §1.6 - GET /protect_sites/{site_id}/csrf_protect/{csrf_id}
export const getCsrfProtect = (siteId: string, csrfId: string) =>
  requestV1.get<never, { csrf_protect: CsrfProtect }>(
    `/protect_sites/${siteId}/csrf_protect/${csrfId}`,
  )

// API_REFERENCE.md §1.6 - POST /protect_sites/{site_id}/csrf_protect
export const createCsrfProtect = (siteId: string, data: Omit<CsrfProtect, 'id' | 'site_id'>) =>
  requestV1.post<never, { csrf_protect: CsrfProtect }>(
    `/protect_sites/${siteId}/csrf_protect`,
    data,
  )

// API_REFERENCE.md §1.6 - PUT /protect_sites/{site_id}/csrf_protect/{id}
export const updateCsrfProtect = (siteId: string, id: string, data: Partial<CsrfProtect>) =>
  requestV1.put<never, { csrf_protect: CsrfProtect }>(
    `/protect_sites/${siteId}/csrf_protect/${id}`,
    data,
  )

// API_REFERENCE.md §1.6 - DELETE /protect_sites/{site_id}/csrf_protect/{id}
export const deleteCsrfProtect = (siteId: string, id: string) =>
  requestV1.delete(`/protect_sites/${siteId}/csrf_protect/${id}`)

// === §1.7 加速器 ===

// API_REFERENCE.md §1.7 - GET /protect_sites/{site_id}/accelerator
export const listAccelerator = (siteId: string) =>
  requestV1.get<never, { accelerator: Accelerator[] }>(`/protect_sites/${siteId}/accelerator`)

// API_REFERENCE.md §1.7 - GET /protect_sites/{site_id}/accelerator/{accelerator_id}
export const getAccelerator = (siteId: string, acceleratorId: string) =>
  requestV1.get<never, { accelerator: Accelerator }>(
    `/protect_sites/${siteId}/accelerator/${acceleratorId}`,
  )

// API_REFERENCE.md §1.7 - POST /protect_sites/{site_id}/accelerator
export const createAccelerator = (siteId: string, data: Omit<Accelerator, 'id' | 'site_id'>) =>
  requestV1.post<never, { accelerator: Accelerator }>(`/protect_sites/${siteId}/accelerator`, data)

// API_REFERENCE.md §1.7 - PUT /protect_sites/{site_id}/accelerator/{id}
export const updateAccelerator = (siteId: string, id: string, data: Partial<Accelerator>) =>
  requestV1.put<never, { accelerator: Accelerator }>(
    `/protect_sites/${siteId}/accelerator/${id}`,
    data,
  )

// API_REFERENCE.md §1.7 - DELETE /protect_sites/{site_id}/accelerator/{id}
export const deleteAccelerator = (siteId: string, id: string) =>
  requestV1.delete(`/protect_sites/${siteId}/accelerator/${id}`)

// === §1.8 自定义规则 ===

// API_REFERENCE.md §1.8 - GET /protect_sites/{site_id}/custom_rules
export const listCustomRules = (siteId: string) =>
  requestV1.get<never, { custom_rules: CustomRule[] }>(`/protect_sites/${siteId}/custom_rules`)

// API_REFERENCE.md §1.8 - GET /protect_sites/{site_id}/custom_rules/{custom_rule_id}
export const getCustomRule = (siteId: string, ruleId: string) =>
  requestV1.get<never, { custom_rule: CustomRule }>(
    `/protect_sites/${siteId}/custom_rules/${ruleId}`,
  )

// API_REFERENCE.md §1.8 - POST /protect_sites/{site_id}/custom_rules
export const createCustomRule = (siteId: string, data: Omit<CustomRule, 'id' | 'site_id'>) =>
  requestV1.post<never, { custom_rule: CustomRule }>(`/protect_sites/${siteId}/custom_rules`, data)

// API_REFERENCE.md §1.8 - PUT /protect_sites/{site_id}/custom_rules/{id}
export const updateCustomRule = (siteId: string, id: string, data: Partial<CustomRule>) =>
  requestV1.put<never, { custom_rule: CustomRule }>(
    `/protect_sites/${siteId}/custom_rules/${id}`,
    data,
  )

// API_REFERENCE.md §1.8 - DELETE /protect_sites/{site_id}/custom_rules/{id}
export const deleteCustomRule = (siteId: string, id: string) =>
  requestV1.delete(`/protect_sites/${siteId}/custom_rules/${id}`)

// API_REFERENCE.md §1.8 - DELETE /custom_rules/remove/{id}
export const removeCustomRuleSites = (id: string) => requestV1.delete(`/custom_rules/remove/${id}`)

// API_REFERENCE.md §1.8 - POST /protect_sites/{site_id}/custom_rules (relevance)
export const createCustomRuleRelevance = (siteId: string, data: { rule_ids: string[] }) =>
  requestV1.post(`/protect_sites/${siteId}/custom_rules`, data)

// API_REFERENCE.md §1.8 - PUT /protect_sites/{site_id}/custom_rules/{id}/priority
export const updateCustomRulePriority = (siteId: string, id: string, priority: number) =>
  requestV1.put(`/protect_sites/${siteId}/custom_rules/${id}/priority`, { priority })

// === §1.10 防篡改 ===

// API_REFERENCE.md §1.10 - GET /protect_sites/{site_id}/anti_tamper
export const listAntiTamper = (siteId: string) =>
  requestV1.get<never, { anti_tamper: AntiTamper[] }>(`/protect_sites/${siteId}/anti_tamper`)

// API_REFERENCE.md §1.10 - GET /protect_sites/{site_id}/anti_tamper/{id}
export const getAntiTamper = (siteId: string, id: string) =>
  requestV1.get<never, { anti_tamper: AntiTamper }>(`/protect_sites/${siteId}/anti_tamper/${id}`)

// API_REFERENCE.md §1.10 - POST /protect_sites/{site_id}/anti_tamper
export const createAntiTamper = (siteId: string, data: Omit<AntiTamper, 'id' | 'site_id'>) =>
  requestV1.post<never, { anti_tamper: AntiTamper }>(`/protect_sites/${siteId}/anti_tamper`, data)

// API_REFERENCE.md §1.10 - PUT /protect_sites/{site_id}/anti_tamper/{id}
export const updateAntiTamper = (siteId: string, id: string, data: Partial<AntiTamper>) =>
  requestV1.put<never, { anti_tamper: AntiTamper }>(
    `/protect_sites/${siteId}/anti_tamper/${id}`,
    data,
  )

// API_REFERENCE.md §1.10 - DELETE /protect_sites/{site_id}/anti_tamper/{id}
export const deleteAntiTamper = (siteId: string, id: string) =>
  requestV1.delete(`/protect_sites/${siteId}/anti_tamper/${id}`)

// API_REFERENCE.md §1.10 - DELETE /protect_sites/{site_id}/anti_tamper_study
export const deleteAntiTamperStudy = (siteId: string) =>
  requestV1.delete(`/protect_sites/${siteId}/anti_tamper_study`)

// API_REFERENCE.md §1.10 - GET /protect_sites/{site_id}/anti_tamper_study
export const getAntiTamperStudy = (siteId: string) =>
  requestV1.get<never, unknown>(`/protect_sites/${siteId}/anti_tamper_study`)

// === §1.11 内容注入 ===

// API_REFERENCE.md §1.11 - GET /protect_sites/{site_id}/content_into
export const listContentInto = (siteId: string) =>
  requestV1.get<never, { content_into: ContentInto[] }>(`/protect_sites/${siteId}/content_into`)

// API_REFERENCE.md §1.11 - GET /protect_sites/{site_id}/content_into/{id}
export const getContentInto = (siteId: string, id: string) =>
  requestV1.get<never, { content_into: ContentInto }>(`/protect_sites/${siteId}/content_into/${id}`)

// API_REFERENCE.md §1.11 - POST /protect_sites/{site_id}/content_into
export const createContentInto = (siteId: string, data: Omit<ContentInto, 'id' | 'site_id'>) =>
  requestV1.post<never, { content_into: ContentInto }>(
    `/protect_sites/${siteId}/content_into`,
    data,
  )

// API_REFERENCE.md §1.11 - PUT /protect_sites/{site_id}/content_into/{id}
export const updateContentInto = (siteId: string, id: string, data: Partial<ContentInto>) =>
  requestV1.put<never, { content_into: ContentInto }>(
    `/protect_sites/${siteId}/content_into/${id}`,
    data,
  )

// API_REFERENCE.md §1.11 - DELETE /protect_sites/{site_id}/content_into/{id}
export const deleteContentInto = (siteId: string, id: string) =>
  requestV1.delete(`/protect_sites/${siteId}/content_into/${id}`)

// === §1.12 防盗链 ===

// API_REFERENCE.md §1.12 - GET /anti_stealing_link
export const listAntiStealingLink = () =>
  requestV1.get<never, { anti_stealing_link: AntiStealingLink[] }>('/anti_stealing_link')

// API_REFERENCE.md §1.12 - GET /anti_stealing_link/{id}
export const getAntiStealingLink = (id: string) =>
  requestV1.get<never, { anti_stealing_link: AntiStealingLink }>(`/anti_stealing_link/${id}`)

// API_REFERENCE.md §1.12 - POST /anti_stealing_link
export const createAntiStealingLink = (data: Omit<AntiStealingLink, 'id'>) =>
  requestV1.post<never, { anti_stealing_link: AntiStealingLink }>('/anti_stealing_link', data)

// API_REFERENCE.md §1.12 - PUT /anti_stealing_link/{id}
export const updateAntiStealingLink = (id: string, data: Partial<AntiStealingLink>) =>
  requestV1.put<never, { anti_stealing_link: AntiStealingLink }>(`/anti_stealing_link/${id}`, data)

// API_REFERENCE.md §1.12 - DELETE /anti_stealing_link/{id}
export const deleteAntiStealingLink = (id: string) => requestV1.delete(`/anti_stealing_link/${id}`)
