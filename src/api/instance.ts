// 实例 防护实例模块 API
// 对应 API_REFERENCE.md §2, §13, §15, §16
import request, { requestV1 } from './request'
import type {
  Instance,
  BypassConfig,
  InstancePool,
  HaCluster,
  HaInstance,
  LbVip,
  LbPool,
  LbHealthMonitor,
  LbMemberEntry,
  InstanceInterface,
  InstanceBridge,
} from './types/instance'

// === §2 实例 管理 ===

// API_REFERENCE.md §2 - GET /instances
export const listInstances = () => requestV1.get<never, { instances: Instance[] }>('/instances')

// API_REFERENCE.md §2 - GET /instances/{id}
export const getInstance = (id: string) =>
  requestV1.get<never, { instance: Instance }>(`/instances/${id}`)

// API_REFERENCE.md §2 - POST /instances
export const createInstance = (data: Omit<Instance, 'id' | 'created_at'>) =>
  requestV1.post<never, { instance: Instance }>('/instances', data)

// API_REFERENCE.md §2 - PUT /instances/{id}
export const updateInstance = (id: string, data: Partial<Instance>) =>
  requestV1.put<never, { instance: Instance }>(`/instances/${id}`, data)

// API_REFERENCE.md §2 - DELETE /instances/{id}
export const deleteInstance = (id: string) => requestV1.delete(`/instances/${id}`)

// API_REFERENCE.md §2 - DELETE /instance_pools/{pool_id}/instances/{id}
export const removeInstanceFromPool = (instancePoolId: string, instanceId: string) =>
  requestV1.delete(`/instance_pools/${instancePoolId}/instances/${instanceId}`)

// === §13 负载均衡 ===

// API_REFERENCE.md §13 - GET /lb/vips
export const listLbVips = () => requestV1.get<never, { vips: LbVip[] }>('/lb/vips')

// API_REFERENCE.md §13 - GET /lb/vips/{id}
export const getLbVip = (id: string) => requestV1.get<never, { vip: LbVip }>(`/lb/vips/${id}`)

// API_REFERENCE.md §13 - POST /lb/vips
export const createLbVip = (data: Omit<LbVip, 'id'>) =>
  requestV1.post<never, { vip: LbVip }>('/lb/vips', data)

// API_REFERENCE.md §13 - PUT /lb/vips/{id}
export const updateLbVip = (id: string, data: Partial<LbVip>) =>
  requestV1.put<never, { vip: LbVip }>(`/lb/vips/${id}`, data)

// API_REFERENCE.md §13 - DELETE /lb/vips/{id}
export const deleteLbVip = (id: string) => requestV1.delete(`/lb/vips/${id}`)

// API_REFERENCE.md §13 - GET /lb/pools
export const listLbPools = () => requestV1.get<never, { pools: LbPool[] }>('/lb/pools')

// API_REFERENCE.md §13 - GET /lb/pools/{id}
export const getLbPool = (id: string) => requestV1.get<never, { pool: LbPool }>(`/lb/pools/${id}`)

// API_REFERENCE.md §13 - POST /lb/pools
export const createLbPool = (data: Omit<LbPool, 'id'>) =>
  requestV1.post<never, { pool: LbPool }>('/lb/pools', data)

// API_REFERENCE.md §13 - PUT /lb/pools/{id}
export const updateLbPool = (id: string, data: Partial<LbPool>) =>
  requestV1.put<never, { pool: LbPool }>(`/lb/pools/${id}`, data)

// API_REFERENCE.md §13 - DELETE /lb/pools/{id}
export const deleteLbPool = (id: string) => requestV1.delete(`/lb/pools/${id}`)

// API_REFERENCE.md §13 - GET /lb/healthmonitors
export const listLbHealthMonitors = () =>
  requestV1.get<never, { healthmonitors: LbHealthMonitor[] }>('/lb/healthmonitors')

// API_REFERENCE.md §13 - GET /lb/healthmonitors/{id}
export const getLbHealthMonitor = (id: string) =>
  requestV1.get<never, { healthmonitor: LbHealthMonitor }>(`/lb/healthmonitors/${id}`)

// API_REFERENCE.md §13 - POST /lb/healthmonitors
export const createLbHealthMonitor = (data: Omit<LbHealthMonitor, 'id'>) =>
  requestV1.post<never, { healthmonitor: LbHealthMonitor }>('/lb/healthmonitors', data)

// API_REFERENCE.md §13 - PUT /lb/healthmonitors/{id}
export const updateLbHealthMonitor = (id: string, data: Partial<LbHealthMonitor>) =>
  requestV1.put<never, { healthmonitor: LbHealthMonitor }>(`/lb/healthmonitors/${id}`, data)

// API_REFERENCE.md §13 - DELETE /lb/healthmonitors/{id}
export const deleteLbHealthMonitor = (id: string) => requestV1.delete(`/lb/healthmonitors/${id}`)

// API_REFERENCE.md §13 - GET /lb/members
export const listLbMembers = () => requestV1.get<never, { members: LbMemberEntry[] }>('/lb/members')

