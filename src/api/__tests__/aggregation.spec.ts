import { describe, it, expect, vi, beforeEach } from 'vitest'

// 对照 API_REFERENCE.md §1.1, §2, §4, §5, §10, §11, §12, §15
vi.mock('../request', () => ({
  requestV1: {
    get: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
  },
}))

import * as api from '../aggregation'
import { requestV1 } from '../request'

const mockGet = requestV1.get as ReturnType<typeof vi.fn>
const mockPut = requestV1.put as ReturnType<typeof vi.fn>

describe('aggregation API - 对照 API_REFERENCE.md', () => {
  beforeEach(() => vi.clearAllMocks())

  // §11 系统监控
  it('getSystemResource → GET /sys_monitor/system_resource', async () => {
    await api.getSystemResource()
    expect(mockGet).toHaveBeenCalledWith('/sys_monitor/system_resource')
  })

  it('getInstanceSystemResource → GET /sys_monitor/{instanceId}/system_resource', async () => {
    await api.getInstanceSystemResource('inst-1')
    expect(mockGet).toHaveBeenCalledWith('/sys_monitor/inst-1/system_resource')
  })

  it('getNicState → GET /sys_monitor/nic_state', async () => {
    await api.getNicState()
    expect(mockGet).toHaveBeenCalledWith('/sys_monitor/nic_state')
  })

  it('getInstancemHistory → GET /sys_monitor/history/manager', async () => {
    const params = { begin_time: '2024-01-01', end_time: '2024-01-02', entries: 'cpu' }
    await api.getInstancemHistory(params)
    expect(mockGet).toHaveBeenCalledWith('/sys_monitor/history/manager', { params })
  })

  it('getInstanceHistory → GET /sys_monitor/history/instance/{instanceId}', async () => {
    const params = { begin_time: '2024-01-01', end_time: '2024-01-02', entries: 'cpu' }
    await api.getInstanceHistory('inst-1', params)
    expect(mockGet).toHaveBeenCalledWith('/sys_monitor/history/instance/inst-1', { params })
  })

  it('getNetworkInterface → GET /sys_monitor/interface', async () => {
    await api.getNetworkInterface()
    expect(mockGet).toHaveBeenCalledWith('/sys_monitor/interface')
  })

  it('getNetworkFlow → GET /sys_monitor/network_flow', async () => {
    await api.getNetworkFlow()
    expect(mockGet).toHaveBeenCalledWith('/sys_monitor/network_flow')
  })

  // §12 攻击监控统计
  it('getTopSites → GET /statistic_trend/top_sites_info', async () => {
    await api.getTopSites()
    expect(mockGet).toHaveBeenCalledWith('/statistic_trend/top_sites_info')
  })

  it('getAttackSourceTop → GET /monitor/attack/src-ips-top', async () => {
    await api.getAttackSourceTop()
    expect(mockGet).toHaveBeenCalledWith('/monitor/attack/src-ips-top')
  })

  it('getAttackSeverity → GET /monitor/attack/severity', async () => {
    await api.getAttackSeverity()
    expect(mockGet).toHaveBeenCalledWith('/monitor/attack/severity')
  })

  // §4 攻击日志
  it('getAttackStats → GET /attack_stats/statistic_info', async () => {
    await api.getAttackStats()
    expect(mockGet).toHaveBeenCalledWith('/attack_stats/statistic_info')
  })

  it('getAttackLogs → GET /attack_logs', async () => {
    await api.getAttackLogs({ page: 1 })
    expect(mockGet).toHaveBeenCalledWith('/attack_logs', { params: { page: 1 } })
  })

  it('getAttackLogsCount → GET /attack_logs_num', async () => {
    await api.getAttackLogsCount()
    expect(mockGet).toHaveBeenCalledWith('/attack_logs_num')
  })

  // §1.1 站点统计
  it('getSiteStats → GET /site_stats', async () => {
    await api.getSiteStats()
    expect(mockGet).toHaveBeenCalledWith('/site_stats')
  })

  // §10 系统设置
  it('getRunningMode → GET /system/running_mode', async () => {
    await api.getRunningMode()
    expect(mockGet).toHaveBeenCalledWith('/system/running_mode')
  })

  it('getInstancemTime → GET /system/managertime', async () => {
    await api.getInstancemTime()
    expect(mockGet).toHaveBeenCalledWith('/system/managertime')
  })

  it('getAllTime → GET /system/alltime', async () => {
    await api.getAllTime()
    expect(mockGet).toHaveBeenCalledWith('/system/alltime')
  })

  it('changeInstancemTime → PUT /system/changetime', async () => {
    await api.changeInstancemTime('2024-01-01 12:00:00')
    expect(mockPut).toHaveBeenCalledWith('/system/changetime', { time: '2024-01-01 12:00:00' })
  })

  it('changeInstanceTime → PUT /system/{instanceId}/changetime', async () => {
    await api.changeInstanceTime('inst-1', '2024-01-01 12:00:00')
    expect(mockPut).toHaveBeenCalledWith('/system/inst-1/changetime', {
      time: '2024-01-01 12:00:00',
    })
  })

  // §2 实例
  it('getInstances → GET /instances', async () => {
    await api.getInstances()
    expect(mockGet).toHaveBeenCalledWith('/instances')
  })

  // §5 流量监控
  it('getFlowTop10App → GET /monitor/flow/top10app', async () => {
    await api.getFlowTop10App({ timeframe: '30m' })
    expect(mockGet).toHaveBeenCalledWith('/monitor/flow/top10app', { params: { timeframe: '30m' } })
  })

  it('getFlowTop10Ip → GET /monitor/flow/top10ip', async () => {
    await api.getFlowTop10Ip()
    expect(mockGet).toHaveBeenCalledWith('/monitor/flow/top10ip', { params: undefined })
  })

  it('getFlowAppDetail → GET /monitor/flow/top10app/{app}', async () => {
    await api.getFlowAppDetail('HTTP')
    expect(mockGet).toHaveBeenCalledWith('/monitor/flow/top10app/HTTP')
  })

  it('getFlowIpDetail → GET /monitor/flow/top10ip/{ip}', async () => {
    await api.getFlowIpDetail('1.2.3.4')
    expect(mockGet).toHaveBeenCalledWith('/monitor/flow/top10ip/1.2.3.4')
  })

  // §12 通用监控指标
  it('getRealtimeMetric → GET /monitor/realtime', async () => {
    await api.getRealtimeMetric({ metric_name: 'cpu' })
    expect(mockGet).toHaveBeenCalledWith('/monitor/realtime', { params: { metric_name: 'cpu' } })
  })

  it('getHistoryMetric → GET /monitor/history', async () => {
    await api.getHistoryMetric({ metric_name: 'cpu' })
    expect(mockGet).toHaveBeenCalledWith('/monitor/history', { params: { metric_name: 'cpu' } })
  })

  it('getMetricSpec → GET /monitor/metricspec', async () => {
    await api.getMetricSpec()
    expect(mockGet).toHaveBeenCalledWith('/monitor/metricspec')
  })

  // §15 服务统计
  it('getServiceStatistics → GET /service-statistics', async () => {
    await api.getServiceStatistics()
    expect(mockGet).toHaveBeenCalledWith('/service-statistics')
  })
})
