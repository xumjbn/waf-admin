import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Icon,
  type IconName,
  Tag,
  Button,
  Toggle,
  Sparkline,
  cn,
} from '@/components/ui'
import { SITES, CLUSTERS, RULES, type Site } from '@/mocks/nebula'
import { hexA } from '@/components/charts/canvasUtils'
import * as siteApi from '@/api/live/site'
import * as logApi from '@/api/live/log'

interface EditData {
  name: string
  domain: string
  aliases: string
  proto: string
  port: string
  project: string
  httpRedirect: boolean
  http2: boolean
  minTls: string
  certType: 'upload' | 'le' | 'existing'
  certSan: string
  certExpiry: string
  certIssuer: string
  origins: { id: number; proto: 'http' | 'https'; host: string; port: string; weight: string }[]
  healthPath: string
  healthInterval: number
  healthFails: number
  hostRewrite: 'keep' | 'origin' | 'custom'
  cluster: string
  level: 'low' | 'medium' | 'high'
  mode: 'block' | 'observe'
  modules: Record<string, boolean>
  aclAllow: string
  aclDeny: string
  logRetention: number
  notifyEmail: boolean
  notifyDing: boolean
  notifySms: boolean
  paused: boolean
}

type SectionId =
  | 'basic'
  | 'cert'
  | 'origin'
  | 'protect'
  | 'rules'
  | 'acl'
  | 'cache'
  | 'log'
  | 'audit'
  | 'danger'

interface SectionDef {
  id: SectionId
  label: string
  ico: IconName
  hint: string
  danger?: boolean
}

const SECTIONS: SectionDef[] = [
  { id: 'basic', label: '基本信息', ico: 'sites', hint: '域名 · 协议' },
  { id: 'cert', label: 'TLS 证书', ico: 'lock', hint: 'HTTPS 证书' },
  { id: 'origin', label: '源站配置', ico: 'server', hint: '上游 · 健康检查' },
  { id: 'protect', label: '防护策略', ico: 'shield', hint: '集群 · 等级 · 模块' },
  { id: 'rules', label: '自定义规则', ico: 'rules', hint: '本站点规则 5 条' },
  { id: 'acl', label: '访问控制', ico: 'flow', hint: '黑白名单' },
  { id: 'cache', label: '缓存 & 性能', ico: 'database', hint: '缓存 · 压缩' },
  { id: 'log', label: '日志 & 通知', ico: 'bell', hint: '保留 · 告警' },
  { id: 'audit', label: '审计记录', ico: 'logs', hint: '配置变更' },
  { id: 'danger', label: '危险操作', ico: 'alert', hint: '暂停 · 删除', danger: true },
]

