// log 日志中心模块 API
// 对应 API_REFERENCE.md §4 - §9
import { requestV1 } from './request'
import type {
  AttackLog,
  AttackQueryCriteria,
  AttackStatisticInfo,
  AttackLogBackupTiming,
  FlowLog,
  FlowQueryOperation,
  AntiVirusLog,
  AntiTamperLog,
  OperationLog,
  WebAccessReport,
  WebAccessStatistics,
} from './types/log'

// === §4 攻击日志 ===

// API_REFERENCE.md §4 - GET /attack_logs
export const listAttackLogs = (params?: Record<string, unknown>) =>
  requestV1.get<never, { attack_logs: AttackLog[] }>('/attack_logs', { params })

// API_REFERENCE.md §4 - GET /attack_logs/{id}
export const getAttackLog = (id: string) =>
  requestV1.get<never, { attack_log: AttackLog }>(`/attack_logs/${id}`)

// API_REFERENCE.md §4 - POST /attack_logs/query/custom
export const queryAttackLogsCustom = (data: Record<string, unknown>) =>
  requestV1.post<never, { attack_logs: AttackLog[] }>('/attack_logs/query/custom', data)

// API_REFERENCE.md §4 - GET /attack_logs_num
export const getAttackLogsNum = () => requestV1.get<never, { total: number }>('/attack_logs_num')

// API_REFERENCE.md §4 - GET /attack_logs_export
export const exportAttackLogs = (params?: Record<string, unknown>) =>
  requestV1.get<never, Blob>('/attack_logs_export', { params, responseType: 'blob' })

// API_REFERENCE.md §4 - DELETE /attack_logs
export const clearAttackLogs = () => requestV1.delete('/attack_logs')

// API_REFERENCE.md §4 - GET /attack_stats/statistic_info
export const getAttackStatisticInfo = () =>
  requestV1.get<never, AttackStatisticInfo>('/attack_stats/statistic_info')

// API_REFERENCE.md §4 - GET /attack_query_criteria
export const listAttackQueryCriteria = () =>
  requestV1.get<never, { attack_query_criteria: AttackQueryCriteria[] }>('/attack_query_criteria')

// API_REFERENCE.md §4 - GET /attack_query_criteria/{id}
export const getAttackQueryCriteria = (id: string) =>
  requestV1.get<never, { attack_query_criteria: AttackQueryCriteria }>(
    `/attack_query_criteria/${id}`,
  )

// API_REFERENCE.md §4 - POST /attack_query_criteria
export const createAttackQueryCriteria = (data: Omit<AttackQueryCriteria, 'id'>) =>
  requestV1.post<never, { attack_query_criteria: AttackQueryCriteria }>(
    '/attack_query_criteria',
    data,
  )

// API_REFERENCE.md §4 - PUT /attack_query_criteria/{id}
export const updateAttackQueryCriteria = (id: string, data: Partial<AttackQueryCriteria>) =>
  requestV1.put<never, { attack_query_criteria: AttackQueryCriteria }>(
    `/attack_query_criteria/${id}`,
    data,
  )

// API_REFERENCE.md §4 - DELETE /attack_query_criteria/{id}
export const deleteAttackQueryCriteria = (id: string) =>
  requestV1.delete(`/attack_query_criteria/${id}`)

// API_REFERENCE.md §4 - GET /data_maintenance/attack_log_backup_timing
export const getAttackLogBackupTiming = () =>
  requestV1.get<never, AttackLogBackupTiming>('/data_maintenance/attack_log_backup_timing')

// API_REFERENCE.md §4 - PUT /data_maintenance/attack_log_backup_timing
export const updateAttackLogBackupTiming = (data: AttackLogBackupTiming) =>
  requestV1.put<never, AttackLogBackupTiming>('/data_maintenance/attack_log_backup_timing', data)

// === §5 流量日志 ===

// API_REFERENCE.md §5 - POST /flow-logs/query
export const queryFlowLogs = (data: Record<string, unknown>) =>
  requestV1.post<never, { flow_logs: FlowLog[] }>('/flow-logs/query', data)

// API_REFERENCE.md §5 - POST /flow-logs/count
export const countFlowLogs = (data: Record<string, unknown>) =>
  requestV1.post<never, { total: number }>('/flow-logs/count', data)

// API_REFERENCE.md §5 - GET /flow-logs/query/operation
export const listFlowQueryOperations = () =>
  requestV1.get<never, { operations: FlowQueryOperation[] }>('/flow-logs/query/operation')

// API_REFERENCE.md §5 - GET /flow-logs/query/operation/{id}
export const getFlowQueryOperation = (id: string) =>
  requestV1.get<never, { operation: FlowQueryOperation }>(`/flow-logs/query/operation/${id}`)

// API_REFERENCE.md §5 - POST /flow-logs/query/operation
export const createFlowQueryOperation = (data: Omit<FlowQueryOperation, 'id'>) =>
  requestV1.post<never, { operation: FlowQueryOperation }>('/flow-logs/query/operation', data)

// API_REFERENCE.md §5 - PUT /flow-logs/query/operation/{id}
export const updateFlowQueryOperation = (id: string, data: Partial<FlowQueryOperation>) =>
  requestV1.put<never, { operation: FlowQueryOperation }>(`/flow-logs/query/operation/${id}`, data)

// API_REFERENCE.md §5 - DELETE /flow-logs/query/operation/{id}
export const deleteFlowQueryOperation = (id: string) =>
  requestV1.delete(`/flow-logs/query/operation/${id}`)

