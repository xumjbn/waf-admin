// 系统管理模块 API
// 对应 API_REFERENCE.md §10, §15
import { requestV1 } from './request'
import type {
  SystemTime,
  FailoverSetting,
  RunningMode,
  SessionTimeout,
  PasswordChangeCycle,
  MailSetting,
  SyslogSetting,
  DnsSetting,
  SnmpSetting,
  JvmSetting,
  License,
  PasswordLengthConfig,
  AttemptLimitConfig,
  AuthHostConfig,
  AuthHost,
  MonitorWarning,
  AttackLogBackupTiming,
  UpgradeInfo,
  UpgradePackage,
  UpgradeAction,
  InstancePool,
  ServiceWarning,
} from './types/system'

// === §10 系统管理 ===

// API_REFERENCE.md §10 - GET /system/dumpcfg
export const getDumpConfig = () => requestV1.get<never, unknown>('/system/dumpcfg')

// API_REFERENCE.md §10 - POST /system/dumpcfg
export const createDumpConfig = (data: Record<string, unknown>) =>
  requestV1.post<never, unknown>('/system/dumpcfg', data)

// API_REFERENCE.md §10 - GET /system/managertime
export const getInstancemTime = () => requestV1.get<never, SystemTime>('/system/managertime')

// API_REFERENCE.md §10 - PUT /system/changetime
export const changeTime = (data: SystemTime) =>
  requestV1.put<never, SystemTime>('/system/changetime', data)

// API_REFERENCE.md §10 - GET /system/configuration
export const getConfiguration = () =>
  requestV1.get<never, Blob>('/system/configuration', { responseType: 'blob' })

