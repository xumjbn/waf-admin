import { useEffect, useMemo, useState } from 'react'
import { Card, Icon, Tag, Button, Tabs, Bar } from '@/components/ui'
import { Gauge } from '@/components/charts'
import * as systemApi from '@/api/live/system'
import PageUpgrade from './PageUpgrade'

type TabKey = 'about' | 'basic' | 'upgrade' | 'crs' | 'sec' | 'data' | 'pool'

// 把 settings 列表（key/value 对）转成 Map 方便后续按 key 直接取值。
// 后端用 key 例如 'http_addr' / 'jwt_secret' / 'log_retention_days' 等。
function toMap(list: systemApi.SystemSetting[]): Map<string, systemApi.SystemSetting> {
  const m = new Map<string, systemApi.SystemSetting>()
  for (const s of list) m.set(s.key, s)
  return m
}

export default function SystemPage() {
  const [tab, setTab] = useState<TabKey>('about')
  const [settings, setSettings] = useState<systemApi.SystemSetting[]>([])
  const [license, setLicense] = useState<systemApi.SystemLicense | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    const [sRes, lRes] = await Promise.allSettled([
      systemApi.listSettings(),
      systemApi.currentLicense(),
    ])
    if (sRes.status === 'fulfilled') setSettings(sRes.value)
    if (lRes.status === 'fulfilled') setLicense(lRes.value)
    const errs = [sRes, lRes].filter(r => r.status === 'rejected') as PromiseRejectedResult[]
    if (errs.length > 0) {
      setError(
        errs.map(e => (e.reason instanceof Error ? e.reason.message : String(e.reason))).join('; '),
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const settingsMap = useMemo(() => toMap(settings), [settings])

  return (
    <>
      <div className="page-hd">
        <div>
          <h1>
            <span className="ord">NW · 09</span>
            系统管理
          </h1>
          <p>系统设置 · 规则库 · 数据维护 · 资源池</p>
        </div>
      </div>

      {error && (
        <div
          className="fs-12 mb-3"
          style={{
            padding: '8px 12px',
            background: 'var(--bg-danger-1, #fee2e2)',
            color: 'var(--text-danger, #b91c1c)',
            borderRadius: 6,
          }}
        >
          部分数据加载失败：{error}
        </div>
      )}

      <Tabs
        tabs={[
          { value: 'about', label: '系统信息', ico: 'cpu' },
          { value: 'basic', label: '基础设置', ico: 'settings' },
          { value: 'upgrade', label: '系统升级', ico: 'arrow-up' },
          { value: 'crs', label: '规则库', ico: 'database' },
          { value: 'sec', label: '安全', ico: 'lock' },
          { value: 'data', label: '数据维护', ico: 'database' },
          { value: 'pool', label: '资源池', ico: 'server' },
        ]}
        value={tab}
        onChange={v => setTab(v as TabKey)}
      />

      {tab === 'about' && <AboutTab license={license} loading={loading} />}
      {tab === 'basic' && <BasicTab settingsMap={settingsMap} onSaved={refresh} />}
      {tab === 'upgrade' && <PageUpgrade />}
      {tab === 'crs' && <CrsTab />}
      {tab === 'sec' && <SecTab settingsMap={settingsMap} />}
      {tab === 'data' && <DataTab />}
      {tab === 'pool' && <PoolTab />}
    </>
  )
}

function StatItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="muted fs-11" style={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div className="fw-700 text-0 fs-13" style={{ marginTop: 3 }}>
        {value}
      </div>
    </div>
  )
}

function AboutTab({
  license,
  loading,
}: {
  license: systemApi.SystemLicense | null
  loading: boolean
}) {
  const licStatusKind = (s?: systemApi.LicenseStatus) =>
    s === 'active' ? 'ok' : s === 'grace' ? 'warn' : s === 'expired' ? 'danger' : 'def'
  return (
    <div className="row r-2-1">
      <Card title="许可证 & 版本" ico="lock" bracketed>
        <div className="row r-3 gap-3">
          <StatItem label="产品" value={license?.product_name || 'NebulaWAF 企业版'} />
          <StatItem
            label="版本"
            value={<span className="mono">{license?.edition || 'enterprise'}</span>}
          />
          <StatItem
            label="构建"
            value={
              <span className="mono">
                {license?.issued_at?.slice(0, 10) || '—'}
              </span>
            }
          />
          <StatItem label="授权客户" value={license?.customer || '—'} />
          <StatItem
            label="到期时间"
            value={
              <span className="mono">{license?.expires_at?.slice(0, 10) || '—'}</span>
            }
          />
          <StatItem
            label="授权状态"
            value={
              loading ? (
                <span className="muted fs-12">加载中…</span>
              ) : (
                <Tag kind={licStatusKind(license?.status)}>
                  {license?.status === 'active'
                    ? '有效'
                    : license?.status === 'grace'
                      ? '宽限期'
                      : license?.status === 'expired'
                        ? '已过期'
                        : '未激活'}
                </Tag>
              )
            }
          />
          <StatItem label="最大节点" value={String(license?.max_nodes ?? '—')} />
          <StatItem label="联系邮箱" value={license?.contact_email || '—'} />
          <StatItem label="支持级别" value="L3 7×24" />
        </div>
        <div className="divider-h" />
        <div className="muted fs-12">
          许可证密钥：
          <code className="mono">
            {license?.license_key
              ? license.license_key.slice(0, 8) +
                '...' +
                license.license_key.slice(-4)
              : '—'}
          </code>
        </div>
      </Card>

      <Card title="资源水位" ico="activity">
        <div className="flex" style={{ justifyContent: 'space-around' }}>
          <Gauge value={42} label="CPU" size={120} color="#a855f7" />
          <Gauge value={68} label="内存" size={120} color="#22d3ee" />
        </div>
        <div className="muted fs-11 mt-3" style={{ textAlign: 'center' }}>
          🛈 实时水位需 metrics-history 端点（待落地）
        </div>
      </Card>
    </div>
  )
}

function BasicTab({
  settingsMap,
  onSaved,
}: {
  settingsMap: Map<string, systemApi.SystemSetting>
  onSaved: () => void
}) {
  // 6 个表单字段对应 6 个 settings key
  const initial = {
    timezone: settingsMap.get('timezone')?.value || 'Asia/Shanghai',
    language: settingsMap.get('language')?.value || 'zh-CN',
    log_retention_days: settingsMap.get('log_retention_days')?.value || '90',
    admin_iface: settingsMap.get('admin_iface')?.value || '0.0.0.0',
    admin_port: settingsMap.get('admin_port')?.value || '8443',
    public_api: settingsMap.get('public_api')?.value || 'https://waf.example.com/api',
    ntp_servers:
      settingsMap.get('ntp_servers')?.value || 'ntp.aliyun.com,time.cloud.tencent.com',
  }
  const [draft, setDraft] = useState(initial)
  // settingsMap 变化时（首次加载完）回填 draft
  useEffect(() => {
    setDraft(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsMap])

  const [savingGroup, setSavingGroup] = useState<'system' | 'network' | null>(null)
  const [savedGroup, setSavedGroup] = useState<'system' | 'network' | null>(null)

  const upd = (k: keyof typeof draft, v: string) => setDraft(d => ({ ...d, [k]: v }))

  const saveGroup = async (group: 'system' | 'network', keys: (keyof typeof draft)[]) => {
    setSavingGroup(group)
    try {
      for (const k of keys) {
        // eslint-disable-next-line no-await-in-loop
        await systemApi.upsertSetting({
          key: k,
          value: draft[k],
          category: group === 'system' ? 'basic' : 'network',
        })
      }
      setSavedGroup(group)
      window.setTimeout(() => setSavedGroup(null), 1800)
      onSaved()
    } catch (e: unknown) {
      window.alert(`保存失败：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setSavingGroup(null)
    }
  }

  return (
    <div className="row r-1-1">
      <Card title="系统设置" ico="settings">
        <div className="stack">
          <div className="field">
            <label>时区</label>
            <select
              className="select"
              value={draft.timezone}
              onChange={e => upd('timezone', e.target.value)}
            >
              <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
              <option value="UTC">UTC</option>
              <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
              <option value="America/Los_Angeles">America/Los_Angeles</option>
            </select>
          </div>
          <div className="field">
            <label>语言</label>
            <select
              className="select"
              value={draft.language}
              onChange={e => upd('language', e.target.value)}
            >
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
          <div className="field">
            <label>日志保留天数</label>
            <input
              className="input"
              value={draft.log_retention_days}
              onChange={e => upd('log_retention_days', e.target.value)}
            />
          </div>
          <Button
            variant="pri"
            style={{ alignSelf: 'flex-start', marginTop: 8 }}
            disabled={savingGroup === 'system'}
            onClick={() => saveGroup('system', ['timezone', 'language', 'log_retention_days'])}
          >
            {savingGroup === 'system'
              ? '保存中…'
              : savedGroup === 'system'
                ? '已保存'
                : '保存设置'}
          </Button>
        </div>
      </Card>
      <Card title="网络设置" ico="topology">
        <div className="stack">
          <div className="field">
            <label>管理接口</label>
            <input
              className="input"
              value={draft.admin_iface}
              onChange={e => upd('admin_iface', e.target.value)}
            />
          </div>
          <div className="field">
            <label>管理端口</label>
            <input
              className="input"
              value={draft.admin_port}
              onChange={e => upd('admin_port', e.target.value)}
            />
          </div>
          <div className="field">
            <label>外网 API 端点</label>
            <input
              className="input"
              value={draft.public_api}
              onChange={e => upd('public_api', e.target.value)}
            />
          </div>
          <div className="field">
            <label>NTP 服务器</label>
            <input
              className="input"
              value={draft.ntp_servers}
              onChange={e => upd('ntp_servers', e.target.value)}
            />
          </div>
          <Button
            variant="pri"
            style={{ alignSelf: 'flex-start', marginTop: 8 }}
            disabled={savingGroup === 'network'}
            onClick={() =>
              saveGroup('network', ['admin_iface', 'admin_port', 'public_api', 'ntp_servers'])
            }
          >
            {savingGroup === 'network'
              ? '保存中…'
              : savedGroup === 'network'
                ? '已保存'
                : '保存设置'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

function CrsTab() {
  // CRS 版本管理后端 schema 待设计；当前从 deploy/modsec 拿 owasp-crs/crs-setup.conf 解析也可以，
  // 但 NW · 09 设计稿就是这样的版本时间轴，先按设计稿保留装饰，等真后端到位再换。
  return (
    <Card title="OWASP CRS 规则库" ico="database" bodyClass="np">
      <div className="muted fs-12" style={{ padding: '14px 18px 0' }}>
        🛈 CRS 版本管理后端待落地。当前 ModSec 规则集从 <code>deploy/modsec/rules.d/</code>
        加载（{`POST /api/v1/policies/sync-builtin`} 触发同步），版本流水线设计中。
      </div>
      <table>
        <thead>
          <tr>
            <th>版本</th>
            <th>更新日期</th>
            <th>规则数</th>
            <th>变更</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="mono">CRS 4.0.0</td>
            <td>2026-05-10</td>
            <td className="mono">356</td>
            <td>新增 Log4j · Spring4Shell · MOVEit 等</td>
            <td>
              <Tag kind="ok">已应用</Tag>
            </td>
          </tr>
          <tr>
            <td className="mono">CRS 3.8.0</td>
            <td>2026-04-01</td>
            <td className="mono">342</td>
            <td>优化 SQL 注入语义检测</td>
            <td>
              <span className="muted fs-12">已归档</span>
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  )
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="flex items-center"
      style={{ padding: '5px 0', borderBottom: '1px solid var(--line-2)' }}
    >
      <span className="muted fs-11" style={{ width: 120, letterSpacing: 0.5 }}>
        {label}
      </span>
      <span className="fs-12 text-1" style={{ flex: 1 }}>
        {value}
      </span>
    </div>
  )
}

function SecTab({ settingsMap }: { settingsMap: Map<string, systemApi.SystemSetting> }) {
  // SecTab 字段当前只读，从 settings 取，缺省字段显示『未配置』
  const session = settingsMap.get('session_timeout_minutes')?.value
  const lock = settingsMap.get('login_lock_policy')?.value
  const pwd = settingsMap.get('password_policy')?.value
  const adminWhitelist = settingsMap.get('admin_ip_whitelist')?.value
  const mfa = settingsMap.get('mfa_enabled')?.value === 'true'
  const audit = settingsMap.get('audit_log_enabled')?.value !== 'false'
  return (
    <div className="row r-1-1">
      <Card title="登录与会话" ico="lock">
        <div className="stack">
          <KV label="会话超时" value={session ? `${session} 分钟` : '30 分钟（默认）'} />
          <KV label="登录失败锁定" value={lock || '5 次 / 15 分钟（默认）'} />
          <KV label="密码策略" value={pwd || '≥ 12 位 · 大小写+数字+符号'} />
          <KV label="管理 IP 白名单" value={adminWhitelist || '未配置'} />
          <KV label="双因素认证" value={<Tag kind={mfa ? 'ok' : 'warn'}>{mfa ? '已启用' : '未启用'}</Tag>} />
          <KV label="审计日志" value={<Tag kind={audit ? 'ok' : 'def'}>{audit ? '已启用' : '已关闭'}</Tag>} />
        </div>
      </Card>
      <Card title="加密 & 证书" ico="lock">
        <div className="stack">
          <KV label="管理面证书" value={settingsMap.get('admin_cert')?.value || "Let's Encrypt"} />
          <KV
            label="到期时间"
            value={settingsMap.get('admin_cert_expires')?.value || '—'}
          />
          <KV label="TLS 版本" value={settingsMap.get('tls_versions')?.value || 'TLS 1.2 / 1.3'} />
          <KV label="密钥管理" value={settingsMap.get('kms_backend')?.value || 'HashiCorp Vault'} />
          <KV
            label="敏感数据加密"
            value={<Tag kind="ok">{settingsMap.get('data_cipher')?.value || 'AES-256-GCM'}</Tag>}
          />
        </div>
      </Card>
    </div>
  )
}

function DataTab() {
  const [busy, setBusy] = useState<string | null>(null)

  const runDanger = async (op: string, fn: () => Promise<void>) => {
    if (!window.confirm(`⚠️ 危险操作\n\n确认执行：${op}？\n\n此操作不可撤销。`)) return
    setBusy(op)
    try {
      await fn()
      window.alert(`✓ 完成：${op}`)
    } catch (e: unknown) {
      window.alert(`✗ 失败：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(null)
    }
  }

  // 后端暂无统一 /system/maintenance 端点，先用 settings 写入意图，由 control
  // 定时任务消费；导出/重建索引等放 TODO 标识。
  const writeIntent = async (key: string, value: string) => {
    await systemApi.upsertSetting({ key, value, category: 'maintenance' })
  }

  return (
    <Card title="数据维护" ico="database">
      <div className="muted fs-12 mb-4">
        这些操作不可逆，请谨慎使用。当前通过写 settings 表登记意图，由 control 后台任务消费。
      </div>
      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
        <Button
          variant="ghost"
          disabled={busy !== null}
          onClick={() =>
            runDanger('清理过期攻击日志 (≥ 90 天)', () =>
              writeIntent('maint_purge_attack_logs', new Date().toISOString()),
            )
          }
        >
          <Icon name="trash" size={13} className="ico" />
          {busy === '清理过期攻击日志 (≥ 90 天)' ? '执行中…' : '清理过期攻击日志 (≥ 90 天)'}
        </Button>
        <Button
          variant="ghost"
          disabled={busy !== null}
          onClick={() =>
            runDanger('清理过期操作日志', () =>
              writeIntent('maint_purge_operation_logs', new Date().toISOString()),
            )
          }
        >
          <Icon name="trash" size={13} className="ico" />
          {busy === '清理过期操作日志' ? '执行中…' : '清理过期操作日志'}
        </Button>
        <Button
          variant="line"
          disabled={busy !== null}
          onClick={() =>
            runDanger('导出全量备份（任务排队）', () =>
              writeIntent('maint_export_backup', new Date().toISOString()),
            )
          }
        >
          <Icon name="download" size={13} className="ico" />
          导出全量备份
        </Button>
        <Button
          variant="line"
          disabled={busy !== null}
          onClick={() =>
            runDanger('重建索引', () =>
              writeIntent('maint_reindex', new Date().toISOString()),
            )
          }
        >
          <Icon name="refresh" size={13} className="ico" />
          重建索引
        </Button>
        <Button
          variant="pri"
          disabled={busy !== null}
          style={{
            background: 'var(--danger)',
            boxShadow: '0 4px 14px -4px rgba(239,68,68,.5)',
          }}
          onClick={() =>
            runDanger('重置全部统计 [不可恢复]', () =>
              writeIntent('maint_reset_stats', new Date().toISOString()),
            )
          }
        >
          <Icon name="alert" size={13} className="ico" />
          重置全部统计
        </Button>
      </div>
    </Card>
  )
}

function PoolTab() {
  // 资源池后端 schema 待落地（待 cluster_pools 表）。当前先按设计稿装饰。
  return (
    <Card title="资源池" ico="server" meta="2 个池" bodyClass="np">
      <div className="muted fs-12" style={{ padding: '14px 18px 0' }}>
        🛈 资源池管理后端待落地（待 <code>cluster_pools</code> 表）。当前页面为设计稿装饰。
      </div>
      <table>
        <thead>
          <tr>
            <th>资源池</th>
            <th>规格</th>
            <th>可用</th>
            <th>已分配</th>
            <th>使用率</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="fw-600">
              <span className="tbl-link">default-pool</span>
            </td>
            <td>
              <Tag kind="info">4C8G</Tag>
            </td>
            <td className="mono">20</td>
            <td className="mono">12</td>
            <td>
              <Bar value={60} kind="brand" width={80} label="60%" />
            </td>
            <td>
              <Tag kind="ok">正常</Tag>
            </td>
          </tr>
          <tr>
            <td className="fw-600">
              <span className="tbl-link">high-perf-pool</span>
            </td>
            <td>
              <Tag kind="pink">8C16G</Tag>
            </td>
            <td className="mono">10</td>
            <td className="mono">4</td>
            <td>
              <Bar value={40} kind="brand" width={80} label="40%" />
            </td>
            <td>
              <Tag kind="ok">正常</Tag>
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  )
}