// API_REFERENCE.md §13 - GET /lb/members/{id}
export const getLbMember = (id: string) =>
  requestV1.get<never, { member: LbMemberEntry }>(`/lb/members/${id}`)

// API_REFERENCE.md §13 - POST /lb/members
export const createLbMember = (data: Omit<LbMemberEntry, 'id'>) =>
  requestV1.post<never, { member: LbMemberEntry }>('/lb/members', data)

// API_REFERENCE.md §13 - PUT /lb/members/{id}
export const updateLbMember = (id: string, data: Partial<LbMemberEntry>) =>
  requestV1.put<never, { member: LbMemberEntry }>(`/lb/members/${id}`, data)

// API_REFERENCE.md §13 - DELETE /lb/members/{id}
export const deleteLbMember = (id: string) => requestV1.delete(`/lb/members/${id}`)

// === §15 旁路配置 ===

// API_REFERENCE.md §15 - GET /instances/{instance_id}/bypass_cfg
export const listBypassConfigs = (instanceId: string) =>
  requestV1.get<never, { bypass_cfg: BypassConfig[] }>(`/instances/${instanceId}/bypass_cfg`)

// API_REFERENCE.md §15 - GET /instances/{instance_id}/bypass_cfg/{id}
export const getBypassConfig = (instanceId: string, id: string) =>
  requestV1.get<never, { bypass_cfg: BypassConfig }>(`/instances/${instanceId}/bypass_cfg/${id}`)

// API_REFERENCE.md §15 - POST /instances/{instance_id}/bypass_cfg
export const createBypassConfig = (
  instanceId: string,
  data: Omit<BypassConfig, 'id' | 'instance_id'>,
) =>
  requestV1.post<never, { bypass_cfg: BypassConfig }>(`/instances/${instanceId}/bypass_cfg`, data)

// API_REFERENCE.md §15 - PUT /instances/{instance_id}/bypass_cfg/{id}
export const updateBypassConfig = (instanceId: string, id: string, data: Partial<BypassConfig>) =>
  requestV1.put<never, { bypass_cfg: BypassConfig }>(
    `/instances/${instanceId}/bypass_cfg/${id}`,
    data,
  )

// API_REFERENCE.md §15 - DELETE /instances/{instance_id}/bypass_cfg/{id}
export const deleteBypassConfig = (instanceId: string, id: string) =>
  requestV1.delete(`/instances/${instanceId}/bypass_cfg/${id}`)

// === §15 资源池 ===

// API_REFERENCE.md §15 - GET /instance_pools
export const listInstancePools = () =>
  requestV1.get<never, { instance_pools: InstancePool[] }>('/instance_pools')

// API_REFERENCE.md §15 - GET /instance_pools/{id}
export const getInstancePool = (id: string) =>
  requestV1.get<never, { instance_pool: InstancePool }>(`/instance_pools/${id}`)

// API_REFERENCE.md §15 - POST /instance_pools
export const createInstancePool = (data: Omit<InstancePool, 'id'>) =>
  requestV1.post<never, { instance_pool: InstancePool }>('/instance_pools', data)

// API_REFERENCE.md §15 - PUT /instance_pools/{id}
export const updateInstancePool = (id: string, data: Partial<InstancePool>) =>
  requestV1.put<never, { instance_pool: InstancePool }>(`/instance_pools/${id}`, data)

// API_REFERENCE.md §15 - DELETE /instance_pools/{id}
export const deleteInstancePool = (id: string) => requestV1.delete(`/instance_pools/${id}`)

// === §16 HA 集群 (v3) ===

// API_REFERENCE.md §16 - GET /ha-cluster (v3)
export const listHaClusters = () => request.get<never, { clusters: HaCluster[] }>('/ha-cluster')

// API_REFERENCE.md §16 - GET /ha-cluster/{id} (v3)
export const getHaCluster = (id: string) =>
  request.get<never, { cluster: HaCluster }>(`/ha-cluster/${id}`)

// API_REFERENCE.md §16 - POST /ha-cluster (v3)
export const createHaCluster = (data: Omit<HaCluster, 'id'>) =>
  request.post<never, { cluster: HaCluster }>('/ha-cluster', data)

// API_REFERENCE.md §16 - PUT /ha-cluster/{id} (v3)
export const updateHaCluster = (id: string, data: Partial<HaCluster>) =>
  request.put<never, { cluster: HaCluster }>(`/ha-cluster/${id}`, data)

// API_REFERENCE.md §16 - DELETE /ha-cluster/{id} (v3)
export const deleteHaCluster = (id: string) => request.delete(`/ha-cluster/${id}`)

// API_REFERENCE.md §16 - GET /ha-cluster/{cluster_id}/ha-instance (v3)
export const listHaInstances = (clusterId: string) =>
  request.get<never, { ha_instances: HaInstance[] }>(`/ha-cluster/${clusterId}/ha-instance`)

// API_REFERENCE.md §16 - GET /ha-cluster/{cluster_id}/ha-instance/{instance_id} (v3)
export const getHaInstanceInCluster = (clusterId: string, instanceId: string) =>
  request.get<never, { ha_instance: HaInstance }>(
    `/ha-cluster/${clusterId}/ha-instance/${instanceId}`,
  )

