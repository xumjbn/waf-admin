// policy 防护策略模块 API
// 对应 API_REFERENCE.md §3 + §1.8-1.9 + §6
import { requestV1 } from './request'
import type {
  Policy,
  Category,
  Rule,
  CustomParameter,
  CustomParameterName,
  GlobalCustomRule,
  CustomRuleNode,
  ChangeHistoryItem,
} from './types/policy'

// === 策略 ===

// API_REFERENCE.md §3.1 - GET /policies
export const listPolicies = () => requestV1.get<never, { policies: Policy[] }>('/policies')

// API_REFERENCE.md §3.1 - POST /policies
export const createPolicy = (data: Partial<Policy>) =>
  requestV1.post<Partial<Policy>, Policy>('/policies', data)

// API_REFERENCE.md §3.1 - GET /policies/{id}
export const getPolicy = (id: string) => requestV1.get<never, Policy>(`/policies/${id}`)

// API_REFERENCE.md §3.1 - PUT /policies/{id}
export const updatePolicy = (id: string, data: Partial<Policy>) =>
  requestV1.put<Partial<Policy>, Policy>(`/policies/${id}`, data)

// API_REFERENCE.md §3.1 - DELETE /policies/{id}
export const deletePolicy = (id: string) => requestV1.delete(`/policies/${id}`)

// API_REFERENCE.md §3.1 - GET /policies/{id}/change_history
export const getPolicyChangeHistory = (id: string) =>
  requestV1.get<never, { history: ChangeHistoryItem[] }>(`/policies/${id}/change_history`)

// API_REFERENCE.md §3.1 - POST /policies/upgrade
export const upgradePolicy = (data: Record<string, unknown>) =>
  requestV1.post('/policies/upgrade', data)

// API_REFERENCE.md §3.1 - GET /policies/upgrade/log
export const getPolicyUpgradeLog = () => requestV1.get<never, unknown>('/policies/upgrade/log')

// === 分类 ===

// API_REFERENCE.md §3.2 - GET /policies/{policy_id}/categories
export const listCategories = (policyId: string) =>
  requestV1.get<never, { categories: Category[] }>(`/policies/${policyId}/categories`)

// API_REFERENCE.md §3.2 - GET /policies/{policy_id}/categories/{id}
export const getCategory = (policyId: string, id: string) =>
  requestV1.get<never, Category>(`/policies/${policyId}/categories/${id}`)

// API_REFERENCE.md §3.2 - PUT /policies/{policy_id}/categories/{id}
export const updateCategory = (policyId: string, id: string, data: Partial<Category>) =>
  requestV1.put<Partial<Category>, Category>(`/policies/${policyId}/categories/${id}`, data)

// === 规则 ===

// API_REFERENCE.md §3.3 - GET /policies/{policy_id}/rules
export const listRules = (policyId: string) =>
  requestV1.get<never, { rules: Rule[] }>(`/policies/${policyId}/rules`)

// API_REFERENCE.md §3.3 - GET /policies/{policy_id}/rules/{id}
export const getRule = (policyId: string, id: string) =>
  requestV1.get<never, Rule>(`/policies/${policyId}/rules/${id}`)

// API_REFERENCE.md §3.3 - PUT /policies/{policy_id}/rules/{id}
export const updateRule = (policyId: string, id: string, data: Partial<Rule>) =>
  requestV1.put<Partial<Rule>, Rule>(`/policies/${policyId}/rules/${id}`, data)

// === 自定义参数 ===

// API_REFERENCE.md §3.4 - GET /policies/{policy_id}/custom_parameters
export const listCustomParameters = (policyId: string) =>
  requestV1.get<never, { parameters: CustomParameter[] }>(`/policies/${policyId}/custom_parameters`)

// API_REFERENCE.md §3.4 - GET /policies/{policy_id}/default_custom_parameters
export const getDefaultCustomParameters = (policyId: string) =>
  requestV1.get<never, { parameters: CustomParameter[] }>(
    `/policies/${policyId}/default_custom_parameters`,
  )

