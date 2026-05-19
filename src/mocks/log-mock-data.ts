// 日志中心模块 mock 数据
// 供 log-handlers.ts 使用
import type {
  AttackLog,
  AttackQueryCriteria,
  AttackLogBackupTiming,
  FlowLog,
  FlowQueryOperation,
  AntiVirusLog,
  AntiTamperLog,
  OperationLog,
} from '../api/types/log'

export const genId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

const ts = (minAgo: number) => new Date(Date.now() - minAgo * 60_000).toISOString()

// === §4 攻击日志 ===

const severities: AttackLog['severity'][] = ['low', 'medium', 'high', 'critical']
const actions = ['block', 'alert', 'pass', 'drop']
const categories = [
  'sql_injection',
  'xss',
  'command_injection',
  'path_traversal',
  'file_upload',
  'csrf',
  'ssrf',
]
const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

export let attackLogs: AttackLog[] = Array.from({ length: 18 }, (_, i) => ({
  id: `atk-${String(i + 1).padStart(3, '0')}`,
  datetime: ts(i * 12),
  src_ip: `203.0.113.${10 + i}`,
  dst_ip: '192.168.1.100',
  host: i % 3 === 0 ? 'www.example.com' : i % 3 === 1 ? 'api.example.com' : 'admin.example.com',
  url: [
    `/admin/login`,
    `/api/users?id=1' OR 1=1`,
    `/upload/shell.php`,
    `/search?q=<script>`,
    `/../../etc/passwd`,
    `/api/internal/config`,
  ][i % 6],
  action: actions[i % 4],
  severity: severities[i % 4],
  rule_id: `rule-${100 + i}`,
  rule_name: [
    `SQL注入检测规则`,
    `XSS过滤规则`,
    `命令注入防护`,
    `路径遍历拦截`,
    `文件上传检测`,
    `CSRF令牌校验`,
  ][i % 6],
  category: categories[i % 7],
  method: methods[i % 5],
  protocol: i % 3 === 0 ? 'HTTPS' : 'HTTP',
  src_port: 40000 + i * 111,
  dst_port: i % 2 === 0 ? 443 : 80,
  src_geo: ['北京', '上海', '纽约', '伦敦', '东京', '莫斯科'][i % 6],
  dst_geo: '上海',
}))

export let attackQueryCriteria: AttackQueryCriteria[] = [
  { id: 'aqc-001', name: '高危攻击查询', conditions: { severity: 'critical', action: 'block' } },
  { id: 'aqc-002', name: 'SQL注入专项', conditions: { category: 'sql_injection' } },
  { id: 'aqc-003', name: '近24小时告警', conditions: { time_range: '24h', action: 'alert' } },
]

export let attackLogBackupTiming: AttackLogBackupTiming = {
  enabled: true,
  schedule: '0 2 * * *',
  backup_path: '/data/backup/attack_logs',
  retention_days: 90,
}

// === §5 流量日志 ===

const appNames = ['HTTP', 'HTTPS', 'DNS', 'SSH', 'FTP', 'SMTP', 'MySQL', 'Redis']

export let flowLogs: FlowLog[] = Array.from({ length: 10 }, (_, i) => ({
  id: `flow-${String(i + 1).padStart(3, '0')}`,
  datetime: ts(i * 8),
  src_ip: `10.0.${i % 3}.${20 + i}`,
  dst_ip: `172.16.1.${10 + i}`,
  protocol: i % 2 === 0 ? 'TCP' : 'UDP',
  app_name: appNames[i % 8],
  bytes_in: (i + 1) * 102400,
  bytes_out: (i + 1) * 51200,
  duration: (i + 1) * 15,
}))

export let flowQueryOperations: FlowQueryOperation[] = [
  { id: 'fqo-001', name: '大流量会话', conditions: { min_bytes: 1048576 } },
  { id: 'fqo-002', name: 'SSH连接查询', conditions: { app_name: 'SSH' } },
]

// === §6 防病毒日志 ===

