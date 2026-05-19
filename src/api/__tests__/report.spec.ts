import { describe, it, expect, vi, beforeEach } from 'vitest'

// 对照 API_REFERENCE.md §14
vi.mock('../request', () => ({
  requestV1: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}))

import * as api from '../report'
import { requestV1 } from '../request'

const mockGet = requestV1.get as ReturnType<typeof vi.fn>
const mockPost = requestV1.post as ReturnType<typeof vi.fn>
const mockPut = requestV1.put as ReturnType<typeof vi.fn>
const mockDelete = requestV1.delete as ReturnType<typeof vi.fn>

describe('report API - 对照 API_REFERENCE.md §14', () => {
  beforeEach(() => vi.clearAllMocks())

  // §14.1 自定义报表 CRUD
  it('listCustomReports → GET /reports/custom', async () => {
    await api.listCustomReports()
    expect(mockGet).toHaveBeenCalledWith('/reports/custom')
  })

  it('getCustomReport → GET /reports/custom/{id}', async () => {
    await api.getCustomReport('cr-001')
    expect(mockGet).toHaveBeenCalledWith('/reports/custom/cr-001')
  })

  it('createCustomReport → POST /reports/custom', async () => {
    const data = { name: '测试报表', report_type: 'attack' as const, time_range: 'day' as const }
    await api.createCustomReport(data)
    expect(mockPost).toHaveBeenCalledWith('/reports/custom', data)
  })

  it('updateCustomReport → PUT /reports/custom/{id}', async () => {
    await api.updateCustomReport('cr-001', { name: '更新报表' })
    expect(mockPut).toHaveBeenCalledWith('/reports/custom/cr-001', { name: '更新报表' })
  })

  it('deleteCustomReport → DELETE /reports/custom/{id}', async () => {
    await api.deleteCustomReport('cr-001')
    expect(mockDelete).toHaveBeenCalledWith('/reports/custom/cr-001')
  })

  // §14.2 合并报表 CRUD
  it('listCombinedReports → GET /reports/combined', async () => {
    await api.listCombinedReports()
    expect(mockGet).toHaveBeenCalledWith('/reports/combined')
  })

  it('getCombinedReport → GET /reports/combined/{id}', async () => {
    await api.getCombinedReport('cb-001')
    expect(mockGet).toHaveBeenCalledWith('/reports/combined/cb-001')
  })

  it('createCombinedReport → POST /reports/combined', async () => {
    const data = { name: '合并报表', report_ids: ['cr-001', 'cr-002'], layout: 'vertical' as const }
    await api.createCombinedReport(data)
    expect(mockPost).toHaveBeenCalledWith('/reports/combined', data)
  })

  it('updateCombinedReport → PUT /reports/combined/{id}', async () => {
    await api.updateCombinedReport('cb-001', { name: '更新合并报表' })
    expect(mockPut).toHaveBeenCalledWith('/reports/combined/cb-001', { name: '更新合并报表' })
  })

  it('deleteCombinedReport → DELETE /reports/combined/{id}', async () => {
    await api.deleteCombinedReport('cb-001')
    expect(mockDelete).toHaveBeenCalledWith('/reports/combined/cb-001')
  })

  // §14.3 手动生成的报表
  it('listManualGeneratedReports → GET /reports/manual_generated', async () => {
    await api.listManualGeneratedReports()
    expect(mockGet).toHaveBeenCalledWith('/reports/manual_generated')
  })

  it('getManualGeneratedReport → GET /reports/manual_generated/{id}', async () => {
    await api.getManualGeneratedReport('mg-001')
    expect(mockGet).toHaveBeenCalledWith('/reports/manual_generated/mg-001')
  })

  it('deleteManualGeneratedReport → DELETE /reports/manual_generated/{id}', async () => {
    await api.deleteManualGeneratedReport('mg-001')
    expect(mockDelete).toHaveBeenCalledWith('/reports/manual_generated/mg-001')
  })

  // §14.4 定时生成的报表
  it('listTimingGeneratedReports → GET /reports/timing_generated', async () => {
    await api.listTimingGeneratedReports()
    expect(mockGet).toHaveBeenCalledWith('/reports/timing_generated')
  })

  it('getTimingGeneratedReport → GET /reports/timing_generated/{id}', async () => {
    await api.getTimingGeneratedReport('tg-001')
    expect(mockGet).toHaveBeenCalledWith('/reports/timing_generated/tg-001')
  })

  it('deleteTimingGeneratedReport → DELETE /reports/timing_generated/{id}', async () => {
    await api.deleteTimingGeneratedReport('tg-001')
    expect(mockDelete).toHaveBeenCalledWith('/reports/timing_generated/tg-001')
  })

  // §14.5 定时任务 CRUD
  it('listTimingTasks → GET /reports/timing', async () => {
    await api.listTimingTasks()
    expect(mockGet).toHaveBeenCalledWith('/reports/timing')
  })

  it('getTimingTask → GET /reports/timing/{id}', async () => {
    await api.getTimingTask('tt-001')
    expect(mockGet).toHaveBeenCalledWith('/reports/timing/tt-001')
  })

  it('createTimingTask → POST /reports/timing', async () => {
    const data = { name: '定时任务', report_id: 'cr-001', schedule: '0 8 * * *', enabled: true }
    await api.createTimingTask(data)
    expect(mockPost).toHaveBeenCalledWith('/reports/timing', data)
  })

  it('updateTimingTask → PUT /reports/timing/{id}', async () => {
    await api.updateTimingTask('tt-001', { enabled: false })
    expect(mockPut).toHaveBeenCalledWith('/reports/timing/tt-001', { enabled: false })
  })

  it('deleteTimingTask → DELETE /reports/timing/{id}', async () => {
    await api.deleteTimingTask('tt-001')
    expect(mockDelete).toHaveBeenCalledWith('/reports/timing/tt-001')
  })

  // §14.6 手动触发报表生成
  it('generateManualReport → POST /reports/generate_manual_report', async () => {
    const data = { report_id: 'cr-001', format: 'pdf' as const }
    await api.generateManualReport(data)
    expect(mockPost).toHaveBeenCalledWith('/reports/generate_manual_report', data)
  })
})
