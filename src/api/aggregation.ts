// aggregation 监控模块 API
// 对应 API_REFERENCE.md §10-12 + 前端 Django views 层透传的端点
import { requestV1 } from './request'
import type {
  SystemMonitorAllResponse,
  SystemResourceHistoryParams,
  AttackStatsResponse,
  AttackSeverity,
  AttackSourceTop,
  SiteStats,
  RunningMode,
  FlowTop10Item,
  MonitorMetricParams,
} from './types/aggregation'

// === 系统监控 ===

// API_REFERENCE.md §11 - GET /sys_monitor/system_resource
export const getSystemResource = () =>
  requestV1.get<never, SystemMonitorAllResponse>('/sys_monitor/system_resource')

// API_REFERENCE.md §11 - GET /sys_monitor/{instance_id}/system_resource
export const getInstanceSystemResource = (instanceId: string) =>
  requestV1.get<never, SystemMonitorAllResponse>(`/sys_monitor/${instanceId}/system_resource`)

// API_REFERENCE.md §11 - GET /sys_monitor/nic_state
export const getNicState = () =>
  requestV1.get<never, Record<string, unknown>>('/sys_monitor/nic_state')

// API_REFERENCE.md §11 - GET /sys_monitor/history/manager
export const getInstancemHistory = (params: SystemResourceHistoryParams) =>
  requestV1.get<never, unknown>('/sys_monitor/history/manager', { params })

// API_REFERENCE.md §11 - GET /sys_monitor/history/instance/{instance_id}
export const getInstanceHistory = (instanceId: string, params: SystemResourceHistoryParams) =>
  requestV1.get<never, unknown>(`/sys_monitor/history/instance/${instanceId}`, { params })

// API_REFERENCE.md §11 - GET /sys_monitor/interface
export const getNetworkInterface = () => requestV1.get<never, unknown>('/sys_monitor/interface')

// API_REFERENCE.md §11 - GET /sys_monitor/network_flow
export const getNetworkFlow = () => requestV1.get<never, unknown>('/sys_monitor/network_flow')

// === 攻击监控 ===

// API_REFERENCE.md §12 - GET /statistic_trend/top_sites_info
export const getTopSites = () =>
  requestV1.get<never, Array<[string, number]>>('/statistic_trend/top_sites_info')

// API_REFERENCE.md §12 - GET /monitor/attack/src-ips-top
export const getAttackSourceTop = () =>
  requestV1.get<never, AttackSourceTop[]>('/monitor/attack/src-ips-top')

// API_REFERENCE.md §12 - GET /monitor/attack/severity
export const getAttackSeverity = () =>
  requestV1.get<never, AttackSeverity>('/monitor/attack/severity')

// API_REFERENCE.md §4 - GET /attack_stats/statistic_info
export const getAttackStats = () =>
  requestV1.get<never, AttackStatsResponse>('/attack_stats/statistic_info')

// API_REFERENCE.md §4 - GET /attack_logs
export const getAttackLogs = (params?: Record<string, unknown>) =>
  requestV1.get<never, unknown>('/attack_logs', { params })

// API_REFERENCE.md §4 - GET /attack_logs_num
export const getAttackLogsCount = () => requestV1.get<never, { count: number }>('/attack_logs_num')

// === 站点统计 (attacks_monitor 用) ===

// API_REFERENCE.md §1.1 - GET /site_stats
export const getSiteStats = () => requestV1.get<never, SiteStats>('/site_stats')

// === 系统设置 ===

// API_REFERENCE.md §10 - GET /system/running_mode
export const getRunningMode = () => requestV1.get<never, RunningMode>('/system/running_mode')

// API_REFERENCE.md §10 - GET /system/managertime
export const getInstancemTime = () => requestV1.get<never, string>('/system/managertime')

// API_REFERENCE.md §10 - GET /system/alltime
export const getAllTime = () => requestV1.get<never, Record<string, string>>('/system/alltime')

// API_REFERENCE.md §10 - PUT /system/changetime
export const changeInstancemTime = (time: string) => requestV1.put('/system/changetime', { time })

// API_REFERENCE.md §10 - PUT /system/{instance_id}/changetime
export const changeInstanceTime = (instanceId: string, time: string) =>
  requestV1.put(`/system/${instanceId}/changetime`, { time })

// === 实例 列表 ===

// API_REFERENCE.md §2 - GET /instances
export const getInstances = () =>
  requestV1.get<never, { instances: Array<{ id: string; name: string }> }>('/instances')

// === 流量监控 ===

// API_REFERENCE.md §12 - GET /monitor/flow/top10app
export const getFlowTop10App = (params?: Record<string, string>) =>
  requestV1.get<never, FlowTop10Item[]>('/monitor/flow/top10app', { params })

// API_REFERENCE.md §12 - GET /monitor/flow/top10ip
export const getFlowTop10Ip = (params?: Record<string, string>) =>
  requestV1.get<never, FlowTop10Item[]>('/monitor/flow/top10ip', { params })

// API_REFERENCE.md §12 - GET /monitor/flow/top10app/{app}
export const getFlowAppDetail = (app: string) =>
  requestV1.get<never, unknown>(`/monitor/flow/top10app/${app}`)

// API_REFERENCE.md §12 - GET /monitor/flow/top10ip/{ip}
export const getFlowIpDetail = (ip: string) =>
  requestV1.get<never, unknown>(`/monitor/flow/top10ip/${ip}`)

// === 通用监控指标 ===

// API_REFERENCE.md §12 - GET /monitor/realtime
export const getRealtimeMetric = (params?: MonitorMetricParams) =>
  requestV1.get<never, unknown>('/monitor/realtime', { params })

// API_REFERENCE.md §12 - GET /monitor/history
export const getHistoryMetric = (params?: MonitorMetricParams) =>
  requestV1.get<never, unknown>('/monitor/history', { params })

// API_REFERENCE.md §12 - GET /monitor/metricspec
export const getMetricSpec = () => requestV1.get<never, unknown>('/monitor/metricspec')

// API_REFERENCE.md §15 - GET /service-statistics
export const getServiceStatistics = () => requestV1.get<never, unknown>('/service-statistics')
