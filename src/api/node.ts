// node 节点管理模块 API
// 对应 API_REFERENCE.md §16
import { requestV1 } from './request'
import type {
  Node,
  ExtensionNode,
  ExtendClusterPayload,
  ExtendStatus,
  ScanResult,
  ServiceStatistics,
} from './types/node'

// === §16 节点管理 ===

// API_REFERENCE.md §16 - GET /nodes
export const listNodes = () => requestV1.get<never, { nodes: Node[] }>('/nodes')

// API_REFERENCE.md §16 - GET /nodes/{id}
export const getNode = (id: string) => requestV1.get<never, { node: Node }>(`/nodes/${id}`)

// API_REFERENCE.md §16 - PUT /nodes/{id}
export const updateNode = (id: string, data: Partial<Node>) =>
  requestV1.put<never, { node: Node }>(`/nodes/${id}`, data)

// === §16 扩展节点 ===

// API_REFERENCE.md §16 - GET /extension-nodes/nodes/{node_ip}
export const getExtensionNode = (nodeIp: string) =>
  requestV1.get<never, { node: ExtensionNode }>(`/extension-nodes/nodes/${nodeIp}`)

// API_REFERENCE.md §16 - POST /extension-nodes/scan
export const scanClusterNodes = () => requestV1.post<never, ScanResult>('/extension-nodes/scan')

// API_REFERENCE.md §16 - POST /extension-nodes/extend
export const extendCluster = (data: ExtendClusterPayload) =>
  requestV1.post<never, { message: string }>('/extension-nodes/extend', data)

// API_REFERENCE.md §16 - GET /extension-nodes/extend-status
export const getExtendStatus = () =>
  requestV1.get<never, ExtendStatus>('/extension-nodes/extend-status')

// === §16 服务统计 ===

// API_REFERENCE.md §16 - GET /service-statistics
export const getServiceStatistics = () =>
  requestV1.get<never, ServiceStatistics>('/service-statistics')