// API_REFERENCE.md §5 - DELETE /flow-logs/clear
export const clearFlowLogs = () => requestV1.delete('/flow-logs/clear')

// === §6 防病毒日志 ===

// API_REFERENCE.md §6 - GET /anti_virus_logs
export const listAntiVirusLogs = (params?: Record<string, unknown>) =>
  requestV1.get<never, { anti_virus_logs: AntiVirusLog[] }>('/anti_virus_logs', { params })

// API_REFERENCE.md §6 - GET /anti_virus_logs/{id}
export const getAntiVirusLog = (id: string) =>
  requestV1.get<never, { anti_virus_log: AntiVirusLog }>(`/anti_virus_logs/${id}`)

// API_REFERENCE.md §6 - GET /anti_virus_logs_amount
export const getAntiVirusLogsAmount = () =>
  requestV1.get<never, { total: number }>('/anti_virus_logs_amount')

// API_REFERENCE.md §6 - DELETE /anti_virus_logs
export const clearAntiVirusLogs = () => requestV1.delete('/anti_virus_logs')

// API_REFERENCE.md §6 - GET /anti_virus_logs_export
export const exportAntiVirusLogs = (params?: Record<string, unknown>) =>
  requestV1.get<never, Blob>('/anti_virus_logs_export', { params, responseType: 'blob' })

// === §7 防篡改日志 ===

// API_REFERENCE.md §7 - GET /anti_tamper_logs
export const listAntiTamperLogs = (params?: Record<string, unknown>) =>
  requestV1.get<never, { anti_tamper_logs: AntiTamperLog[] }>('/anti_tamper_logs', { params })

// API_REFERENCE.md §7 - GET /anti_tamper_logs/{id}
export const getAntiTamperLog = (id: string) =>
  requestV1.get<never, { anti_tamper_log: AntiTamperLog }>(`/anti_tamper_logs/${id}`)

// API_REFERENCE.md §7 - GET /anti_tamper_log_num
export const getAntiTamperLogNum = () =>
  requestV1.get<never, { total: number }>('/anti_tamper_log_num')

// API_REFERENCE.md §7 - DELETE /anti_tamper_logs
export const clearAntiTamperLogs = () => requestV1.delete('/anti_tamper_logs')

// API_REFERENCE.md §7 - GET /anti_tamper_logs/{id}/old_file/{file_name}
export const downloadAntiTamperOldFile = (id: string, fileName: string) =>
  requestV1.get<never, Blob>(`/anti_tamper_logs/${id}/old_file/${fileName}`, {
    responseType: 'blob',
  })

// API_REFERENCE.md §7 - GET /anti_tamper_logs/{id}/new_file/{file_name}
export const downloadAntiTamperNewFile = (id: string, fileName: string) =>
  requestV1.get<never, Blob>(`/anti_tamper_logs/${id}/new_file/${fileName}`, {
    responseType: 'blob',
  })

// API_REFERENCE.md §7 - PUT /anti_tamper_logs/{id}/confirm_update
export const confirmAntiTamperUpdate = (id: string) =>
  requestV1.put(`/anti_tamper_logs/${id}/confirm_update`)

// === §8 操作日志 ===

// API_REFERENCE.md §8 - GET /operation_logs
export const listOperationLogs = (params?: Record<string, unknown>) =>
  requestV1.get<never, { operation_logs: OperationLog[] }>('/operation_logs', { params })

// API_REFERENCE.md §8 - GET /operation_log_num
export const getOperationLogNum = () =>
  requestV1.get<never, { total: number }>('/operation_log_num')

// API_REFERENCE.md §8 - DELETE /operation_logs
export const clearOperationLogs = () => requestV1.delete('/operation_logs')

// API_REFERENCE.md §8 - POST /operation_logs/query
export const queryOperationLogs = (data: Record<string, unknown>) =>
  requestV1.post<never, { operation_logs: OperationLog[] }>('/operation_logs/query', data)

// API_REFERENCE.md §8 - GET /operation_logs/export
export const exportOperationLogs = (params?: Record<string, unknown>) =>
  requestV1.get<never, Blob>('/operation_logs/export', { params, responseType: 'blob' })

// API_REFERENCE.md §8 - GET /operation_logs/back_up
export const backupOperationLogs = () =>
  requestV1.get<never, Blob>('/operation_logs/back_up', { responseType: 'blob' })

// API_REFERENCE.md §8 - POST /operation_logs/import_backup
export const importOperationLogsBackup = (data: FormData) =>
  requestV1.post('/operation_logs/import_backup', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// === §9 Web 审计 ===

// API_REFERENCE.md §9 - GET /web_access/{site_id}/type/{rep_type}
export const getWebAccessReport = (siteId: string, repType: string) =>
  requestV1.get<never, WebAccessReport>(`/web_access/${siteId}/type/${repType}`)

// API_REFERENCE.md §9 - GET /web_access/{site_id}/statistics/{id}
export const getWebAccessStatistics = (siteId: string, id: string) =>
  requestV1.get<never, WebAccessStatistics>(`/web_access/${siteId}/statistics/${id}`)

// API_REFERENCE.md §9 - POST /web_access/{site_id}
export const triggerWebAccessStatistics = (siteId: string) =>
  requestV1.post(`/web_access/${siteId}`)

// API_REFERENCE.md §9 - DELETE /web_access
export const clearAllWebAccess = () => requestV1.delete('/web_access')