export default function SiteEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const site = SITES.find(s => s.id === id) ?? SITES[0]

  const initial: EditData = useMemo(
    () => ({
      name: site.name,
      domain: site.domain,
      aliases: site.id === 'site-1' ? 'example.com, m.example.com' : '',
      proto: 'https',
      port: '443',
      project: '默认项目',
      httpRedirect: true,
      http2: true,
      minTls: 'TLS 1.2',
      certType: 'le',
      certSan: site.domain,
      certExpiry: '2026-08-12',
      certIssuer: "Let's Encrypt R3",
      origins: [
        {
          id: 1,
          proto: 'http',
          host: site.upstream.split(':')[0],
          port: site.upstream.split(':')[1] || '8080',
          weight: '100',
        },
        { id: 2, proto: 'http', host: '10.20.1.11', port: '8080', weight: '80' },
      ],
      healthPath: '/health',
      healthInterval: 5,
      healthFails: 3,
      hostRewrite: 'keep',
      cluster: site.instance,
      level: 'medium',
      mode: site.state === 'observe' ? 'observe' : 'block',
      modules: {
        sqli: true,
        xss: true,
        csrf: true,
        cc: true,
        bot: true,
        upload: true,
        api: site.id === 'site-2',
        geo: false,
      },
      aclAllow: '10.0.0.0/8\n172.16.5.0/24',
      aclDeny: 'IR\nKP\n185.156.0.0/16',
      logRetention: 90,
      notifyEmail: true,
      notifyDing: true,
      notifySms: false,
      paused: site.state === 'paused',
    }),
    [site],
  )

  const [data, setData] = useState<EditData>(initial)
  // baseline 与 initial 分开 —— initial 只在 site 变时 useMemo 重算，baseline 在
  // 每次保存成功后推进，让 dirty 比较以最新已保存值为准；否则 SaveBar 永远不消失。
  const [baseline, setBaseline] = useState<EditData>(initial)
  // 站点变化时（路由切换）重置 baseline
  useEffect(() => {
    setBaseline(initial)
  }, [initial])

  const [section, setSection] = useState<SectionId>('basic')
  const set = (patch: Partial<EditData>) => setData(d => ({ ...d, ...patch }))

  const dirty = useMemo(() => {
    return (Object.keys(baseline) as (keyof EditData)[]).filter(
      k => JSON.stringify(baseline[k]) !== JSON.stringify(data[k]),
    )
  }, [data, baseline])

  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)

  // 提交：把 EditData 的核心字段映射到后端 site model，其余 UI 元字段
  // （aliases/level/mode/modules/notify*/aclAllow 等）打包进 description JSON，
  // 与 SiteWizard 创建时的存法保持一致。
  const onSave = async () => {
    setSaving(true)
    setSaveErr(null)
    try {
      const sslEnabled = data.proto === 'https' || data.proto === 'both'
      const port = Number(data.port) || (sslEnabled ? 443 : 80)
      const upstream = {
        servers: data.origins
          .filter(o => o.host.trim())
          .map(o => ({
            host: o.host.trim(),
            port: Number(o.port) || 80,
            weight: Number(o.weight) || 100,
            proto: o.proto,
          })),
        health: {
          path: data.healthPath,
          interval_sec: data.healthInterval,
          fail_threshold: data.healthFails,
        },
        host_rewrite: data.hostRewrite,
      }
      const meta = {
        project: data.project,
        aliases: data.aliases
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        min_tls: data.minTls,
        cert_type: data.certType,
        cert_san: data.certSan,
        cluster: data.cluster,
        level: data.level,
        mode: data.mode,
        modules: Object.keys(data.modules).filter(k => data.modules[k]),
        acl_allow: data.aclAllow,
        acl_deny: data.aclDeny,
        log_retention: data.logRetention,
        notify: {
          email: data.notifyEmail,
          ding: data.notifyDing,
          sms: data.notifySms,
        },
        http_redirect: data.httpRedirect,
        http2: data.http2,
      }
      await siteApi.updateSite(site.id, {
        name: data.name.trim(),
        domain: data.domain.trim(),
        listen_port: port,
        ssl_enabled: sslEnabled,
        upstream,
        waf_enabled: data.mode !== 'observe',
        description: JSON.stringify(meta),
        status: data.paused ? 'paused' : 'active',
      })
      // 保存成功 → 把当前已提交内容当成新的 baseline，让 dirty 重置；之前没做这步
      // 导致 SaveBar 永远显示『XX 项未保存』。
      setBaseline(data)
    } catch (e: unknown) {
      setSaveErr(e instanceof Error ? e.message : String(e))
      throw e
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="muted fs-12 mono"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/site')}
            >
              ← 站点 / 拓扑
            </span>
          </div>
          <h1>
            <span className="ord">NW · 03 / EDIT</span>
            编辑站点 · {site.name}
          </h1>
          <p>
            <span className="mono t-brand">{site.domain}</span>
            <span className="muted" style={{ margin: '0 8px' }}>·</span>
            <span className="muted">站点 ID</span>
            <code className="mono" style={{ marginLeft: 6, fontSize: 11.5 }}>
              {site.id}
            </code>
            <span className="muted" style={{ margin: '0 8px' }}>·</span>
            <span className="muted">接入于 2026-04-12</span>
          </p>
        </div>
        <div className="actions">
          <Button variant="ghost">
            <Icon name="logs" size={13} className="ico" />
            查看日志
          </Button>
          <Button variant="line">
            <Icon name="download" size={13} className="ico" />
            导出配置
          </Button>
        </div>
      </div>

      <SiteStatusBanner site={site} data={data} set={set} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px minmax(0, 1fr)',
          gap: 18,
          marginTop: 18,
          marginBottom: 80,
        }}
      >
        <SectionNav current={section} onPick={setSection} dirtyCount={dirty.length} />

        <div className="card" style={{ minHeight: 600 }}>
          <div className="card-bd" style={{ padding: '26px 30px' }}>
            {section === 'basic' && <BasicSection data={data} set={set} />}
            {section === 'cert' && <CertSection data={data} set={set} />}
            {section === 'origin' && <OriginSection data={data} set={set} />}
            {section === 'protect' && <ProtectSection data={data} set={set} />}
            {section === 'rules' && <RulesSection site={site} />}
            {section === 'acl' && <AclSection data={data} set={set} />}
            {section === 'cache' && <CacheSection />}
            {section === 'log' && <LogSection data={data} set={set} />}
            {section === 'audit' && <AuditSection />}
            {section === 'danger' && <DangerSection />}
          </div>
        </div>
      </div>

      <SaveBar
        dirty={dirty}
        saving={saving}
        error={saveErr}
        onDiscard={() => setData(baseline)}
        onSave={onSave}
      />
    </>
  )
}

