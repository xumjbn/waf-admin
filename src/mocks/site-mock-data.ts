// 站点管理模块 mock 数据
// 供 site-handlers.ts 和 site-protect-handlers.ts 共享
import type {
  ProtectSite,
  LbMember,
  InstanceProtectMember,
  AclProtect,
  CcProtect,
  CsrfProtect,
  Accelerator,
  CustomRule,
  AntiTamper,
  ContentInto,
  AntiStealingLink,
} from '../api/types/site'

export const genId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

export let sites: ProtectSite[] = [
  {
    id: 'site-001',
    name: '企业门户网站',
    domains: 'www.example.com',
    domain_match: 'exact',
    policy_id: 'policy-001',
    admin_state_up: true,
    status: 'active',
    forbidden_type: 'block',
    check_request_body: true,
    check_response_body: false,
    front_keepalive: 60,
    front_timeout: 30,
    backend_keepalive: 60,
    backend_timeout: 30,
    log_level: 'info',
    audit_status: true,
    anti_virus: true,
    anti_tamper_alarm: false,
    server_info_hide: true,
    created_at: '2024-01-15T08:00:00Z',
  },
  {
    id: 'site-002',
    name: 'API服务网关',
    domains: 'api.example.com',
    domain_match: 'prefix',
    policy_id: 'policy-002',
    admin_state_up: true,
    status: 'active',
    forbidden_type: 'redirect',
    redirect_url: '/error.html',
    check_request_body: true,
    check_response_body: true,
    front_keepalive: 120,
    front_timeout: 60,
    backend_keepalive: 120,
    backend_timeout: 60,
    log_level: 'warn',
    audit_status: true,
    anti_virus: false,
    anti_tamper_alarm: true,
    tamper_recv_mail: 'admin@example.com',
    server_info_hide: true,
    created_at: '2024-03-20T10:30:00Z',
  },
  {
    id: 'site-003',
    name: '后台管理系统',
    domains: 'admin.example.com',
    domain_match: 'exact',
    policy_id: 'policy-001',
    admin_state_up: true,
    status: 'active',
    forbidden_type: 'block',
    check_request_body: true,
    check_response_body: false,
    front_keepalive: 60,
    front_timeout: 30,
    backend_keepalive: 60,
    backend_timeout: 30,
    log_level: 'debug',
    audit_status: true,
    anti_virus: true,
    anti_tamper_alarm: true,
    tamper_recv_mail: 'security@example.com',
    server_info_hide: true,
    created_at: '2024-05-10T14:00:00Z',
  },
  {
    id: 'site-004',
    name: '静态资源CDN',
    domains: '*.cdn.example.com',
    domain_match: 'suffix',
    admin_state_up: false,
    status: 'inactive',
    forbidden_type: 'block',
    check_request_body: false,
    check_response_body: false,
    front_keepalive: 300,
    front_timeout: 120,
    backend_keepalive: 300,
    backend_timeout: 120,
    log_level: 'error',
    audit_status: false,
    anti_virus: false,
    anti_tamper_alarm: false,
    server_info_hide: false,
    created_at: '2024-06-01T09:00:00Z',
  },
]

export let lbMembers: LbMember[] = [
  {
    id: 'lb-001',
    site_id: 'site-001',
    name: '主负载均衡',
    lb_pool_id: 'pool-01',
    backend_address: '10.0.1.10',
    backend_protocol_port: 8080,
  },
  {
    id: 'lb-002',
    site_id: 'site-001',
    name: '备用负载均衡',
    lb_pool_id: 'pool-02',
    backend_address: '10.0.1.11',
    backend_protocol_port: 8080,
  },
  {
    id: 'lb-003',
    site_id: 'site-002',
    name: 'API负载均衡',
    lb_pool_id: 'pool-03',
    backend_address: '10.0.2.10',
    backend_protocol_port: 9090,
  },
]

export let instanceMembers: InstanceProtectMember[] = [
  {
    id: 'inst-m-001',
    site_id: 'site-001',
    name: '透明代理节点',
    member_type: 'transparent',
    protocol: 'https',
    instance_id: 'inst-001',
    address: '192.168.1.20',
    protocol_port: 443,
    backend_address: '10.0.1.10',
    backend_protocol_port: 8080,
  },
  {
    id: 'inst-m-002',
    site_id: 'site-001',
    name: '反向代理节点',
    member_type: 'reverse',
    protocol: 'http',
    instance_id: 'inst-002',
    address: '192.168.1.21',
    protocol_port: 80,
    backend_address: '10.0.1.11',
    backend_protocol_port: 8080,
  },
  {
    id: 'inst-m-003',
    site_id: 'site-002',
    name: 'API代理节点',
    member_type: 'reverse',
    protocol: 'https',
    instance_id: 'inst-001',
    address: '192.168.2.20',
    protocol_port: 443,
    backend_address: '10.0.2.10',
    backend_protocol_port: 9090,
  },
]