// API_REFERENCE.md §16 - POST /ha-cluster/{cluster_id}/ha-instance (v3)
export const addHaInstanceToCluster = (
  clusterId: string,
  data: Omit<HaInstance, 'id' | 'cluster_id'>,
) => request.post<never, { ha_instance: HaInstance }>(`/ha-cluster/${clusterId}/ha-instance`, data)

// API_REFERENCE.md §16 - PUT /ha-cluster/{cluster_id}/ha-instance/{instance_id} (v3)
export const updateHaInstanceInCluster = (
  clusterId: string,
  instanceId: string,
  data: Partial<HaInstance>,
) =>
  request.put<never, { ha_instance: HaInstance }>(
    `/ha-cluster/${clusterId}/ha-instance/${instanceId}`,
    data,
  )

// API_REFERENCE.md §16 - DELETE /ha-cluster/{cluster_id}/ha-instance/{instance_id} (v3)
export const removeHaInstanceFromCluster = (clusterId: string, instanceId: string) =>
  request.delete(`/ha-cluster/${clusterId}/ha-instance/${instanceId}`)

// API_REFERENCE.md §16 - GET /ha-instance/{id} (v3)
export const getHaInstance = (id: string) =>
  request.get<never, { ha_instance: HaInstance }>(`/ha-instance/${id}`)

// API_REFERENCE.md §16 - GET /ha-cluster/ha-instance/{instance_id}/status (v3)
export const getHaInstanceStatus = (instanceId: string) =>
  request.get<never, { status: string }>(`/ha-cluster/ha-instance/${instanceId}/status`)

// === §15 网络接口 ===

// API_REFERENCE.md §15 - GET /instance_networks/{instance_id}/interfaces
export const listInstanceInterfaces = (instanceId: string) =>
  requestV1.get<never, { interfaces: InstanceInterface[] }>(
    `/instance_networks/${instanceId}/interfaces`,
  )

// API_REFERENCE.md §15 - GET /instance_networks/{instance_id}/interfaces/{id}
export const getInstanceInterface = (instanceId: string, id: string) =>
  requestV1.get<never, { interface: InstanceInterface }>(
    `/instance_networks/${instanceId}/interfaces/${id}`,
  )

// API_REFERENCE.md §15 - POST /instance_networks/{instance_id}/interfaces
export const createInstanceInterface = (
  instanceId: string,
  data: Omit<InstanceInterface, 'id' | 'instance_id'>,
) =>
  requestV1.post<never, { interface: InstanceInterface }>(
    `/instance_networks/${instanceId}/interfaces`,
    data,
  )

// API_REFERENCE.md §15 - PUT /instance_networks/{instance_id}/interfaces/{id}
export const updateInstanceInterface = (
  instanceId: string,
  id: string,
  data: Partial<InstanceInterface>,
) =>
  requestV1.put<never, { interface: InstanceInterface }>(
    `/instance_networks/${instanceId}/interfaces/${id}`,
    data,
  )

// API_REFERENCE.md §15 - DELETE /instance_networks/{instance_id}/interfaces/{id}
export const deleteInstanceInterface = (instanceId: string, id: string) =>
  requestV1.delete(`/instance_networks/${instanceId}/interfaces/${id}`)

// API_REFERENCE.md §15 - GET /instance_networks/{instance_id}/bridges
export const listInstanceBridges = (instanceId: string) =>
  requestV1.get<never, { bridges: InstanceBridge[] }>(`/instance_networks/${instanceId}/bridges`)

// API_REFERENCE.md §15 - GET /instance_networks/{instance_id}/bridges/{id}
export const getInstanceBridge = (instanceId: string, id: string) =>
  requestV1.get<never, { bridge: InstanceBridge }>(`/instance_networks/${instanceId}/bridges/${id}`)

// API_REFERENCE.md §15 - POST /instance_networks/{instance_id}/bridges
export const createInstanceBridge = (
  instanceId: string,
  data: Omit<InstanceBridge, 'id' | 'instance_id'>,
) =>
  requestV1.post<never, { bridge: InstanceBridge }>(
    `/instance_networks/${instanceId}/bridges`,
    data,
  )

// API_REFERENCE.md §15 - PUT /instance_networks/{instance_id}/bridges/{id}
export const updateInstanceBridge = (
  instanceId: string,
  id: string,
  data: Partial<InstanceBridge>,
) =>
  requestV1.put<never, { bridge: InstanceBridge }>(
    `/instance_networks/${instanceId}/bridges/${id}`,
    data,
  )

// API_REFERENCE.md §15 - DELETE /instance_networks/{instance_id}/bridges/{id}
export const deleteInstanceBridge = (instanceId: string, id: string) =>
  requestV1.delete(`/instance_networks/${instanceId}/bridges/${id}`)

// === Agent 实例（在线 waf-agent 实例）===

export const listAgents = () =>
  requestV1.get<never, { instances: import('./types/instance').AgentInstance[] }>('/instances')

export const getAgent = (hostname: string) =>
  requestV1.get<never, import('./types/instance').AgentInstance>('/instances/detail', {
    params: { hostname },
  })