export let antiVirusLogs: AntiVirusLog[] = [
  {
    id: 'av-001',
    datetime: ts(30),
    site_name: '企业门户网站',
    file_name: 'malware.exe',
    virus_name: 'Trojan.GenericKD.46542',
    action: 'block',
    src_ip: '203.0.113.55',
  },
  {
    id: 'av-002',
    datetime: ts(120),
    site_name: 'API服务网关',
    file_name: 'backdoor.php',
    virus_name: 'PHP.Webshell.Agent',
    action: 'block',
    src_ip: '198.51.100.33',
  },
  {
    id: 'av-003',
    datetime: ts(360),
    site_name: '企业门户网站',
    file_name: 'ransomware.js',
    virus_name: 'JS.Ransom.Crypto',
    action: 'block',
    src_ip: '192.0.2.77',
  },
  {
    id: 'av-004',
    datetime: ts(720),
    site_name: '后台管理系统',
    file_name: 'keylogger.dll',
    virus_name: 'Win32.Keylogger.BX',
    action: 'alert',
    src_ip: '203.0.113.88',
  },
  {
    id: 'av-005',
    datetime: ts(1440),
    site_name: '企业门户网站',
    file_name: 'exploit.pdf',
    virus_name: 'PDF.Exploit.CVE2024',
    action: 'block',
    src_ip: '100.64.0.12',
  },
]

// === §7 防篡改日志 ===

export let antiTamperLogs: AntiTamperLog[] = [
  {
    id: 'at-001',
    datetime: ts(45),
    site_name: '企业门户网站',
    url: '/index.html',
    file_name: 'index.html',
    action: 'block',
    status: 'pending',
  },
  {
    id: 'at-002',
    datetime: ts(180),
    site_name: '后台管理系统',
    url: '/admin/dashboard',
    file_name: 'dashboard.html',
    action: 'block',
    status: 'confirmed',
  },
  {
    id: 'at-003',
    datetime: ts(600),
    site_name: '企业门户网站',
    url: '/about.html',
    file_name: 'about.html',
    action: 'alert',
    status: 'rejected',
  },
]

// === §8 操作日志 ===

const operations = [
  '创建站点',
  '修改策略',
  '删除规则',
  '启用防护',
  '停用站点',
  '导出日志',
  '修改密码',
  '添加用户',
  '更新证书',
  '重启服务',
]
const resources = [
  '站点管理',
  '策略配置',
  '规则引擎',
  '防护设置',
  '系统管理',
  '日志中心',
  '用户管理',
  '证书管理',
  '服务管理',
  '监控中心',
]

export let operationLogs: OperationLog[] = Array.from({ length: 20 }, (_, i) => ({
  id: `op-${String(i + 1).padStart(3, '0')}`,
  datetime: ts(i * 30),
  user_name: i % 3 === 0 ? 'admin' : i % 3 === 1 ? 'security' : 'auditor',
  operation: operations[i % 10],
  resource: resources[i % 10],
  result: i % 7 === 0 ? ('failure' as const) : ('success' as const),
  detail: i % 7 === 0 ? '权限不足，操作被拒绝' : `${operations[i % 10]}操作执行成功`,
}))

// === 不可变更新辅助 ===

export const updateAttackLogs = (next: AttackLog[]) => {
  attackLogs = next
}
export const updateAttackQueryCriteria = (next: AttackQueryCriteria[]) => {
  attackQueryCriteria = next
}
export const updateAttackLogBackupTiming = (next: AttackLogBackupTiming) => {
  attackLogBackupTiming = next
}
export const updateFlowLogs = (next: FlowLog[]) => {
  flowLogs = next
}
export const updateFlowQueryOperations = (next: FlowQueryOperation[]) => {
  flowQueryOperations = next
}
export const updateAntiVirusLogs = (next: AntiVirusLog[]) => {
  antiVirusLogs = next
}
export const updateAntiTamperLogs = (next: AntiTamperLog[]) => {
  antiTamperLogs = next
}
export const updateOperationLogs = (next: OperationLog[]) => {
  operationLogs = next
}