export let aclProtects: AclProtect[] = [
  {
    id: 'acl-001',
    site_id: 'site-001',
    name: '封禁恶意IP段',
    type: 'deny',
    ip_src: '203.0.113.0/24',
    log: true,
    state: true,
  },
  {
    id: 'acl-002',
    site_id: 'site-001',
    name: '允许办公网络',
    type: 'allow',
    ip_src: '10.10.0.0/16',
    log: false,
    state: true,
  },
  {
    id: 'acl-003',
    site_id: 'site-002',
    name: 'API白名单',
    type: 'allow',
    ip_src: '172.16.0.0/12',
    log: true,
    state: true,
  },
]

export let ccProtects: CcProtect[] = [
  {
    id: 'cc-001',
    site_id: 'site-001',
    name: '首页CC防护',
    url: '/',
    rate: 100,
    time: 60,
    action: 'deny',
    log: true,
    state: true,
  },
  {
    id: 'cc-002',
    site_id: 'site-001',
    name: '登录接口限流',
    url: '/api/login',
    rate: 10,
    time: 60,
    action: 'redirect',
    redirect_url: '/captcha',
    log: true,
    state: true,
  },
  {
    id: 'cc-003',
    site_id: 'site-002',
    name: 'API全局限流',
    url: '/api/*',
    rate: 500,
    time: 60,
    action: 'drop',
    log: true,
    state: true,
  },
]

export let csrfProtects: CsrfProtect[] = [
  {
    id: 'csrf-001',
    site_id: 'site-001',
    name: '表单提交防护',
    url: '/submit',
    action: 'deny',
    log: true,
    state: true,
  },
  {
    id: 'csrf-002',
    site_id: 'site-003',
    name: '管理后台CSRF',
    url: '/admin/*',
    action: 'deny',
    log: true,
    state: true,
  },
]

export let accelerators: Accelerator[] = [
  {
    id: 'acc-001',
    site_id: 'site-001',
    name: '静态资源缓存',
    url: '/static/*',
    is_global: 'disable',
    filetypes: 'js,css,png,jpg',
    expired_time: 3600,
  },
  {
    id: 'acc-002',
    site_id: 'site-004',
    name: 'CDN全局加速',
    url: '/*',
    is_global: 'enable',
    filetypes: 'js,css,png,jpg,webp,avif',
    expired_time: 86400,
  },
]

export let customRules: CustomRule[] = [
  { id: 'cr-001', site_id: 'site-001', name: 'SQL注入增强检测', priority: 1 },
  { id: 'cr-002', site_id: 'site-001', name: 'XSS深度过滤', priority: 2 },
  { id: 'cr-003', site_id: 'site-002', name: 'API参数校验', priority: 1 },
]

export let antiTampers: AntiTamper[] = [
  {
    id: 'at-001',
    site_id: 'site-001',
    name: '首页防篡改',
    url: '/index.html',
    file_type: 'html',
    action: 'deny',
    log: true,
    status: true,
  },
  {
    id: 'at-002',
    site_id: 'site-003',
    name: '管理页面防篡改',
    url: '/admin/dashboard',
    file_type: 'html',
    action: 'deny',
    log: true,
    status: true,
  },
]

export let contentIntos: ContentInto[] = [
  { id: 'ci-001', site_id: 'site-001', url: '/index.html', name: '安全水印注入' },
  { id: 'ci-002', site_id: 'site-001', url: '/about.html', name: '版权信息注入' },
]

export let antiStealingLinks: AntiStealingLink[] = [
  {
    id: 'asl-001',
    name: '图片防盗链',
    trust_hosts: 'example.com,cdn.example.com',
    file_types: 'jpg,png,gif,webp',
    action: 'deny',
    log: true,
    enabled: true,
  },
  {
    id: 'asl-002',
    name: '视频防盗链',
    trust_hosts: 'example.com',
    file_types: 'mp4,webm',
    action: 'redirect',
    log: true,
    enabled: true,
  },
]

// 不可变更新辅助 — 用于 handler 中替换模块级 let 绑定
export const updateSites = (next: ProtectSite[]) => {
  sites = next
}
export const updateLbMembers = (next: LbMember[]) => {
  lbMembers = next
}
export const updateInstanceMembers = (next: InstanceProtectMember[]) => {
  instanceMembers = next
}
export const updateAclProtects = (next: AclProtect[]) => {
  aclProtects = next
}
export const updateCcProtects = (next: CcProtect[]) => {
  ccProtects = next
}
export const updateCsrfProtects = (next: CsrfProtect[]) => {
  csrfProtects = next
}
export const updateAccelerators = (next: Accelerator[]) => {
  accelerators = next
}
export const updateCustomRules = (next: CustomRule[]) => {
  customRules = next
}
export const updateAntiTampers = (next: AntiTamper[]) => {
  antiTampers = next
}
export const updateContentIntos = (next: ContentInto[]) => {
  contentIntos = next
}
export const updateAntiStealingLinks = (next: AntiStealingLink[]) => {
  antiStealingLinks = next
}