// API_REFERENCE.md §3.4 - PUT /policies/{policy_id}/custom_parameters/{name}
export const updateCustomParameter = (policyId: string, name: CustomParameterName, value: number) =>
  requestV1.put(`/policies/${policyId}/custom_parameters/${name}`, { value })

// API_REFERENCE.md §3.4 - DELETE /policies/{policy_id}/custom_parameters/{name}
export const deleteCustomParameter = (policyId: string, name: CustomParameterName) =>
  requestV1.delete(`/policies/${policyId}/custom_parameters/${name}`)

// === 全局自定义规则 ===

// API_REFERENCE.md §1.8 - GET /custom_rules
export const listGlobalCustomRules = () =>
  requestV1.get<never, { custom_rules: GlobalCustomRule[] }>('/custom_rules')

// API_REFERENCE.md §1.8 - GET /custom_rules/{id}
export const getGlobalCustomRule = (id: string) =>
  requestV1.get<never, GlobalCustomRule>(`/custom_rules/${id}`)

// API_REFERENCE.md §1.8 - POST /custom_rules
export const createGlobalCustomRule = (data: Partial<GlobalCustomRule>) =>
  requestV1.post<Partial<GlobalCustomRule>, GlobalCustomRule>('/custom_rules', data)

// API_REFERENCE.md §1.8 - PUT /custom_rules/{id}
export const updateGlobalCustomRule = (id: string, data: Partial<GlobalCustomRule>) =>
  requestV1.put<Partial<GlobalCustomRule>, GlobalCustomRule>(`/custom_rules/${id}`, data)

// API_REFERENCE.md §1.8 - DELETE /custom_rules/{id}
export const deleteGlobalCustomRule = (id: string) => requestV1.delete(`/custom_rules/${id}`)

// === 自定义规则节点 ===

// API_REFERENCE.md §1.9 - GET /custom_rules/{custom_rule_id}/nodes
export const listCustomRuleNodes = (customRuleId: string) =>
  requestV1.get<never, { nodes: CustomRuleNode[] }>(`/custom_rules/${customRuleId}/nodes`)

// API_REFERENCE.md §1.9 - GET /custom_rules/{custom_rule_id}/nodes/{id}
export const getCustomRuleNode = (customRuleId: string, id: string) =>
  requestV1.get<never, CustomRuleNode>(`/custom_rules/${customRuleId}/nodes/${id}`)

// API_REFERENCE.md §1.9 - POST /custom_rules/{custom_rule_id}/nodes
export const createCustomRuleNode = (customRuleId: string, data: Partial<CustomRuleNode>) =>
  requestV1.post<Partial<CustomRuleNode>, CustomRuleNode>(
    `/custom_rules/${customRuleId}/nodes`,
    data,
  )

// API_REFERENCE.md §1.9 - PUT /custom_rules/{custom_rule_id}/nodes/{id}
export const updateCustomRuleNode = (
  customRuleId: string,
  id: string,
  data: Partial<CustomRuleNode>,
) =>
  requestV1.put<Partial<CustomRuleNode>, CustomRuleNode>(
    `/custom_rules/${customRuleId}/nodes/${id}`,
    data,
  )

// API_REFERENCE.md §1.9 - DELETE /custom_rules/{custom_rule_id}/nodes/{id}
export const deleteCustomRuleNode = (customRuleId: string, id: string) =>
  requestV1.delete(`/custom_rules/${customRuleId}/nodes/${id}`)

// API_REFERENCE.md §1.9 - PUT /custom_rules/{custom_rule_id}/nodes/{id}/priority
export const updateCustomRuleNodePriority = (
  customRuleId: string,
  id: string,
  direction: 'up' | 'down',
) => requestV1.put(`/custom_rules/${customRuleId}/nodes/${id}/priority`, { direction })

// === 防病毒状态 ===

// API_REFERENCE.md §6 - PUT /anti_virus_status/{site_id}
export const updateAntiVirusStatus = (siteId: string, enabled: boolean) =>
  requestV1.put(`/anti_virus_status/${siteId}`, { enabled })
