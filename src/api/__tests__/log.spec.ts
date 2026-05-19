import { describe, it, expect, vi, beforeEach } from 'vitest'

// 对照 API_REFERENCE.md §4 - §9
vi.mock('../request', () => ({
  requestV1: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}))

import * as api from '../log'
import { requestV1 } from '../request'

const mockGet = requestV1.get as ReturnType<typeof vi.fn>
const mockPost = requestV1.post as ReturnType<typeof vi.fn>
const mockPut = requestV1.put as ReturnType<typeof vi.fn>
const mockDelete = requestV1.delete as ReturnType<typeof vi.fn>

describe('log API - 对照 API_REFERENCE.md', () => {
  beforeEach(() => vi.clearAllMocks())

  // §4 攻击日志
  it('listAttackLogs → GET /attack_logs', async () => {
    await api.listAttackLogs({ page: 1 })
    expect(mockGet).toHaveBeenCalledWith('/attack_logs', { params: { page: 1 } })
  })

  it('getAttackLog → GET /attack_logs/{id}', async () => {
    await api.getAttackLog('log1')
    expect(mockGet).toHaveBeenCalledWith('/attack_logs/log1')
  })

  it('queryAttackLogsCustom → POST /attack_logs/query/custom', async () => {
    const data = { severity: 'high' }
    await api.queryAttackLogsCustom(data)
    expect(mockPost).toHaveBeenCalledWith('/attack_logs/query/custom', data)
  })

  it('getAttackLogsNum → GET /attack_logs_num', async () => {
    await api.getAttackLogsNum()
    expect(mockGet).toHaveBeenCalledWith('/attack_logs_num')
  })

  it('exportAttackLogs → GET /attack_logs_export', async () => {
    await api.exportAttackLogs({ format: 'csv' })
    expect(mockGet).toHaveBeenCalledWith('/attack_logs_export', {
      params: { format: 'csv' },
      responseType: 'blob',
    })
  })

  it('clearAttackLogs → DELETE /attack_logs', async () => {
    await api.clearAttackLogs()
    expect(mockDelete).toHaveBeenCalledWith('/attack_logs')
  })

  it('getAttackStatisticInfo → GET /attack_stats/statistic_info', async () => {
    await api.getAttackStatisticInfo()
    expect(mockGet).toHaveBeenCalledWith('/attack_stats/statistic_info')
  })

  it('listAttackQueryCriteria → GET /attack_query_criteria', async () => {
    await api.listAttackQueryCriteria()
    expect(mockGet).toHaveBeenCalledWith('/attack_query_criteria')
  })

  it('getAttackQueryCriteria → GET /attack_query_criteria/{id}', async () => {
    await api.getAttackQueryCriteria('crit1')
    expect(mockGet).toHaveBeenCalledWith('/attack_query_criteria/crit1')
  })

  it('createAttackQueryCriteria → POST /attack_query_criteria', async () => {
    const data = { name: 'criteria', conditions: {} } as Parameters<
      typeof api.createAttackQueryCriteria
    >[0]
    await api.createAttackQueryCriteria(data)
    expect(mockPost).toHaveBeenCalledWith('/attack_query_criteria', data)
  })

  it('updateAttackQueryCriteria → PUT /attack_query_criteria/{id}', async () => {
    await api.updateAttackQueryCriteria('crit1', { name: 'updated' })
    expect(mockPut).toHaveBeenCalledWith('/attack_query_criteria/crit1', { name: 'updated' })
  })

  it('deleteAttackQueryCriteria → DELETE /attack_query_criteria/{id}', async () => {
    await api.deleteAttackQueryCriteria('crit1')
    expect(mockDelete).toHaveBeenCalledWith('/attack_query_criteria/crit1')
  })

  it('getAttackLogBackupTiming → GET /data_maintenance/attack_log_backup_timing', async () => {
    await api.getAttackLogBackupTiming()
    expect(mockGet).toHaveBeenCalledWith('/data_maintenance/attack_log_backup_timing')
  })

  it('updateAttackLogBackupTiming → PUT /data_maintenance/attack_log_backup_timing', async () => {
    const data = { enabled: true, schedule: '0 0 * * *' } as Parameters<
      typeof api.updateAttackLogBackupTiming
    >[0]
    await api.updateAttackLogBackupTiming(data)
    expect(mockPut).toHaveBeenCalledWith('/data_maintenance/attack_log_backup_timing', data)
  })

  // §5 流量日志
  it('queryFlowLogs → POST /flow-logs/query', async () => {
    const data = { protocol: 'tcp' }
    await api.queryFlowLogs(data)
    expect(mockPost).toHaveBeenCalledWith('/flow-logs/query', data)
  })

  it('countFlowLogs → POST /flow-logs/count', async () => {
    const data = { protocol: 'tcp' }
    await api.countFlowLogs(data)
    expect(mockPost).toHaveBeenCalledWith('/flow-logs/count', data)
  })

  it('listFlowQueryOperations → GET /flow-logs/query/operation', async () => {
    await api.listFlowQueryOperations()
    expect(mockGet).toHaveBeenCalledWith('/flow-logs/query/operation')
  })

  it('getFlowQueryOperation → GET /flow-logs/query/operation/{id}', async () => {
    await api.getFlowQueryOperation('op1')
    expect(mockGet).toHaveBeenCalledWith('/flow-logs/query/operation/op1')
  })

  it('createFlowQueryOperation → POST /flow-logs/query/operation', async () => {
    const data = { name: 'operation', conditions: {} } as Parameters<
      typeof api.createFlowQueryOperation
    >[0]
    await api.createFlowQueryOperation(data)
    expect(mockPost).toHaveBeenCalledWith('/flow-logs/query/operation', data)
  })

  it('updateFlowQueryOperation → PUT /flow-logs/query/operation/{id}', async () => {
    await api.updateFlowQueryOperation('op1', { name: 'updated' })
    expect(mockPut).toHaveBeenCalledWith('/flow-logs/query/operation/op1', { name: 'updated' })
  })

  it('deleteFlowQueryOperation → DELETE /flow-logs/query/operation/{id}', async () => {
    await api.deleteFlowQueryOperation('op1')
    expect(mockDelete).toHaveBeenCalledWith('/flow-logs/query/operation/op1')
  })

  it('clearFlowLogs → DELETE /flow-logs/clear', async () => {
    await api.clearFlowLogs()
    expect(mockDelete).toHaveBeenCalledWith('/flow-logs/clear')
  })

  // §6 防病毒日志
  it('listAntiVirusLogs → GET /anti_virus_logs', async () => {
    await api.listAntiVirusLogs({ page: 1 })
    expect(mockGet).toHaveBeenCalledWith('/anti_virus_logs', { params: { page: 1 } })
  })

  it('getAntiVirusLog → GET /anti_virus_logs/{id}', async () => {
    await api.getAntiVirusLog('av1')
    expect(mockGet).toHaveBeenCalledWith('/anti_virus_logs/av1')
  })

  it('getAntiVirusLogsAmount → GET /anti_virus_logs_amount', async () => {
    await api.getAntiVirusLogsAmount()
    expect(mockGet).toHaveBeenCalledWith('/anti_virus_logs_amount')
  })

  it('clearAntiVirusLogs → DELETE /anti_virus_logs', async () => {
    await api.clearAntiVirusLogs()
    expect(mockDelete).toHaveBeenCalledWith('/anti_virus_logs')
  })

  it('exportAntiVirusLogs → GET /anti_virus_logs_export', async () => {
    await api.exportAntiVirusLogs({ format: 'csv' })
    expect(mockGet).toHaveBeenCalledWith('/anti_virus_logs_export', {
      params: { format: 'csv' },
      responseType: 'blob',
    })
  })

  // §7 防篡改日志
  it('listAntiTamperLogs → GET /anti_tamper_logs', async () => {
    await api.listAntiTamperLogs({ page: 1 })
    expect(mockGet).toHaveBeenCalledWith('/anti_tamper_logs', { params: { page: 1 } })
  })

  it('getAntiTamperLog → GET /anti_tamper_logs/{id}', async () => {
    await api.getAntiTamperLog('at1')
    expect(mockGet).toHaveBeenCalledWith('/anti_tamper_logs/at1')
  })

  it('getAntiTamperLogNum → GET /anti_tamper_log_num', async () => {
    await api.getAntiTamperLogNum()
    expect(mockGet).toHaveBeenCalledWith('/anti_tamper_log_num')
  })

  it('clearAntiTamperLogs → DELETE /anti_tamper_logs', async () => {
    await api.clearAntiTamperLogs()
    expect(mockDelete).toHaveBeenCalledWith('/anti_tamper_logs')
  })

  it('downloadAntiTamperOldFile → GET /anti_tamper_logs/{id}/old_file/{file_name}', async () => {
    await api.downloadAntiTamperOldFile('at1', 'index.html')
    expect(mockGet).toHaveBeenCalledWith('/anti_tamper_logs/at1/old_file/index.html', {
      responseType: 'blob',
    })
  })

  it('downloadAntiTamperNewFile → GET /anti_tamper_logs/{id}/new_file/{file_name}', async () => {
    await api.downloadAntiTamperNewFile('at1', 'index.html')
    expect(mockGet).toHaveBeenCalledWith('/anti_tamper_logs/at1/new_file/index.html', {
      responseType: 'blob',
    })
  })

  it('confirmAntiTamperUpdate → PUT /anti_tamper_logs/{id}/confirm_update', async () => {
    await api.confirmAntiTamperUpdate('at1')
    expect(mockPut).toHaveBeenCalledWith('/anti_tamper_logs/at1/confirm_update')
  })

  // §8 操作日志
  it('listOperationLogs → GET /operation_logs', async () => {
    await api.listOperationLogs({ page: 1 })
    expect(mockGet).toHaveBeenCalledWith('/operation_logs', { params: { page: 1 } })
  })

  it('getOperationLogNum → GET /operation_log_num', async () => {
    await api.getOperationLogNum()
    expect(mockGet).toHaveBeenCalledWith('/operation_log_num')
  })

  it('clearOperationLogs → DELETE /operation_logs', async () => {
    await api.clearOperationLogs()
    expect(mockDelete).toHaveBeenCalledWith('/operation_logs')
  })

  it('queryOperationLogs → POST /operation_logs/query', async () => {
    const data = { user_name: 'admin' }
    await api.queryOperationLogs(data)
    expect(mockPost).toHaveBeenCalledWith('/operation_logs/query', data)
  })

  it('exportOperationLogs → GET /operation_logs/export', async () => {
    await api.exportOperationLogs({ format: 'csv' })
    expect(mockGet).toHaveBeenCalledWith('/operation_logs/export', {
      params: { format: 'csv' },
      responseType: 'blob',
    })
  })

  it('backupOperationLogs → GET /operation_logs/back_up', async () => {
    await api.backupOperationLogs()
    expect(mockGet).toHaveBeenCalledWith('/operation_logs/back_up', { responseType: 'blob' })
  })

  it('importOperationLogsBackup → POST /operation_logs/import_backup', async () => {
    const formData = new FormData()
    await api.importOperationLogsBackup(formData)
    expect(mockPost).toHaveBeenCalledWith('/operation_logs/import_backup', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  })

  // §9 Web 审计
  it('getWebAccessReport → GET /web_access/{site_id}/type/{rep_type}', async () => {
    await api.getWebAccessReport('site1', 'daily')
    expect(mockGet).toHaveBeenCalledWith('/web_access/site1/type/daily')
  })

  it('getWebAccessStatistics → GET /web_access/{site_id}/statistics/{id}', async () => {
    await api.getWebAccessStatistics('site1', 'stat1')
    expect(mockGet).toHaveBeenCalledWith('/web_access/site1/statistics/stat1')
  })

  it('triggerWebAccessStatistics → POST /web_access/{site_id}', async () => {
    await api.triggerWebAccessStatistics('site1')
    expect(mockPost).toHaveBeenCalledWith('/web_access/site1')
  })

  it('clearAllWebAccess → DELETE /web_access', async () => {
    await api.clearAllWebAccess()
    expect(mockDelete).toHaveBeenCalledWith('/web_access')
  })
})
