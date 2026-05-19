import { describe, it, expect, vi, beforeEach } from 'vitest'

// 对照 API_REFERENCE.md §10, §15
vi.mock('../request', () => ({
  requestV1: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}))

import * as api from '../system'
import { requestV1 } from '../request'

const mockGet = requestV1.get as ReturnType<typeof vi.fn>
const mockPost = requestV1.post as ReturnType<typeof vi.fn>
const mockPut = requestV1.put as ReturnType<typeof vi.fn>
const mockDelete = requestV1.delete as ReturnType<typeof vi.fn>

describe('system API - 对照 API_REFERENCE.md', () => {
  beforeEach(() => vi.clearAllMocks())

  // §10 系统管理
  it('getDumpConfig → GET /system/dumpcfg', async () => {
    await api.getDumpConfig()
    expect(mockGet).toHaveBeenCalledWith('/system/dumpcfg')
  })

  it('createDumpConfig → POST /system/dumpcfg', async () => {
    const data = { config: 'test' }
    await api.createDumpConfig(data)
    expect(mockPost).toHaveBeenCalledWith('/system/dumpcfg', data)
  })

  it('getInstancemTime → GET /system/managertime', async () => {
    await api.getInstancemTime()
    expect(mockGet).toHaveBeenCalledWith('/system/managertime')
  })

  it('changeTime → PUT /system/changetime', async () => {
    const data = { time: '2024-01-01' } as Parameters<typeof api.changeTime>[0]
    await api.changeTime(data)
    expect(mockPut).toHaveBeenCalledWith('/system/changetime', data)
  })

  it('getConfiguration → GET /system/configuration', async () => {
    await api.getConfiguration()
    expect(mockGet).toHaveBeenCalledWith('/system/configuration', { responseType: 'blob' })
  })

  it('restoreConfiguration → POST /system/configuration', async () => {
    const data = new FormData()
    await api.restoreConfiguration(data)
    expect(mockPost).toHaveBeenCalledWith('/system/configuration', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  })

  it('resetSystem → POST /system/reset', async () => {
    await api.resetSystem()
    expect(mockPost).toHaveBeenCalledWith('/system/reset')
  })

  it('rebootSystem → POST /system/reboot', async () => {
    await api.rebootSystem()
    expect(mockPost).toHaveBeenCalledWith('/system/reboot')
  })

  it('poweroffSystem → POST /system/poweroff', async () => {
    await api.poweroffSystem()
    expect(mockPost).toHaveBeenCalledWith('/system/poweroff')
  })

  it('exportSystemLog → GET /system/systemlog_export', async () => {
    await api.exportSystemLog()
    expect(mockGet).toHaveBeenCalledWith('/system/systemlog_export', { responseType: 'blob' })
  })

  it('getFailoverSetting → GET /system/failoversetting', async () => {
    await api.getFailoverSetting()
    expect(mockGet).toHaveBeenCalledWith('/system/failoversetting')
  })

  it('updateFailoverSetting → PUT /system/failoversetting', async () => {
    const data = { enabled: true } as Parameters<typeof api.updateFailoverSetting>[0]
    await api.updateFailoverSetting(data)
    expect(mockPut).toHaveBeenCalledWith('/system/failoversetting', data)
  })

  it('getRunningMode → GET /system/running_mode', async () => {
    await api.getRunningMode()
    expect(mockGet).toHaveBeenCalledWith('/system/running_mode')
  })

  it('updateRunningMode → PUT /system/running_mode', async () => {
    const data = { mode: 'production' } as Parameters<typeof api.updateRunningMode>[0]
    await api.updateRunningMode(data)
    expect(mockPut).toHaveBeenCalledWith('/system/running_mode', data)
  })

  it('getSessionTimeout → GET /system/session_timeout', async () => {
    await api.getSessionTimeout()
    expect(mockGet).toHaveBeenCalledWith('/system/session_timeout')
  })

  it('updateSessionTimeout → PUT /system/session_timeout', async () => {
    const data = { timeout: 3600 } as Parameters<typeof api.updateSessionTimeout>[0]
    await api.updateSessionTimeout(data)
    expect(mockPut).toHaveBeenCalledWith('/system/session_timeout', data)
  })

  it('getPasswordChangeCycle → GET /system/pswd_change_cycle', async () => {
    await api.getPasswordChangeCycle()
    expect(mockGet).toHaveBeenCalledWith('/system/pswd_change_cycle')
  })

  it('updatePasswordChangeCycle → PUT /system/pswd_change_cycle', async () => {
    const data = { cycle: 90 } as Parameters<typeof api.updatePasswordChangeCycle>[0]
    await api.updatePasswordChangeCycle(data)
    expect(mockPut).toHaveBeenCalledWith('/system/pswd_change_cycle', data)
  })

  it('getMailSetting → GET /system/mail_setting', async () => {
    await api.getMailSetting()
    expect(mockGet).toHaveBeenCalledWith('/system/mail_setting')
  })

  it('updateMailSetting → PUT /system/mail_setting', async () => {
    const data = { smtp_server: 'smtp.example.com' } as Parameters<typeof api.updateMailSetting>[0]
    await api.updateMailSetting(data)
    expect(mockPut).toHaveBeenCalledWith('/system/mail_setting', data)
  })

  it('getSyslogSetting → GET /system/syslog_setting', async () => {
    await api.getSyslogSetting()
    expect(mockGet).toHaveBeenCalledWith('/system/syslog_setting')
  })

  it('updateSyslogSetting → PUT /system/syslog_setting', async () => {
    const data = { enabled: true } as Parameters<typeof api.updateSyslogSetting>[0]
    await api.updateSyslogSetting(data)
    expect(mockPut).toHaveBeenCalledWith('/system/syslog_setting', data)
  })

  it('getDnsSetting → GET /system/dns_setting', async () => {
    await api.getDnsSetting()
    expect(mockGet).toHaveBeenCalledWith('/system/dns_setting')
  })

  it('updateDnsSetting → PUT /system/dns_setting', async () => {
    const data = { primary_dns: '8.8.8.8' } as Parameters<typeof api.updateDnsSetting>[0]
    await api.updateDnsSetting(data)
    expect(mockPut).toHaveBeenCalledWith('/system/dns_setting', data)
  })

  it('getSnmpSetting → GET /system/snmp', async () => {
    await api.getSnmpSetting()
    expect(mockGet).toHaveBeenCalledWith('/system/snmp')
  })

  it('updateSnmpSetting → PUT /system/snmp', async () => {
    const data = { enabled: true } as Parameters<typeof api.updateSnmpSetting>[0]
    await api.updateSnmpSetting(data)
    expect(mockPut).toHaveBeenCalledWith('/system/snmp', data)
  })

  it('getJvmSetting → GET /system/jvm-setting', async () => {
    await api.getJvmSetting()
    expect(mockGet).toHaveBeenCalledWith('/system/jvm-setting')
  })

  it('updateJvmSetting → PUT /system/jvm-setting', async () => {
    const data = { heap_size: '2g' } as Parameters<typeof api.updateJvmSetting>[0]
    await api.updateJvmSetting(data)
    expect(mockPut).toHaveBeenCalledWith('/system/jvm-setting', data)
  })

  // §15 许可证
  it('listLicenses → GET /licenses', async () => {
    await api.listLicenses()
    expect(mockGet).toHaveBeenCalledWith('/licenses')
  })

  it('getLicense → GET /licenses/{id}', async () => {
    await api.getLicense('l1')
    expect(mockGet).toHaveBeenCalledWith('/licenses/l1')
  })

  it('createLicense → POST /licenses', async () => {
    const data = { name: 'license' } as Parameters<typeof api.createLicense>[0]
    await api.createLicense(data)
    expect(mockPost).toHaveBeenCalledWith('/licenses', data)
  })

  it('updateLicense → PUT /licenses/{id}', async () => {
    await api.updateLicense('l1', { name: 'updated' })
    expect(mockPut).toHaveBeenCalledWith('/licenses/l1', { name: 'updated' })
  })

  it('deleteLicense → DELETE /licenses/{id}', async () => {
    await api.deleteLicense('l1')
    expect(mockDelete).toHaveBeenCalledWith('/licenses/l1')
  })

  // §15 安全管理
  it('getPasswordLengthConfig → GET /security_management/pw_length_cfg', async () => {
    await api.getPasswordLengthConfig()
    expect(mockGet).toHaveBeenCalledWith('/security_management/pw_length_cfg')
  })

  it('updatePasswordLengthConfig → PUT /security_management/pw_length_cfg', async () => {
    const data = { min_length: 8 } as Parameters<typeof api.updatePasswordLengthConfig>[0]
    await api.updatePasswordLengthConfig(data)
    expect(mockPut).toHaveBeenCalledWith('/security_management/pw_length_cfg', data)
  })

  it('getAttemptLimitConfig → GET /security_management/attempt_limit_cfg', async () => {
    await api.getAttemptLimitConfig()
    expect(mockGet).toHaveBeenCalledWith('/security_management/attempt_limit_cfg')
  })

  it('updateAttemptLimitConfig → PUT /security_management/attempt_limit_cfg', async () => {
    const data = { max_attempts: 5 } as Parameters<typeof api.updateAttemptLimitConfig>[0]
    await api.updateAttemptLimitConfig(data)
    expect(mockPut).toHaveBeenCalledWith('/security_management/attempt_limit_cfg', data)
  })

  it('getAuthHostConfig → GET /security_management/auth_host_cfg', async () => {
    await api.getAuthHostConfig()
    expect(mockGet).toHaveBeenCalledWith('/security_management/auth_host_cfg')
  })

  it('updateAuthHostConfig → PUT /security_management/auth_host_cfg', async () => {
    const data = { enabled: true } as Parameters<typeof api.updateAuthHostConfig>[0]
    await api.updateAuthHostConfig(data)
    expect(mockPut).toHaveBeenCalledWith('/security_management/auth_host_cfg', data)
  })

  it('listAuthHosts → GET /security_management/auth_hosts', async () => {
    await api.listAuthHosts()
    expect(mockGet).toHaveBeenCalledWith('/security_management/auth_hosts')
  })

  it('getAuthHost → GET /security_management/auth_hosts/{id}', async () => {
    await api.getAuthHost('h1')
    expect(mockGet).toHaveBeenCalledWith('/security_management/auth_hosts/h1')
  })

  it('createAuthHost → POST /security_management/auth_hosts', async () => {
    const data = { ip: '192.168.1.1' } as Parameters<typeof api.createAuthHost>[0]
    await api.createAuthHost(data)
    expect(mockPost).toHaveBeenCalledWith('/security_management/auth_hosts', data)
  })

  it('updateAuthHost → PUT /security_management/auth_hosts/{id}', async () => {
    await api.updateAuthHost('h1', { ip: '192.168.1.2' })
    expect(mockPut).toHaveBeenCalledWith('/security_management/auth_hosts/h1', {
      ip: '192.168.1.2',
    })
  })

  it('deleteAuthHost → DELETE /security_management/auth_hosts/{id}', async () => {
    await api.deleteAuthHost('h1')
    expect(mockDelete).toHaveBeenCalledWith('/security_management/auth_hosts/h1')
  })

  // §15 监控告警 - 实例
  it('listInstanceWarnings → GET /monitor_warning/instance', async () => {
    await api.listInstanceWarnings()
    expect(mockGet).toHaveBeenCalledWith('/monitor_warning/instance')
  })

  it('getInstanceWarning → GET /monitor_warning/instance/{id}', async () => {
    await api.getInstanceWarning('w1')
    expect(mockGet).toHaveBeenCalledWith('/monitor_warning/instance/w1')
  })

  it('createInstanceWarning → POST /monitor_warning/instance', async () => {
    const data = { name: 'warning' } as Parameters<typeof api.createInstanceWarning>[0]
    await api.createInstanceWarning(data)
    expect(mockPost).toHaveBeenCalledWith('/monitor_warning/instance', data)
  })

  it('updateInstanceWarning → PUT /monitor_warning/instance/{id}', async () => {
    await api.updateInstanceWarning('w1', { name: 'updated' })
    expect(mockPut).toHaveBeenCalledWith('/monitor_warning/instance/w1', { name: 'updated' })
  })

  it('deleteInstanceWarning → DELETE /monitor_warning/instance/{id}', async () => {
    await api.deleteInstanceWarning('w1')
    expect(mockDelete).toHaveBeenCalledWith('/monitor_warning/instance/w1')
  })

  // §15 监控告警 - 管理节点
  it('listInstancemWarnings → GET /monitor_warning/manager', async () => {
    await api.listInstancemWarnings()
    expect(mockGet).toHaveBeenCalledWith('/monitor_warning/manager')
  })

  it('getInstancemWarning → GET /monitor_warning/manager/{id}', async () => {
    await api.getInstancemWarning('w1')
    expect(mockGet).toHaveBeenCalledWith('/monitor_warning/manager/w1')
  })

  it('createInstancemWarning → POST /monitor_warning/manager', async () => {
    const data = { name: 'warning' } as Parameters<typeof api.createInstancemWarning>[0]
    await api.createInstancemWarning(data)
    expect(mockPost).toHaveBeenCalledWith('/monitor_warning/manager', data)
  })

  it('updateInstancemWarning → PUT /monitor_warning/manager/{id}', async () => {
    await api.updateInstancemWarning('w1', { name: 'updated' })
    expect(mockPut).toHaveBeenCalledWith('/monitor_warning/manager/w1', { name: 'updated' })
  })

  it('deleteInstancemWarning → DELETE /monitor_warning/manager/{id}', async () => {
    await api.deleteInstancemWarning('w1')
    expect(mockDelete).toHaveBeenCalledWith('/monitor_warning/manager/w1')
  })

  // §15 数据维护
  it('getAttackLogBackupTiming → GET /data_maintenance/attack_log_backup_timing', async () => {
    await api.getAttackLogBackupTiming()
    expect(mockGet).toHaveBeenCalledWith('/data_maintenance/attack_log_backup_timing')
  })

  it('updateAttackLogBackupTiming → PUT /data_maintenance/attack_log_backup_timing', async () => {
    const data = { enabled: true } as Parameters<typeof api.updateAttackLogBackupTiming>[0]
    await api.updateAttackLogBackupTiming(data)
    expect(mockPut).toHaveBeenCalledWith('/data_maintenance/attack_log_backup_timing', data)
  })
})