// API_REFERENCE.md §10 - POST /system/configuration
export const restoreConfiguration = (data: FormData) =>
  requestV1.post<never, unknown>('/system/configuration', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// API_REFERENCE.md §10 - POST /system/reset
export const resetSystem = () => requestV1.post<never, unknown>('/system/reset')

// API_REFERENCE.md §10 - POST /system/reboot
export const rebootSystem = () => requestV1.post<never, unknown>('/system/reboot')

// API_REFERENCE.md §10 - POST /system/poweroff
export const poweroffSystem = () => requestV1.post<never, unknown>('/system/poweroff')

// API_REFERENCE.md §10 - GET /system/systemlog_export
export const exportSystemLog = () =>
  requestV1.get<never, Blob>('/system/systemlog_export', { responseType: 'blob' })

// API_REFERENCE.md §10 - GET /system/failoversetting
export const getFailoverSetting = () =>
  requestV1.get<never, FailoverSetting>('/system/failoversetting')

// API_REFERENCE.md §10 - PUT /system/failoversetting
export const updateFailoverSetting = (data: FailoverSetting) =>
  requestV1.put<never, FailoverSetting>('/system/failoversetting', data)

// API_REFERENCE.md §10 - GET /system/running_mode
export const getRunningMode = () => requestV1.get<never, RunningMode>('/system/running_mode')

// API_REFERENCE.md §10 - PUT /system/running_mode
export const updateRunningMode = (data: RunningMode) =>
  requestV1.put<never, RunningMode>('/system/running_mode', data)

// API_REFERENCE.md §10 - GET /system/session_timeout
export const getSessionTimeout = () =>
  requestV1.get<never, SessionTimeout>('/system/session_timeout')

// API_REFERENCE.md §10 - PUT /system/session_timeout
export const updateSessionTimeout = (data: SessionTimeout) =>
  requestV1.put<never, SessionTimeout>('/system/session_timeout', data)

// API_REFERENCE.md §10 - GET /system/pswd_change_cycle
export const getPasswordChangeCycle = () =>
  requestV1.get<never, PasswordChangeCycle>('/system/pswd_change_cycle')

// API_REFERENCE.md §10 - PUT /system/pswd_change_cycle
export const updatePasswordChangeCycle = (data: PasswordChangeCycle) =>
  requestV1.put<never, PasswordChangeCycle>('/system/pswd_change_cycle', data)

// API_REFERENCE.md §10 - GET /system/mail_setting
export const getMailSetting = () => requestV1.get<never, MailSetting>('/system/mail_setting')

// API_REFERENCE.md §10 - PUT /system/mail_setting
export const updateMailSetting = (data: MailSetting) =>
  requestV1.put<never, MailSetting>('/system/mail_setting', data)

// API_REFERENCE.md §10 - GET /system/syslog_setting
export const getSyslogSetting = () => requestV1.get<never, SyslogSetting>('/system/syslog_setting')

// API_REFERENCE.md §10 - PUT /system/syslog_setting
export const updateSyslogSetting = (data: SyslogSetting) =>
  requestV1.put<never, SyslogSetting>('/system/syslog_setting', data)

// API_REFERENCE.md §10 - GET /system/dns_setting
export const getDnsSetting = () => requestV1.get<never, DnsSetting>('/system/dns_setting')

// API_REFERENCE.md §10 - PUT /system/dns_setting
export const updateDnsSetting = (data: DnsSetting) =>
  requestV1.put<never, DnsSetting>('/system/dns_setting', data)

// API_REFERENCE.md §10 - GET /system/snmp
export const getSnmpSetting = () => requestV1.get<never, SnmpSetting>('/system/snmp')

// API_REFERENCE.md §10 - PUT /system/snmp
export const updateSnmpSetting = (data: SnmpSetting) =>
  requestV1.put<never, SnmpSetting>('/system/snmp', data)

// API_REFERENCE.md §10 - GET /system/jvm-setting
export const getJvmSetting = () => requestV1.get<never, JvmSetting>('/system/jvm-setting')

// API_REFERENCE.md §10 - PUT /system/jvm-setting
export const updateJvmSetting = (data: JvmSetting) =>
  requestV1.put<never, JvmSetting>('/system/jvm-setting', data)

// === §15 许可证 ===

// API_REFERENCE.md §15 - GET /licenses
export const listLicenses = () => requestV1.get<never, { licenses: License[] }>('/licenses')

// API_REFERENCE.md §15 - GET /licenses/{id}
export const getLicense = (id: string) =>
  requestV1.get<never, { license: License }>(`/licenses/${id}`)

// API_REFERENCE.md §15 - POST /licenses
export const createLicense = (data: Omit<License, 'id'>) =>
  requestV1.post<never, { license: License }>('/licenses', data)

// API_REFERENCE.md §15 - PUT /licenses/{id}
export const updateLicense = (id: string, data: Partial<License>) =>
  requestV1.put<never, { license: License }>(`/licenses/${id}`, data)

// API_REFERENCE.md §15 - DELETE /licenses/{id}
export const deleteLicense = (id: string) => requestV1.delete(`/licenses/${id}`)

// === §15 安全管理 ===

// API_REFERENCE.md §15 - GET /security_management/pw_length_cfg
export const getPasswordLengthConfig = () =>
  requestV1.get<never, PasswordLengthConfig>('/security_management/pw_length_cfg')

// API_REFERENCE.md §15 - PUT /security_management/pw_length_cfg
export const updatePasswordLengthConfig = (data: PasswordLengthConfig) =>
  requestV1.put<never, PasswordLengthConfig>('/security_management/pw_length_cfg', data)

// API_REFERENCE.md §15 - GET /security_management/attempt_limit_cfg
export const getAttemptLimitConfig = () =>
  requestV1.get<never, AttemptLimitConfig>('/security_management/attempt_limit_cfg')

// API_REFERENCE.md §15 - PUT /security_management/attempt_limit_cfg
export const updateAttemptLimitConfig = (data: AttemptLimitConfig) =>
  requestV1.put<never, AttemptLimitConfig>('/security_management/attempt_limit_cfg', data)

// API_REFERENCE.md §15 - GET /security_management/auth_host_cfg
export const getAuthHostConfig = () =>
  requestV1.get<never, AuthHostConfig>('/security_management/auth_host_cfg')

// API_REFERENCE.md §15 - PUT /security_management/auth_host_cfg
export const updateAuthHostConfig = (data: AuthHostConfig) =>
  requestV1.put<never, AuthHostConfig>('/security_management/auth_host_cfg', data)

// API_REFERENCE.md §15 - GET /security_management/auth_hosts
export const listAuthHosts = () =>
  requestV1.get<never, { auth_hosts: AuthHost[] }>('/security_management/auth_hosts')

// API_REFERENCE.md §15 - GET /security_management/auth_hosts/{id}
export const getAuthHost = (id: string) =>
  requestV1.get<never, { auth_host: AuthHost }>(`/security_management/auth_hosts/${id}`)

// API_REFERENCE.md §15 - POST /security_management/auth_hosts
export const createAuthHost = (data: Omit<AuthHost, 'id'>) =>
  requestV1.post<never, { auth_host: AuthHost }>('/security_management/auth_hosts', data)

// API_REFERENCE.md §15 - PUT /security_management/auth_hosts/{id}
export const updateAuthHost = (id: string, data: Partial<AuthHost>) =>
  requestV1.put<never, { auth_host: AuthHost }>(`/security_management/auth_hosts/${id}`, data)

// API_REFERENCE.md §15 - DELETE /security_management/auth_hosts/{id}
export const deleteAuthHost = (id: string) =>
  requestV1.delete(`/security_management/auth_hosts/${id}`)

// === §15 监控告警 ===

// API_REFERENCE.md §15 - GET /monitor_warning/instance
export const listInstanceWarnings = () =>
  requestV1.get<never, { warnings: MonitorWarning[] }>('/monitor_warning/instance')

// API_REFERENCE.md §15 - GET /monitor_warning/instance/{id}
export const getInstanceWarning = (id: string) =>
  requestV1.get<never, { warning: MonitorWarning }>(`/monitor_warning/instance/${id}`)

// API_REFERENCE.md §15 - POST /monitor_warning/instance
export const createInstanceWarning = (data: Omit<MonitorWarning, 'id'>) =>
  requestV1.post<never, { warning: MonitorWarning }>('/monitor_warning/instance', data)

// API_REFERENCE.md §15 - PUT /monitor_warning/instance/{id}
export const updateInstanceWarning = (id: string, data: Partial<MonitorWarning>) =>
  requestV1.put<never, { warning: MonitorWarning }>(`/monitor_warning/instance/${id}`, data)

// API_REFERENCE.md §15 - DELETE /monitor_warning/instance/{id}
export const deleteInstanceWarning = (id: string) => requestV1.delete(`/monitor_warning/instance/${id}`)

// API_REFERENCE.md §15 - GET /monitor_warning/manager
export const listInstancemWarnings = () =>
  requestV1.get<never, { warnings: MonitorWarning[] }>('/monitor_warning/manager')

// API_REFERENCE.md §15 - GET /monitor_warning/manager/{id}
export const getInstancemWarning = (id: string) =>
  requestV1.get<never, { warning: MonitorWarning }>(`/monitor_warning/manager/${id}`)

// API_REFERENCE.md §15 - POST /monitor_warning/manager
export const createInstancemWarning = (data: Omit<MonitorWarning, 'id'>) =>
  requestV1.post<never, { warning: MonitorWarning }>('/monitor_warning/manager', data)

// API_REFERENCE.md §15 - PUT /monitor_warning/manager/{id}
export const updateInstancemWarning = (id: string, data: Partial<MonitorWarning>) =>
  requestV1.put<never, { warning: MonitorWarning }>(`/monitor_warning/manager/${id}`, data)

// API_REFERENCE.md §15 - DELETE /monitor_warning/manager/{id}
export const deleteInstancemWarning = (id: string) => requestV1.delete(`/monitor_warning/manager/${id}`)

// === §15 数据维护 ===

// API_REFERENCE.md §15 - GET /data_maintenance/attack_log_backup_timing
export const getAttackLogBackupTiming = () =>
  requestV1.get<never, AttackLogBackupTiming>('/data_maintenance/attack_log_backup_timing')

// API_REFERENCE.md §15 - PUT /data_maintenance/attack_log_backup_timing
export const updateAttackLogBackupTiming = (data: AttackLogBackupTiming) =>
  requestV1.put<never, AttackLogBackupTiming>('/data_maintenance/attack_log_backup_timing', data)

// === 系统升级 — 对应 manager system/upgrade ===

// GET /system/upgrade  返回升级总览(运行模式、当前版本、可升级节点、已上传升级包)
export const getUpgradeInfo = () => requestV1.get<never, UpgradeInfo>('/system/upgrade')

// POST /system/upgrade/upload  上传升级包(multipart)
export const uploadUpgradePackage = (data: FormData) =>
  requestV1.post<never, UpgradePackage>('/system/upgrade/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// DELETE /system/upgrade/packages/{id}
export const deleteUpgradePackage = (id: string) =>
  requestV1.delete(`/system/upgrade/packages/${id}`)

// POST /system/upgrade/manager  管理节点 升级
export const upgradeInstancem = (data: UpgradeAction) =>
  requestV1.post<never, unknown>('/system/upgrade/manager', data)

// POST /system/upgrade/manager/rollback  管理节点 回滚
export const rollbackInstancem = () => requestV1.post<never, unknown>('/system/upgrade/manager/rollback')

// POST /system/upgrade/instance  实例 升级(可批量)
export const upgradeInstance = (data: UpgradeAction) =>
  requestV1.post<never, unknown>('/system/upgrade/instance', data)

// POST /system/upgrade/instance/rollback
export const rollbackInstance = (data: { node_ids: string[] }) =>
  requestV1.post<never, unknown>('/system/upgrade/instance/rollback', data)

// === 资源池配置 ===

// GET /instance_pools
export const listInstancePools = () => requestV1.get<never, { pools: InstancePool[] }>('/instance_pools')

// POST /instance_pools
export const createInstancePool = (data: Omit<InstancePool, 'id' | 'used'>) =>
  requestV1.post<never, InstancePool>('/instance_pools', data)

// PUT /instance_pools/{id}
export const updateInstancePool = (id: string, data: Partial<InstancePool>) =>
  requestV1.put<never, InstancePool>(`/instance_pools/${id}`, data)

// DELETE /instance_pools/{id}
export const deleteInstancePool = (id: string) => requestV1.delete(`/instance_pools/${id}`)

// === 业务告警 ===

// GET /service_warnings
export const listServiceWarnings = () =>
  requestV1.get<never, { warnings: ServiceWarning[] }>('/service_warnings')

// POST /service_warnings
export const createServiceWarning = (data: Omit<ServiceWarning, 'id'>) =>
  requestV1.post<never, ServiceWarning>('/service_warnings', data)

// PUT /service_warnings/{id}
export const updateServiceWarning = (id: string, data: Partial<ServiceWarning>) =>
  requestV1.put<never, ServiceWarning>(`/service_warnings/${id}`, data)

// DELETE /service_warnings/{id}
export const deleteServiceWarning = (id: string) => requestV1.delete(`/service_warnings/${id}`)
