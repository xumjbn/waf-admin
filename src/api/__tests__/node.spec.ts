import { describe, it, expect, vi, beforeEach } from 'vitest'

// 对照 API_REFERENCE.md §16
vi.mock('../request', () => ({
  requestV1: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}))

import * as api from '../node'
import { requestV1 } from '../request'

const mockGet = requestV1.get as ReturnType<typeof vi.fn>
const mockPost = requestV1.post as ReturnType<typeof vi.fn>
const mockPut = requestV1.put as ReturnType<typeof vi.fn>

describe('node API - 对照 API_REFERENCE.md', () => {
  beforeEach(() => vi.clearAllMocks())

  // §16 节点管理
  it('listNodes → GET /nodes', async () => {
    await api.listNodes()
    expect(mockGet).toHaveBeenCalledWith('/nodes')
  })

  it('getNode → GET /nodes/{id}', async () => {
    await api.getNode('n1')
    expect(mockGet).toHaveBeenCalledWith('/nodes/n1')
  })

  it('updateNode → PUT /nodes/{id}', async () => {
    await api.updateNode('n1', { name: 'updated' })
    expect(mockPut).toHaveBeenCalledWith('/nodes/n1', { name: 'updated' })
  })

  // §16 扩展节点
  it('getExtensionNode → GET /extension-nodes/nodes/{node_ip}', async () => {
    await api.getExtensionNode('192.168.1.10')
    expect(mockGet).toHaveBeenCalledWith('/extension-nodes/nodes/192.168.1.10')
  })

  it('scanClusterNodes → POST /extension-nodes/scan', async () => {
    await api.scanClusterNodes()
    expect(mockPost).toHaveBeenCalledWith('/extension-nodes/scan')
  })

  it('extendCluster → POST /extension-nodes/extend', async () => {
    const data = { node_ips: ['192.168.1.10'] }
    await api.extendCluster(data)
    expect(mockPost).toHaveBeenCalledWith('/extension-nodes/extend', data)
  })

  it('getExtendStatus → GET /extension-nodes/extend-status', async () => {
    await api.getExtendStatus()
    expect(mockGet).toHaveBeenCalledWith('/extension-nodes/extend-status')
  })

  // §16 服务统计
  it('getServiceStatistics → GET /service-statistics', async () => {
    await api.getServiceStatistics()
    expect(mockGet).toHaveBeenCalledWith('/service-statistics')
  })
})