function SiteStatusBanner({
  site,
  data,
  set,
}: {
  site: Site
  data: EditData
  set: (p: Partial<EditData>) => void
}) {
  const status = data.paused ? 'paused' : data.mode === 'observe' ? 'observe' : 'protected'
  const statusColor = { protected: '#10b981', observe: '#f59e0b', paused: '#5d556e' }[status]
  const statusLabel = { protected: '防护中', observe: '观察模式', paused: '已暂停' }[status]
  // 近 24h 该站点攻击趋势（真实 attack_logs 聚合），30s 刷新；空时给单点 0。
  const [spark, setSpark] = useState<number[]>([0])
  useEffect(() => {
    let cancelled = false
    const load = () =>
      logApi
        .attackTrend({ site: site.name, hours: 24 })
        .then(pts => {
          if (!cancelled) setSpark(pts.length > 0 ? pts.map(p => p.count) : [0])
        })
        .catch(() => {})
    load()
    const id = setInterval(load, 30_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [site.name])

  return (
    <div
      className="card bracketed"
      style={{
        padding: '18px 22px',
        background:
          'linear-gradient(135deg, rgba(168,85,247,.07), rgba(236,72,153,.04) 60%, transparent)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1.4fr',
          gap: 20,
          alignItems: 'center',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'var(--grad-brand)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              flexShrink: 0,
              boxShadow: '0 4px 18px -2px rgba(168,85,247,.55)',
            }}
          >
            <Icon name="sites" size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              className="fw-700 text-0 fs-15"
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {site.domain}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: statusColor,
                  boxShadow: status !== 'paused' ? `0 0 8px ${statusColor}` : 'none',
                }}
              />
              <span className="fw-600 fs-12" style={{ color: statusColor }}>
                {statusLabel}
              </span>
              <span className="muted fs-11 mono">· {data.cluster}</span>
            </div>
          </div>
        </div>

        <Metric label="今日 QPS" value={site.rps.toLocaleString()} hint="↑ 8.4%" />
        <Metric label="拦截率" value={site.blockedRate + '%'} hint="基线 1.2%" tone="warn" />
        <Metric label="实时连接" value="1,240" hint="峰值 2,180" />
        <Metric label="平均延迟" value="24" unit="ms" hint="P95 38ms" />

        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: data.paused ? 'rgba(245,158,11,.08)' : 'rgba(16,185,129,.06)',
            border: '1px solid ' + (data.paused ? 'rgba(245,158,11,.3)' : 'rgba(16,185,129,.25)'),
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="fw-700 fs-12 text-0">WAF 防护开关</span>
            <Toggle on={!data.paused} onChange={v => set({ paused: !v })} />
          </div>
          <div className="muted fs-11" style={{ lineHeight: 1.5 }}>
            {data.paused ? '防护已暂停 · 所有流量直通源站' : '正常防护中 · 受规则保护'}
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-3 mt-3"
        style={{ paddingTop: 14, borderTop: '1px solid var(--line-2)' }}
      >
        <span className="muted fs-11" style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
          近 1h QPS
        </span>
        <div style={{ flex: 1 }}>
          <Sparkline data={spark} color="var(--brand-1)" height={28} />
        </div>
        <span className="mono fs-11 t-brand">
          {Math.floor(spark[spark.length - 1]).toLocaleString()}
        </span>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  unit,
  hint,
  tone,
}: {
  label: string
  value: string
  unit?: string
  hint?: string
  tone?: 'warn'
}) {
  return (
    <div>
      <div className="muted fs-11" style={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div className="flex items-baseline gap-2" style={{ marginTop: 2 }}>
        <span className={cn('fw-700 mono fs-20', tone === 'warn' ? 't-warn' : 'text-0')}>
          {value}
        </span>
        {unit && <span className="muted fs-11">{unit}</span>}
      </div>
      {hint && <div className="muted fs-11">{hint}</div>}
    </div>
  )
}

function SectionNav({
  current,
  onPick,
  dirtyCount,
}: {
  current: SectionId
  onPick: (s: SectionId) => void
  dirtyCount: number
}) {
  return (
    <div style={{ position: 'sticky', top: 16, alignSelf: 'flex-start' }}>
      <div className="card" style={{ padding: 8 }}>
        {SECTIONS.map(s => {
          const on = current === s.id
          return (
            <div
              key={s.id}
              onClick={() => onPick(s.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                background: on
                  ? s.danger
                    ? 'rgba(239,68,68,.08)'
                    : 'rgba(168,85,247,.1)'
                  : 'transparent',
                color: on ? (s.danger ? 'var(--danger)' : 'var(--brand-1)') : 'var(--text-1)',
                borderLeft:
                  '2px solid ' +
                  (on ? (s.danger ? 'var(--danger)' : 'var(--brand-1)') : 'transparent'),
                marginBottom: 2,
                transition: 'all .12s',
              }}
            >
              <Icon name={s.ico} size={15} style={{ opacity: on ? 1 : 0.6, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="fw-600 fs-13"
                  style={{
                    color: on
                      ? s.danger
                        ? 'var(--danger)'
                        : 'var(--text-0)'
                      : s.danger
                        ? 'var(--danger)'
                        : 'var(--text-1)',
                  }}
                >
                  {s.label}
                </div>
                <div
                  className="muted fs-11"
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {s.hint}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {dirtyCount > 0 && (
        <div
          className="card mt-3"
          style={{
            padding: 12,
            background: 'rgba(245,158,11,.07)',
            borderColor: 'rgba(245,158,11,.3)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Icon name="alert" size={14} style={{ color: 'var(--warn)' }} />
            <span className="fw-700 fs-12" style={{ color: 'var(--warn)' }}>
              {dirtyCount} 项未保存
            </span>
          </div>
          <div className="muted fs-11">底部保存条可一键提交或丢弃</div>
        </div>
      )}
    </div>
  )
}

function SectionTitle({
  title,
  hint,
  right,
}: {
  title: string
  hint?: string
  right?: React.ReactNode
}) {
  return (
    <div
      className="flex items-center justify-between mb-3"
      style={{ paddingBottom: 10, borderBottom: '1px dashed var(--line)', marginBottom: 18 }}
    >
      <div>
        <div className="fw-700 text-0 fs-15">{title}</div>
        {hint && (
          <div className="muted fs-11" style={{ marginTop: 2 }}>
            {hint}
          </div>
        )}
      </div>
      {right}
    </div>
  )
}

function Field({
  label,
  hint,
  children,
  mb,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  mb?: boolean
}) {
  return (
    <div className="field" style={mb ? { marginBottom: 14 } : undefined}>
      <label>
        {label}{' '}
        {hint && (
          <span className="muted" style={{ textTransform: 'none', letterSpacing: 0, marginLeft: 4 }}>
            · {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  )
}

function ToggleRow({
  label,
  desc,
  on,
  onChange,
}: {
  label: string
  desc: string
  on: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      style={{
        padding: '12px 0',
        borderBottom: '1px solid var(--line-2)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div style={{ flex: 1 }}>
        <div className="fw-600 fs-13 text-0">{label}</div>
        <div className="muted fs-11">{desc}</div>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  )
}

function BasicSection({ data, set }: { data: EditData; set: (p: Partial<EditData>) => void }) {
  return (
    <>
      <SectionTitle title="基本信息" hint="站点身份 · 域名 · 协议" />
      <div className="row r-1-1 gap-3 mb-4">
        <Field label="站点名称">
          <input className="input" value={data.name} onChange={e => set({ name: e.target.value })} />
        </Field>
        <Field label="所属项目">
          <select
            className="select"
            value={data.project}
            onChange={e => set({ project: e.target.value })}
          >
            <option>默认项目</option>
            <option>项目 A — 主业务</option>
            <option>项目 B — 支付</option>
          </select>
        </Field>
      </div>

      <Field label="主域名" mb>
        <input className="input" value={data.domain} onChange={e => set({ domain: e.target.value })} />
      </Field>
      <Field label="域名别名（逗号分隔）" hint="支持泛域名 *.example.com" mb>
        <input
          className="input"
          value={data.aliases}
          onChange={e => set({ aliases: e.target.value })}
          placeholder="可选"
        />
      </Field>

      <div className="row r-3 gap-3 mb-3">
        <Field label="协议">
          <select className="select" value={data.proto} onChange={e => set({ proto: e.target.value })}>
            <option value="https">HTTPS</option>
            <option value="http">HTTP</option>
            <option value="both">HTTPS + HTTP</option>
          </select>
        </Field>
        <Field label="监听端口">
          <input className="input" value={data.port} onChange={e => set({ port: e.target.value })} />
        </Field>
        <Field label="最低 TLS 版本">
          <select
            className="select"
            value={data.minTls}
            onChange={e => set({ minTls: e.target.value })}
          >
            <option>TLS 1.2</option>
            <option>TLS 1.3</option>
          </select>
        </Field>
      </div>

      <ToggleRow
        label="HTTP → HTTPS 重定向"
        desc="301 永久重定向 · 推荐启用"
        on={data.httpRedirect}
        onChange={v => set({ httpRedirect: v })}
      />
      <ToggleRow
        label="启用 HTTP/2"
        desc="多路复用 · 显著提升加载性能"
        on={data.http2}
        onChange={v => set({ http2: v })}
      />
    </>
  )
}

function CertSection({ data, set }: { data: EditData; set: (p: Partial<EditData>) => void }) {
  return (
    <>
      <SectionTitle
        title="TLS 证书"
        hint="HTTPS 站点专属"
        right={
          <Tag kind="ok" lg>
            <span className="dot" />
            证书有效
          </Tag>
        }
      />

      <div className="card mb-4" style={{ background: 'var(--bg-0)', borderColor: 'var(--line)' }}>
        <div className="card-bd">
          <div className="flex items-center gap-3 mb-3">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(16,185,129,.12)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--ok)',
              }}
            >
              <Icon name="lock" size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="fw-700 text-0 fs-14">当前证书</div>
              <div className="muted fs-11 mono">{data.certIssuer}</div>
            </div>
            <Button variant="line" size="sm">
              <Icon name="refresh" size={11} className="ico" />
              立即续期
            </Button>
          </div>
          <div className="row r-3 gap-3">
            <SmallStat label="SAN" value={data.certSan} mono />
            <SmallStat label="到期" value={data.certExpiry} mono />
            <SmallStat label="剩余" value="87 天" tone="warn" />
          </div>
        </div>
      </div>

      <SectionTitle title="替换证书" hint="选择证书来源" />
      <div className="row r-3 gap-3 mb-3">
        {(
          [
            { v: 'upload', l: '上传证书', d: 'PEM + KEY' },
            { v: 'le', l: "Let's Encrypt", d: '自动签发与续期' },
            { v: 'existing', l: '已有证书', d: '从证书库选择' },
          ] as const
        ).map(c => (
          <RadioCard key={c.v} active={data.certType === c.v} onClick={() => set({ certType: c.v })}>
            <div className="fw-700 fs-13 text-0">{c.l}</div>
            <div className="muted fs-11 mt-2">{c.d}</div>
          </RadioCard>
        ))}
      </div>

      {data.certType === 'upload' && (
        <div className="card" style={{ background: 'var(--bg-0)', borderColor: 'var(--line)' }}>
          <div className="card-bd">
            <Field label="证书 (PEM)" mb>
              <textarea
                className="input"
                rows={3}
                placeholder="-----BEGIN CERTIFICATE-----..."
                style={{
                  height: 'auto',
                  padding: '10px 12px',
                  fontFamily: 'JetBrains Mono',
                  fontSize: 11.5,
                }}
              />
            </Field>
            <Field label="私钥 (KEY)">
              <textarea
                className="input"
                rows={3}
                placeholder="-----BEGIN PRIVATE KEY-----..."
                style={{
                  height: 'auto',
                  padding: '10px 12px',
                  fontFamily: 'JetBrains Mono',
                  fontSize: 11.5,
                }}
              />
            </Field>
          </div>
        </div>
      )}
    </>
  )
}

function SmallStat({
  label,
  value,
  mono,
  tone,
}: {
  label: string
  value: string
  mono?: boolean
  tone?: 'warn'
}) {
  return (
    <div>
      <div className="muted fs-11" style={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div
        className={cn(mono && 'mono', tone === 'warn' ? 't-warn' : 'text-0', 'fw-700 fs-12')}
        style={{ marginTop: 3 }}
      >
        {value}
      </div>
    </div>
  )
}

function RadioCard({
  active,
  onClick,
  children,
  row,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  row?: boolean
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: 14,
        borderRadius: 10,
        border: '1px solid ' + (active ? 'var(--brand-1)' : 'var(--line)'),
        background: active ? 'rgba(168,85,247,.06)' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        gap: 12,
        flexDirection: row ? 'row' : 'column',
        alignItems: row ? 'center' : 'flex-start',
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: '2px solid ' + (active ? 'var(--brand-1)' : 'var(--line-strong)'),
          background: active ? 'var(--brand-1)' : 'transparent',
          boxShadow: active ? 'inset 0 0 0 3px var(--bg-1)' : 'none',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  )
}

function OriginSection({ data, set }: { data: EditData; set: (p: Partial<EditData>) => void }) {
  const addOrigin = () =>
    set({
      origins: [
        ...data.origins,
        { id: Date.now(), proto: 'http', host: '', port: '8080', weight: '100' },
      ],
    })
  const rmOrigin = (id: number) => set({ origins: data.origins.filter(o => o.id !== id) })
  const upd = (id: number, patch: Partial<EditData['origins'][number]>) =>
    set({ origins: data.origins.map(o => (o.id === id ? { ...o, ...patch } : o)) })

  return (
    <>
      <SectionTitle
        title="上游源站"
        hint={`${data.origins.length} 个源站 · 加权轮询`}
        right={
          <Button variant="line" size="sm" onClick={addOrigin}>
            <Icon name="plus" size={11} className="ico" />
            添加源站
          </Button>
        }
      />

      <div className="stack" style={{ gap: 8 }}>
        {data.origins.map((o, i) => (
          <div
            key={o.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr 100px 100px 80px 70px 36px',
              gap: 10,
              alignItems: 'center',
              padding: 12,
              background: 'var(--bg-0)',
              border: '1px solid var(--line)',
              borderRadius: 10,
            }}
          >
            <select
              className="select"
              value={o.proto}
              onChange={e =>
                upd(o.id, {
                  proto: e.target.value as EditData['origins'][number]['proto'],
                })
              }
            >
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
            </select>
            <input
              className="input mono"
              value={o.host}
              placeholder="IP / 域名"
              onChange={e => upd(o.id, { host: e.target.value })}
            />
            <input
              className="input mono"
              value={o.port}
              onChange={e => upd(o.id, { port: e.target.value })}
            />
            <input
              className="input"
              value={o.weight}
              onChange={e => upd(o.id, { weight: e.target.value })}
            />
            <Tag kind={i === 0 ? 'pink' : 'def'}>{i === 0 ? '主源站' : `备 ${i}`}</Tag>
            <Tag kind="ok">
              <span className="dot" />
              UP
            </Tag>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => rmOrigin(o.id)}
              disabled={data.origins.length === 1}
            >
              <Icon name="trash" size={12} className="ico" />
            </Button>
          </div>
        ))}
      </div>

      <div className="divider-h mt-4 mb-3" />

      <SectionTitle title="健康检查" />
      <div className="row r-4 gap-3 mb-4">
        <Field label="探测协议">
          <select className="select">
            <option>HTTP</option>
            <option>HTTPS</option>
            <option>TCP</option>
          </select>
        </Field>
        <Field label="探测路径">
          <input
            className="input mono"
            value={data.healthPath}
            onChange={e => set({ healthPath: e.target.value })}
          />
        </Field>
        <Field label="探测间隔 (秒)">
          <input
            className="input"
            value={data.healthInterval}
            onChange={e => set({ healthInterval: Number(e.target.value) || 0 })}
          />
        </Field>
        <Field label="失败次数阈值">
          <input
            className="input"
            value={data.healthFails}
            onChange={e => set({ healthFails: Number(e.target.value) || 0 })}
          />
        </Field>
      </div>

      <SectionTitle title="转发选项" />
      <div className="row r-3 gap-3">
        <Field label="Host 头处理">
          <select
            className="select"
            value={data.hostRewrite}
            onChange={e => set({ hostRewrite: e.target.value as EditData['hostRewrite'] })}
          >
            <option value="keep">保留客户端 Host</option>
            <option value="origin">改写为源站 Host</option>
            <option value="custom">自定义</option>
          </select>
        </Field>
        <Field label="X-Forwarded-For">
          <select className="select">
            <option>追加客户端 IP</option>
            <option>覆盖为客户端 IP</option>
            <option>不修改</option>
          </select>
        </Field>
        <Field label="连接超时">
          <input className="input" defaultValue="30 秒" />
        </Field>
      </div>
    </>
  )
}

function ProtectSection({ data, set }: { data: EditData; set: (p: Partial<EditData>) => void }) {
  const MODULES: { k: string; l: string; ico: IconName; hits: number }[] = [
    { k: 'sqli', l: 'SQL 注入', ico: 'database', hits: 8420 },
    { k: 'xss', l: 'XSS', ico: 'fire', hits: 4109 },
    { k: 'csrf', l: 'CSRF', ico: 'lock', hits: 280 },
    { k: 'cc', l: 'CC 防护', ico: 'activity', hits: 11200 },
    { k: 'bot', l: 'Bot 管理', ico: 'crosshair', hits: 6180 },
    { k: 'upload', l: '文件上传检测', ico: 'database', hits: 132 },
    { k: 'api', l: 'API 安全', ico: 'flow', hits: 0 },
    { k: 'geo', l: '区域屏蔽', ico: 'globe', hits: 0 },
  ]
  const enabledCount = Object.values(data.modules).filter(Boolean).length

  return (
    <>
      <SectionTitle title="防护集群" />
      <div className="row gap-3 mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {CLUSTERS.map(c => (
          <RadioCard
            key={c.id}
            active={data.cluster === c.id}
            onClick={() => set({ cluster: c.id })}
            row
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="fw-700 text-0 fs-13">{c.name}</div>
              <div className="muted fs-11 mono">
                {c.id} · VIP {c.vip} · {c.nodes} 节点
              </div>
            </div>
            <Tag kind={c.state === 'ok' ? 'ok' : 'warn'}>
              <span className="dot" />
              {c.state === 'ok' ? '健康' : '降级'}
            </Tag>
          </RadioCard>
        ))}
      </div>

      <SectionTitle title="防护等级 & 策略模式" />
      <div className="row r-1-1 gap-3 mb-4">
        <div>
          <div className="muted fs-11 mb-2" style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
            防护等级
          </div>
          <div className="flex gap-2">
            {(
              [
                { v: 'low', l: '低', c: '#22d3ee', d: '基础规则集' },
                { v: 'medium', l: '中', c: '#f59e0b', d: '推荐 · 大部分场景' },
                { v: 'high', l: '高', c: '#ef4444', d: '严格 · 可能误报' },
              ] as const
            ).map(L => (
              <LevelCard
                key={L.v}
                active={data.level === L.v}
                color={L.c}
                label={L.l}
                desc={L.d}
                onClick={() => set({ level: L.v })}
              />
            ))}
          </div>
        </div>
        <div>
          <div className="muted fs-11 mb-2" style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
            策略模式
          </div>
          <div className="flex gap-2">
            {(
              [
                { v: 'block', l: '阻断模式', c: '#ef4444', d: '命中即拦截' },
                { v: 'observe', l: '观察模式', c: '#22d3ee', d: '仅记录不阻断' },
              ] as const
            ).map(M => (
              <LevelCard
                key={M.v}
                active={data.mode === M.v}
                color={M.c}
                label={M.l}
                desc={M.d}
                onClick={() => set({ mode: M.v })}
              />
            ))}
          </div>
        </div>
      </div>

      <SectionTitle
        title="启用模块"
        hint={`${enabledCount} / ${MODULES.length} 已启用 · 数字为近 24h 命中`}
      />
      <div className="row r-4 gap-2">
        {MODULES.map(m => {
          const on = data.modules[m.k]
          return (
            <div
              key={m.k}
              onClick={() => set({ modules: { ...data.modules, [m.k]: !on } })}
              style={{
                padding: 12,
                borderRadius: 10,
                border: '1px solid ' + (on ? 'var(--brand-1)' : 'var(--line)'),
                background: on ? 'rgba(168,85,247,.06)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon name={m.ico} size={15} style={{ color: on ? 'var(--brand-1)' : 'var(--text-3)' }} />
                <span
                  className="fw-600 fs-12 flex-1"
                  style={{ color: on ? 'var(--text-0)' : 'var(--text-2)' }}
                >
                  {m.l}
                </span>
                <span className={cn('toggle', on && 'on')} style={{ transform: 'scale(.8)' }} />
              </div>
              <div className="mono fs-11" style={{ color: on ? 'var(--brand-2)' : 'var(--text-3)' }}>
                {m.hits.toLocaleString()} 命中 / 24h
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function LevelCard({
  active,
  color,
  label,
  desc,
  onClick,
}: {
  active: boolean
  color: string
  label: string
  desc: string
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1,
        padding: 12,
        borderRadius: 10,
        border: '1px solid ' + (active ? color : 'var(--line)'),
        background: active ? hexA(color, 0.08) : 'transparent',
        cursor: 'pointer',
        textAlign: 'center',
      }}
    >
      <div
        className="fw-700"
        style={{
          fontSize: label.length <= 2 ? 18 : 14,
          color: active ? color : 'var(--text-0)',
        }}
      >
        {label}
      </div>
      <div className="muted fs-11 mt-2">{desc}</div>
    </div>
  )
}

function RulesSection({ site }: { site: Site }) {
  const navigate = useNavigate()
  const filtered = RULES.filter(r => r.scope.includes('全部') || r.scope.includes(site.name)).slice(
    0,
    5,
  )
  return (
    <>
      <SectionTitle
        title="本站点规则"
        hint="范围限定为该站点 · 在规则引擎中编辑全局规则"
        right={
          <div className="flex gap-2">
            <Button variant="line" size="sm" onClick={() => navigate('/policy')}>
              <Icon name="rules" size={11} className="ico" />
              规则引擎
            </Button>
            <Button variant="pri" size="sm">
              <Icon name="plus" size={11} className="ico" />
              新建规则
            </Button>
          </div>
        }
      />
      <table>
        <thead>
          <tr>
            <th>优先级</th>
            <th>规则名</th>
            <th>匹配字段</th>
            <th>动作</th>
            <th>命中</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(r => (
            <tr key={r.id}>
              <td>
                <code className="mono">#{String(r.priority).padStart(2, '0')}</code>
              </td>
              <td>
                <span className="tbl-link">{r.name}</span>
              </td>
              <td className="mono fs-11">{r.field}</td>
              <td>
                <Tag
                  kind={r.action === 'block' ? 'danger' : r.action === 'allow' ? 'ok' : 'warn'}
                >
                  {r.action === 'block'
                    ? '拦截'
                    : r.action === 'allow'
                      ? '放行'
                      : r.action === 'rate'
                        ? '限速'
                        : '挑战'}
                </Tag>
              </td>
              <td className="mono t-pink">{r.hits.toLocaleString()}</td>
              <td>
                <Tag kind={r.enabled ? 'ok' : 'def'}>{r.enabled ? '启用' : '禁用'}</Tag>
              </td>
              <td className="fs-12">
                <span className="tbl-link">编辑</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function AclSection({ data, set }: { data: EditData; set: (p: Partial<EditData>) => void }) {
  return (
    <>
      <SectionTitle title="访问控制" hint="本站点独立的黑白名单 · 优先级高于全局" />
      <div className="row r-1-1 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Tag kind="ok" lg>
              <span className="dot" />
              放行 / 白名单
            </Tag>
            <span className="muted fs-11">命中即跳过所有检测</span>
          </div>
          <textarea
            className="input mono"
            rows={8}
            value={data.aclAllow}
            onChange={e => set({ aclAllow: e.target.value })}
            placeholder="一行一条 · 支持 IP / CIDR / 国家代码"
            style={{ height: 'auto', padding: 12, fontSize: 12, lineHeight: 1.7, width: '100%' }}
          />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Tag kind="danger" lg>
              <span className="dot" />
              拦截 / 黑名单
            </Tag>
            <span className="muted fs-11">命中即 403 拦截</span>
          </div>
          <textarea
            className="input mono"
            rows={8}
            value={data.aclDeny}
            onChange={e => set({ aclDeny: e.target.value })}
            style={{ height: 'auto', padding: 12, fontSize: 12, lineHeight: 1.7, width: '100%' }}
          />
        </div>
      </div>

      <div className="divider-h mt-4 mb-3" />

      <SectionTitle title="速率限制" />
      <div className="row r-3 gap-3">
        <Field label="单 IP 限速">
          <input className="input mono" defaultValue="100 req/s" />
        </Field>
        <Field label="并发连接">
          <input className="input mono" defaultValue="20" />
        </Field>
        <Field label="超限动作">
          <select className="select">
            <option>限速 (Throttle)</option>
            <option>挑战 (Challenge)</option>
            <option>拦截 (Block)</option>
          </select>
        </Field>
      </div>
    </>
  )
}

function CacheSection() {
  const [on1, setOn1] = useState(true)
  const [on2, setOn2] = useState(true)
  const [on3, setOn3] = useState(false)
  const [on4, setOn4] = useState(true)
  const [on5, setOn5] = useState(false)
  return (
    <>
      <SectionTitle title="缓存策略" />
      <ToggleRow
        label="启用边缘缓存"
        desc="缓存静态资源以减轻源站压力"
        on={on1}
        onChange={setOn1}
      />
      <ToggleRow
        label="尊重源站 Cache-Control"
        desc="按源站返回的 max-age 缓存"
        on={on2}
        onChange={setOn2}
      />
      <ToggleRow
        label="缓存 4xx / 5xx 错误"
        desc="可减轻源站压力但延长错误恢复时间"
        on={on3}
        onChange={setOn3}
      />

      <div className="divider-h mt-3 mb-3" />

      <SectionTitle
        title="缓存规则"
        right={
          <Button variant="line" size="sm">
            <Icon name="plus" size={11} className="ico" />
            添加规则
          </Button>
        }
      />
      <table>
        <thead>
          <tr>
            <th>URI 模式</th>
            <th>缓存时长</th>
            <th>关键参数</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="mono">/static/*</td>
            <td className="mono">7d</td>
            <td className="mono muted">—</td>
            <td>
              <Tag kind="ok">启用</Tag>
            </td>
            <td className="fs-12">
              <span className="tbl-link">编辑</span>
            </td>
          </tr>
          <tr>
            <td className="mono">/api/v1/products</td>
            <td className="mono">5m</td>
            <td className="mono">category, page</td>
            <td>
              <Tag kind="ok">启用</Tag>
            </td>
            <td className="fs-12">
              <span className="tbl-link">编辑</span>
            </td>
          </tr>
          <tr>
            <td className="mono">*.jpg, *.png, *.svg</td>
            <td className="mono">30d</td>
            <td className="mono muted">—</td>
            <td>
              <Tag kind="ok">启用</Tag>
            </td>
            <td className="fs-12">
              <span className="tbl-link">编辑</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="divider-h mt-3 mb-3" />

      <SectionTitle title="性能优化" />
      <ToggleRow
        label="Gzip / Brotli 压缩"
        desc="文本资源自动压缩"
        on={on4}
        onChange={setOn4}
      />
      <ToggleRow label="HTTP/3 (QUIC)" desc="下一代传输协议" on={on5} onChange={setOn5} />
    </>
  )
}

function LogSection({ data, set }: { data: EditData; set: (p: Partial<EditData>) => void }) {
  return (
    <>
      <SectionTitle title="日志保留" />
      <div className="row r-3 gap-3 mb-4">
        <Field label="访问日志保留">
          <select className="select">
            <option>30 天</option>
            <option>90 天</option>
            <option>180 天</option>
            <option>365 天</option>
          </select>
        </Field>
        <Field label="攻击日志保留">
          <input
            className="input"
            value={data.logRetention}
            onChange={e => set({ logRetention: Number(e.target.value) || 0 })}
          />
        </Field>
        <Field label="采样率">
          <select className="select">
            <option>100% (全量)</option>
            <option>10%</option>
            <option>1%</option>
          </select>
        </Field>
      </div>

      <SectionTitle
        title="日志投递"
        right={
          <Button variant="line" size="sm">
            <Icon name="plus" size={11} className="ico" />
            添加目的地
          </Button>
        }
      />
      <table>
        <tbody>
          <tr>
            <td>
              <Tag kind="info">SLS</Tag>
            </td>
            <td className="mono fs-12">project/waf-prod/access</td>
            <td className="muted">每分钟批量推送</td>
            <td>
              <Tag kind="ok">
                <span className="dot" />
                正常
              </Tag>
            </td>
            <td className="fs-12">
              <span className="tbl-link">编辑</span>
            </td>
          </tr>
          <tr>
            <td>
              <Tag kind="pink">Kafka</Tag>
            </td>
            <td className="mono fs-12">kafka.internal:9092 / waf.events</td>
            <td className="muted">实时</td>
            <td>
              <Tag kind="ok">
                <span className="dot" />
                正常
              </Tag>
            </td>
            <td className="fs-12">
              <span className="tbl-link">编辑</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="divider-h mt-4 mb-3" />

      <SectionTitle title="本站点专属告警" />
      <ToggleRow
        label="邮件通知"
        desc="security@example.com, ops@example.com"
        on={data.notifyEmail}
        onChange={v => set({ notifyEmail: v })}
      />
      <ToggleRow
        label="钉钉 / 企业微信"
        desc="机器人 webhook · 已对接"
        on={data.notifyDing}
        onChange={v => set({ notifyDing: v })}
      />
      <ToggleRow
        label="短信"
        desc="运维负责人手机号"
        on={data.notifySms}
        onChange={v => set({ notifySms: v })}
      />
    </>
  )
}

function AuditSection() {
  const rows = [
    {
      t: '2026-05-17 15:30:12',
      u: 'admin',
      a: '更新防护策略',
      d: '防护等级 低 → 中',
      diff: 'level: "low" → "medium"',
    },
    {
      t: '2026-05-16 11:08:45',
      u: 'lisi',
      a: '添加源站',
      d: '新增源站 10.20.1.11:8080',
      diff: 'origins[+]: 10.20.1.11:8080 w=80',
    },
    {
      t: '2026-05-15 09:42:18',
      u: 'admin',
      a: '替换证书',
      d: "更新为 Let's Encrypt 自动续期",
      diff: 'cert.type: "upload" → "le"',
    },
    {
      t: '2026-05-12 14:55:30',
      u: 'admin',
      a: '启用模块',
      d: '启用 API 安全模块',
      diff: 'modules.api: false → true',
    },
    { t: '2026-04-12 10:00:00', u: 'admin', a: '创建站点', d: '初始接入', diff: '—' },
  ]
  return (
    <>
      <SectionTitle title="配置变更审计" hint="本站点的所有配置修改记录" />
      <div className="stack" style={{ gap: 0 }}>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              padding: '14px 0',
              borderBottom: '1px solid var(--line-2)',
              display: 'grid',
              gridTemplateColumns: '160px 90px 1fr 160px',
              gap: 14,
              alignItems: 'flex-start',
            }}
          >
            <div className="mono fs-11 t-brand">{r.t}</div>
            <div>
              <span className="fw-700 fs-12">{r.u}</span>
            </div>
            <div>
              <div className="fw-600 fs-13 text-0">{r.a}</div>
              <div className="muted fs-12 mt-2">{r.d}</div>
              <code
                className="mono fs-11"
                style={{
                  display: 'inline-block',
                  marginTop: 6,
                  background: 'var(--bg-0)',
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid var(--line)',
                }}
              >
                {r.diff}
              </code>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="tbl-link fs-12">回滚</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function DangerSection() {
  return (
    <>
      <div
        className="flex items-center gap-3 mb-4"
        style={{
          padding: 16,
          borderRadius: 12,
          background: 'rgba(239,68,68,.08)',
          border: '1px solid rgba(239,68,68,.3)',
        }}
      >
        <Icon name="alert" size={20} style={{ color: 'var(--danger)', flexShrink: 0 }} />
        <div>
          <div className="fw-700 fs-14" style={{ color: 'var(--danger)' }}>
            危险操作
          </div>
          <div className="muted fs-12 mt-2">以下操作可能影响业务可用性 · 请谨慎执行</div>
        </div>
      </div>

      <DangerRow title="清空攻击日志" desc="移除该站点的全部历史攻击日志 · 不可恢复" action="清空" />
      <DangerRow title="重置防护配置" desc="恢复为默认防护策略 · 自定义规则不变" action="重置" />
      <DangerRow
        title="暂停防护"
        desc="所有流量将直通源站 · 站点暴露在风险下 · 可随时恢复"
        action="暂停"
        severe
      />
      <DangerRow
        title="删除站点"
        desc="移除站点配置 · 解除 DNS 接管 · 日志保留 90 天"
        action="永久删除"
        severe
      />
    </>
  )
}

function DangerRow({
  title,
  desc,
  action,
  severe,
}: {
  title: string
  desc: string
  action: string
  severe?: boolean
}) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 10,
        border: '1px solid ' + (severe ? 'rgba(239,68,68,.25)' : 'var(--line)'),
        background: severe ? 'rgba(239,68,68,.03)' : 'transparent',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div style={{ flex: 1 }}>
        <div className="fw-700 fs-13" style={{ color: severe ? 'var(--danger)' : 'var(--text-0)' }}>
          {title}
        </div>
        <div className="muted fs-12 mt-2">{desc}</div>
      </div>
      <button
        className="btn"
        style={{
          background: severe ? 'rgba(239,68,68,.12)' : 'var(--bg-2)',
          color: severe ? 'var(--danger)' : 'var(--text-1)',
          border: '1px solid ' + (severe ? 'rgba(239,68,68,.4)' : 'var(--line)'),
        }}
      >
        {action}
      </button>
    </div>
  )
}

function SaveBar({
  dirty,
  saving,
  error,
  onDiscard,
  onSave,
}: {
  dirty: string[]
  saving: boolean
  error: string | null
  onDiscard: () => void
  onSave: () => Promise<void>
}) {
  if (dirty.length === 0) return null
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 'calc(var(--sidebar-w) + 28px)',
        right: 28,
        zIndex: 50,
        background: 'linear-gradient(180deg, rgba(20,16,32,.96), rgba(13,10,24,.96))',
        border: '1px solid var(--brand-1)',
        boxShadow: '0 16px 40px -8px rgba(0,0,0,.6), 0 0 30px -8px rgba(168,85,247,.5)',
        borderRadius: 14,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: 'rgba(245,158,11,.15)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--warn)',
          flexShrink: 0,
        }}
      >
        <Icon name="alert" size={16} />
      </div>
      <div style={{ flex: 1 }}>
        <div className="fw-700 fs-13" style={{ color: '#fff' }}>
          检测到 {dirty.length} 项未保存的变更
        </div>
        <div className="muted fs-11">
          字段:{' '}
          {dirty.slice(0, 4).map(k => (
            <code
              key={k}
              className="mono"
              style={{
                background: 'rgba(168,85,247,.15)',
                padding: '1px 6px',
                borderRadius: 4,
                marginRight: 4,
                color: 'var(--brand-1)',
              }}
            >
              {k}
            </code>
          ))}
          {dirty.length > 4 && <span className="muted">+{dirty.length - 4} 更多</span>}
        </div>
      </div>
      <Button variant="ghost" onClick={onDiscard} disabled={saving || dirty.length === 0}>
        丢弃变更
      </Button>
      <Button
        variant="pri"
        disabled={saving || dirty.length === 0}
        onClick={async () => {
          try {
            await onSave()
            window.alert(`已保存 ${dirty.length} 项变更`)
          } catch {
            /* error 已经在 onSave 内部 setSaveErr，下方红色条会显示 */
          }
        }}
      >
        <Icon name="check" size={13} className="ico" />
        {saving ? '保存中…' : '保存并应用'}
      </Button>
      {error && (
        <div
          className="fs-11"
          style={{
            position: 'absolute',
            top: -28,
            right: 24,
            padding: '4px 10px',
            background: 'rgba(239,68,68,.92)',
            color: '#fff',
            borderRadius: 4,
            maxWidth: 400,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={error}
        >
          保存失败：{error}
        </div>
      )}
    </div>
  )
}
