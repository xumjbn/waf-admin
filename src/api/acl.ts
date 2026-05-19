// ACL 访问控制模块 API
// 对应 API_REFERENCE.md §7 访问控制
import { requestV1 } from './request'
import type { AclPolicy, AclRule, PriorityUpdate } from './types/acl'

// === ACL 策略 ===

// GET /v1/acl_policies
export const listAclPolicies = () =>
  requestV1.get<never, { policies: AclPolicy[] }>('/acl_policies')

// GET /v1/acl_policies/{id}
export const getAclPolicy = (id: string) => requestV1.get<never, AclPolicy>(`/acl_policies/${id}`)

// POST /v1/acl_policies
export const createAclPolicy = (data: Partial<AclPolicy>) =>
  requestV1.post<Partial<AclPolicy>, AclPolicy>('/acl_policies', data)

// PUT /v1/acl_policies/{id}
export const updateAclPolicy = (id: string, data: Partial<AclPolicy>) =>
  requestV1.put<Partial<AclPolicy>, AclPolicy>(`/acl_policies/${id}`, data)

// DELETE /v1/acl_policies/{id}
export const deleteAclPolicy = (id: string) => requestV1.delete(`/acl_policies/${id}`)

// PUT /v1/acl_policies/{id}/priority
export const updateAclPolicyPriority = (id: string, direction: 'up' | 'down') =>
  requestV1.put<PriorityUpdate, { message: string }>(`/acl_policies/${id}/priority`, { direction })

// === ACL 规则 ===

// GET /v1/acl_policies/{policy_id}/rules
export const listAclRules = (policyId: string) =>
  requestV1.get<never, { rules: AclRule[] }>(`/acl_policies/${policyId}/rules`)

// GET /v1/acl_policies/{policy_id}/rules/{id}
export const getAclRule = (policyId: string, id: string) =>
  requestV1.get<never, AclRule>(`/acl_policies/${policyId}/rules/${id}`)

// POST /v1/acl_policies/{policy_id}/rules
export const createAclRule = (policyId: string, data: Partial<AclRule>) =>
  requestV1.post<Partial<AclRule>, AclRule>(`/acl_policies/${policyId}/rules`, data)

// PUT /v1/acl_policies/{policy_id}/rules/{id}
export const updateAclRule = (policyId: string, id: string, data: Partial<AclRule>) =>
  requestV1.put<Partial<AclRule>, AclRule>(`/acl_policies/${policyId}/rules/${id}`, data)

// DELETE /v1/acl_policies/{policy_id}/rules/{id}
export const deleteAclRule = (policyId: string, id: string) =>
  requestV1.delete(`/acl_policies/${policyId}/rules/${id}`)
