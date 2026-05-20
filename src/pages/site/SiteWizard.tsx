import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Icon, Tag, Button, Toggle, SectionHd, cn } from '@/components/ui'
import { CLUSTERS } from '@/mocks/nebula'
import { hexA } from '@/components/charts/canvasUtils'
import * as siteApi from '@/api/live/site'

interface Origin {
  id: number
  host: string
  port: string
  weight: string
  proto: 'http' | 'https'
}

interface WizardState {
  name: string
  domain: string
  aliases: string
  proto: 'https' | 'http' | 'both'
  port: string
  certType: 'upload' | 'le' | 'existing'
  httpRedirect: boolean
  http2: boolean
  origins: Origin[]
  healthPath: string
  healthInterval: number
  healthFails: number
  hostRewrite: 'keep' | 'origin' | 'custom'
  cluster: string
  level: 'low' | 'medium' | 'high'
  mode: 'block' | 'observe'
  modules: Record<string, boolean>
  project: string
  accepted: boolean
}

const STEPS = [
  { id: 0, label: '基本信息', ico: 'sites', hint: '站点身份 · 协议 · 证书' },
  { id: 1, label: '源站配置', ico: 'server', hint: '上游服务 · 健康检查' },
  { id: 2, label: '防护策略', ico: 'shield', hint: '集群 · 等级 · 模块' },
  { id: 3, label: '接入指引', ico: 'check', hint: 'DNS · 验证 · 启用' },
] as const

export default function SiteWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardState>({
    name: '',
    domain: '',
    aliases: '',
    proto: 'https',
    port: '443',
    certType: 'upload',
    httpRedirect: true,
    http2: true,
    origins: [{ id: 1, host: '', port: '8080', weight: '100', proto: 'http' }],
    healthPath: '/health',
    healthInterval: 5,
    healthFails: 3,
    hostRewrite: 'keep',
    cluster: CLUSTERS[0].id,
    level: 'medium',
    mode: 'block',
    modules: {
      sqli: true,
      xss: true,
      csrf: true,
      cc: true,
      bot: true,
      upload: true,
      api: false,
      geo: false,
    },
    project: '默认项目',
    accepted: false,
  })
  const set = (patch: Partial<WizardState>) => setData(d => ({ ...d, ...patch }))

  const [submitting, setSubmitting] = useState(false)
  const [submitErr, setSubmitErr] = useState<string | null>(null)

  const canNext = useMemo(() => {
    if (step === 0) return data.name.length > 0 && data.domain.length > 0
    if (step === 1) return data.origins.some(o => o.host.length > 0)
    if (step === 2) return true
    if (step === 3) return data.accepted
    return false
  }, [step, data])

  const back = () => {
    if (step === 0) navigate('/site')
    else setStep(s => s - 1)
  }

  // 真正把向导数据落库：把 origins 数组 → upstream JSON，模块开关 → description tag。
  const submitCreate = async () => {
    setSubmitting(true)
    setSubmitErr(null)
    try {
      const port =
        Number(data.port) || (data.proto === 'https' || data.proto === 'both' ? 443 : 80)
      const sslEnabled = data.proto === 'https' || data.proto === 'both'
      const enabledModules = Object.keys(data.modules).filter(k => data.modules[k])
      const aliases = data.aliases
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)

      // upstream JSON 与 site.repository 解析逻辑对齐：servers: [{host, port, weight, proto}]
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

      // 向导收集的元信息无对应后端字段，先塞进 description JSON 里，
      // 后续做站点详情时由 SiteEdit 反解读出来；后端不解析这些字段。
      const meta = {
        project: data.project,
        aliases,
        cluster: data.cluster,
        level: data.level,
        mode: data.mode,
        modules: enabledModules,
        http_redirect: data.httpRedirect,
        http2: data.http2,
      }

      await siteApi.createSite({
        name: data.name.trim(),
        domain: data.domain.trim(),
        listen_port: port,
        ssl_enabled: sslEnabled,
        upstream,
        waf_enabled: data.mode !== 'observe',
        description: JSON.stringify(meta),
      })
      navigate('/site')
    } catch (e: unknown) {
      setSubmitErr(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  const next = () => {
    if (step === 3) {
      if (data.accepted && !submitting) void submitCreate()
    } else if (canNext) {
      setStep(s => s + 1)
    }
  }

  return (
    <>
      <div className="page-hd">
        <div>
          <h1>
            <span className="ord">NW · 03 / NEW</span>
            接入新站点
          </h1>
          <p>
            将 4 步完成接入 · 全程预计 3 分钟 ·
            <span className="muted mono" style={{ marginLeft: 8 }}>
              站点 ID 将自动生成
            </span>
          </p>
        </div>
        <div className="actions">
          <Button variant="ghost" onClick={() => navigate('/site')}>
            <Icon name="x" size={13} className="ico" />
            取消接入
          </Button>
        </div>
      </div>

      <StepIndicator
        current={step}
        onJump={i => {
          if (i < step) setStep(i)
        }}
      />

      <div className="row r-2-1" style={{ marginTop: 18 }}>
        <div className="card" style={{ minHeight: 480 }}>
          <div className="card-bd" style={{ padding: '24px 28px' }}>
            {step === 0 && <Step1Basic data={data} set={set} />}
            {step === 1 && <Step2Origins data={data} set={set} />}
            {step === 2 && <Step3Protection data={data} set={set} />}
            {step === 3 && <Step4Activate data={data} set={set} />}
          </div>

          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-0)',
            }}
          >
            <Button variant="ghost" onClick={back}>
              <Icon name="chevron-right" size={13} style={{ transform: 'rotate(180deg)' }} className="ico" />
              {step === 0 ? '返回拓扑' : '上一步'}
            </Button>
            <div className="flex items-center gap-3">
              <span className="muted fs-12 mono">
                {step + 1} / {STEPS.length}
              </span>
              {step < 3 ? (
                <Button variant={canNext ? 'pri' : 'ghost'} onClick={next} disabled={!canNext}>
                  下一步 <Icon name="chevron-right" size={13} className="ico" />
                </Button>
              ) : (
                <Button
                  variant={data.accepted ? 'pri' : 'ghost'}
                  onClick={next}
                  disabled={!data.accepted || submitting}
                >
                  <Icon name="check" size={13} className="ico" />
                  {submitting ? '正在创建…' : '完成接入并启用'}
                </Button>
              )}
            </div>
          </div>
          {submitErr && (
            <div
              className="fs-12"
              style={{
                padding: '10px 24px',
                background: 'var(--bg-danger-1, #fee2e2)',
                color: 'var(--text-danger, #b91c1c)',
                borderTop: '1px solid var(--line)',
              }}
            >
              创建失败：{submitErr}
            </div>
          )}
        </div>

        <SidePreview data={data} step={step} />
      </div>
    </>
  )
}

function StepIndicator({ current, onJump }: { current: number; onJump: (i: number) => void }) {
  return (
    <div className="card bracketed" style={{ padding: '20px 24px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 18,
            left: `${100 / (STEPS.length * 2)}%`,
            right: `${100 / (STEPS.length * 2)}%`,
            height: 2,
            borderRadius: 2,
            background: 'var(--line)',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 18,
            left: `${100 / (STEPS.length * 2)}%`,
            width: current === 0 ? 0 : `${(current / (STEPS.length - 1)) * (100 - 100 / STEPS.length)}%`,
            height: 2,
            borderRadius: 2,
            background: 'var(--grad-brand)',
            boxShadow: '0 0 10px rgba(168,85,247,.6)',
            transition: 'width .3s ease',
            zIndex: 1,
          }}
        />

        {STEPS.map((s, i) => {
          const state = i < current ? 'done' : i === current ? 'active' : 'pending'
          return (
            <div
              key={s.id}
              onClick={() => onJump(i)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                position: 'relative',
                zIndex: 2,
                cursor: i < current ? 'pointer' : 'default',
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background:
                    state === 'pending'
                      ? 'var(--bg-2)'
                      : state === 'active'
                        ? 'var(--grad-brand)'
                        : 'rgba(168,85,247,.18)',
                  border: '1px solid ' + (state === 'pending' ? 'var(--line)' : 'var(--brand-1)'),
                  display: 'grid',
                  placeItems: 'center',
                  color:
                    state === 'pending'
                      ? 'var(--text-3)'
                      : state === 'active'
                        ? '#fff'
                        : 'var(--brand-1)',
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono',
                  boxShadow:
                    state === 'active'
                      ? '0 0 16px rgba(168,85,247,.55), inset 0 0 0 2px rgba(255,255,255,.15)'
                      : 'none',
                  transition: 'all .2s',
                }}
              >
                {state === 'done' ? <Icon name="check" size={16} /> : String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div
                  className="fw-700 fs-13"
                  style={{ color: state === 'pending' ? 'var(--text-3)' : 'var(--text-0)' }}
                >
                  {s.label}
                </div>
                <div className="muted fs-11">{s.hint}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Step1Basic({ data, set }: { data: WizardState; set: (p: Partial<WizardState>) => void }) {
  return (
    <>
      <SectionHd title="站点身份" ico="sites" hint="用于在控制台中识别该站点" />
      <div className="row r-1-1 gap-3 mb-4">
        <div className="field">
          <label>站点名称 *</label>
          <input
            className="input"
            placeholder="例: 官网主站 / 支付服务"
            value={data.name}
            onChange={e => set({ name: e.target.value })}
          />
        </div>
        <div className="field">
          <label>所属项目</label>
          <select className="select" value={data.project} onChange={e => set({ project: e.target.value })}>
            <option>默认项目</option>
            <option>项目 A — 主业务</option>
            <option>项目 B — 支付</option>
          </select>
        </div>
      </div>

      <SectionHd title="域名 & 协议" ico="globe" hint="支持泛域名 *.example.com" />
      <div className="field mb-3">
        <label>主域名 *</label>
        <input
          className="input"
          placeholder="如 www.example.com"
          value={data.domain}
          onChange={e => set({ domain: e.target.value })}
        />
      </div>
      <div className="field mb-4">
        <label>域名别名（多个用逗号分隔，可选）</label>
        <input
          className="input"
          placeholder="m.example.com, example.com, *.example.com"
          value={data.aliases}
          onChange={e => set({ aliases: e.target.value })}
        />
      </div>

      <div className="row r-3 gap-3 mb-4">
        <div className="field">
          <label>协议</label>
          <div className="flex gap-2">
            {(['https', 'http', 'both'] as const).map(p => (
              <ProtoChip key={p} value={p} cur={data.proto} onClick={() => set({ proto: p })} />
            ))}
          </div>
        </div>
        <div className="field">
          <label>监听端口</label>
          <input className="input" value={data.port} onChange={e => set({ port: e.target.value })} />
        </div>
        <div className="field">
          <label>HTTP → HTTPS 重定向</label>
          <div className="flex items-center gap-3" style={{ height: 34 }}>
            <Toggle on={data.httpRedirect} onChange={v => set({ httpRedirect: v })} />
            <span className="muted fs-12">301 重定向</span>
          </div>
        </div>
      </div>

      {data.proto !== 'http' && (
        <>
          <SectionHd title="TLS 证书" ico="lock" hint="HTTPS 必填" />
          <div className="row r-3 gap-3">
            {(
              [
                { v: 'upload', l: '上传证书', d: 'PEM / KEY 文件' },
                { v: 'le', l: "Let's Encrypt", d: '自动签发与续期' },
                { v: 'existing', l: '已有证书', d: '从证书库选择' },
              ] as const
            ).map(c => (
              <div
                key={c.v}
                onClick={() => set({ certType: c.v })}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  border: '1px solid ' + (data.certType === c.v ? 'var(--brand-1)' : 'var(--line)'),
                  background: data.certType === c.v ? 'rgba(168,85,247,.06)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      border:
                        '2px solid ' + (data.certType === c.v ? 'var(--brand-1)' : 'var(--line-strong)'),
                      background: data.certType === c.v ? 'var(--brand-1)' : 'transparent',
                      boxShadow: data.certType === c.v ? 'inset 0 0 0 3px var(--bg-1)' : 'none',
                    }}
                  />
                  <span className="fw-700 fs-13 text-0">{c.l}</span>
                </div>
                <div className="muted fs-11">{c.d}</div>
              </div>
            ))}
          </div>

          <div className="row r-1-1 gap-3 mt-4">
            <div className="field">
              <label>启用 HTTP/2</label>
              <div className="flex items-center gap-3" style={{ height: 34 }}>
                <Toggle on={data.http2} onChange={v => set({ http2: v })} />
                <span className="muted fs-12">推荐启用</span>
              </div>
            </div>
            <div className="field">
              <label>最低 TLS 版本</label>
              <select className="select">
                <option>TLS 1.2</option>
                <option>TLS 1.3</option>
              </select>
            </div>
          </div>
        </>
      )}
    </>
  )
}

function ProtoChip({
  value,
  cur,
  onClick,
}: {
  value: 'https' | 'http' | 'both'
  cur: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 8,
        border: '1px solid ' + (cur === value ? 'var(--brand-1)' : 'var(--line)'),
        background: cur === value ? 'rgba(168,85,247,.10)' : 'var(--bg-2)',
        color: cur === value ? 'var(--brand-1)' : 'var(--text-1)',
        fontWeight: cur === value ? 700 : 500,
        fontFamily: 'JetBrains Mono',
        fontSize: 12,
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
      }}
    >
      {value === 'both' ? 'HTTPS + HTTP' : value}
    </button>
  )
}

function Step2Origins({ data, set }: { data: WizardState; set: (p: Partial<WizardState>) => void }) {
  const addOrigin = () =>
    set({
      origins: [...data.origins, { id: Date.now(), host: '', port: '8080', weight: '100', proto: 'http' }],
    })
  const removeOrigin = (id: number) => set({ origins: data.origins.filter(o => o.id !== id) })
  const updateOrigin = (id: number, patch: Partial<Origin>) =>
    set({ origins: data.origins.map(o => (o.id === id ? { ...o, ...patch } : o)) })

  return (
    <>
      <SectionHd
        title="上游源站"
        ico="server"
        hint="可添加多个源站，支持加权轮询和故障转移"
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
              gridTemplateColumns: '110px 1fr 110px 110px 90px 36px',
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
              onChange={e => updateOrigin(o.id, { proto: e.target.value as Origin['proto'] })}
            >
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
            </select>
            <input
              className="input"
              placeholder="源站 IP 或域名 (如 10.20.1.10)"
              value={o.host}
              onChange={e => updateOrigin(o.id, { host: e.target.value })}
            />
            <input
              className="input"
              placeholder="端口"
              value={o.port}
              onChange={e => updateOrigin(o.id, { port: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder="权重"
                value={o.weight}
                onChange={e => updateOrigin(o.id, { weight: e.target.value })}
              />
              <span className="muted fs-11">%</span>
            </div>
            <Tag kind={i === 0 ? 'pink' : 'def'}>{i === 0 ? '主源站' : `备 ${i}`}</Tag>
            <Button variant="ghost" size="sm" onClick={() => removeOrigin(o.id)} disabled={data.origins.length === 1}>
              <Icon name="trash" size={12} className="ico" />
            </Button>
          </div>
        ))}
      </div>

      <div className="divider-h mt-4 mb-4" />

      <SectionHd title="健康检查" ico="pulse" hint="主动探测源站状态，异常时自动剔除" />
      <div className="row r-4 gap-3 mb-4">
        <div className="field">
          <label>探测协议</label>
          <select className="select">
            <option>HTTP</option>
            <option>HTTPS</option>
            <option>TCP</option>
          </select>
        </div>
        <div className="field">
          <label>探测路径</label>
          <input
            className="input"
            value={data.healthPath}
            onChange={e => set({ healthPath: e.target.value })}
          />
        </div>
        <div className="field">
          <label>探测间隔 (秒)</label>
          <input
            className="input"
            value={data.healthInterval}
            onChange={e => set({ healthInterval: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="field">
          <label>失败次数阈值</label>
          <input
            className="input"
            value={data.healthFails}
            onChange={e => set({ healthFails: Number(e.target.value) || 0 })}
          />
        </div>
      </div>

      <SectionHd title="转发选项" ico="flow" />
      <div className="row r-3 gap-3">
        <div className="field">
          <label>Host 头处理</label>
          <select
            className="select"
            value={data.hostRewrite}
            onChange={e => set({ hostRewrite: e.target.value as WizardState['hostRewrite'] })}
          >
            <option value="keep">保留客户端 Host</option>
            <option value="origin">改写为源站 Host</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        <div className="field">
          <label>转发模式</label>
          <select className="select">
            <option>反向代理（推荐）</option>
            <option>透明代理</option>
          </select>
        </div>
        <div className="field">
          <label>连接超时</label>
          <input className="input" defaultValue="30 秒" />
        </div>
      </div>
    </>
  )
}

function Step3Protection({
  data,
  set,
}: {
  data: WizardState
  set: (p: Partial<WizardState>) => void
}) {
  const MODULES: { k: string; l: string; ico: 'database' | 'fire' | 'lock' | 'activity' | 'crosshair' | 'flow' | 'globe' }[] = [
    { k: 'sqli', l: 'SQL 注入', ico: 'database' },
    { k: 'xss', l: 'XSS', ico: 'fire' },
    { k: 'csrf', l: 'CSRF', ico: 'lock' },
    { k: 'cc', l: 'CC 防护', ico: 'activity' },
    { k: 'bot', l: 'Bot 管理', ico: 'crosshair' },
    { k: 'upload', l: '文件上传检测', ico: 'database' },
    { k: 'api', l: 'API 安全', ico: 'flow' },
    { k: 'geo', l: '区域屏蔽', ico: 'globe' },
  ]
  const enabledCount = Object.values(data.modules).filter(Boolean).length

  return (
    <>
      <SectionHd title="防护集群" ico="topology" hint="选择负责处理该站点流量的 WAF 集群" />
      <div className="row gap-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {CLUSTERS.map(c => (
          <div
            key={c.id}
            onClick={() => set({ cluster: c.id })}
            style={{
              padding: 14,
              borderRadius: 10,
              border: '1px solid ' + (data.cluster === c.id ? 'var(--brand-1)' : 'var(--line)'),
              background: data.cluster === c.id ? 'rgba(168,85,247,.06)' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: '2px solid ' + (data.cluster === c.id ? 'var(--brand-1)' : 'var(--line-strong)'),
                background: data.cluster === c.id ? 'var(--brand-1)' : 'transparent',
                boxShadow: data.cluster === c.id ? 'inset 0 0 0 3px var(--bg-1)' : 'none',
                flexShrink: 0,
              }}
            />
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
          </div>
        ))}
      </div>

      <div className="divider-h mt-4 mb-4" />

      <SectionHd title="防护等级 & 模式" ico="shield" />
      <div className="row r-1-1 gap-3 mb-4">
        <div>
          <div
            className="muted fs-11 mb-2"
            style={{ letterSpacing: 1, textTransform: 'uppercase' }}
          >
            防护等级
          </div>
          <div className="flex gap-2">
            {(
              [
                { v: 'low', l: '低', d: '基础规则集', c: '#22d3ee' },
                { v: 'medium', l: '中', d: '推荐 · 覆盖大部分常见攻击', c: '#f59e0b' },
                { v: 'high', l: '高', d: '严格 · 可能误报', c: '#ef4444' },
              ] as const
            ).map(L => (
              <div
                key={L.v}
                onClick={() => set({ level: L.v })}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid ' + (data.level === L.v ? L.c : 'var(--line)'),
                  background: data.level === L.v ? hexA(L.c, 0.08) : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div
                  className="fw-700 fs-16"
                  style={{ color: data.level === L.v ? L.c : 'var(--text-0)' }}
                >
                  {L.l}
                </div>
                <div className="muted fs-11 mt-2">{L.d}</div>
              </div>
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
                { v: 'block', l: '阻断模式', d: '命中规则立即拦截', c: '#ef4444' },
                { v: 'observe', l: '观察模式', d: '仅记录不拦截 · 调试用', c: '#22d3ee' },
              ] as const
            ).map(M => (
              <div
                key={M.v}
                onClick={() => set({ mode: M.v })}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid ' + (data.mode === M.v ? M.c : 'var(--line)'),
                  background: data.mode === M.v ? hexA(M.c, 0.08) : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div
                  className="fw-700 fs-14"
                  style={{ color: data.mode === M.v ? M.c : 'var(--text-0)' }}
                >
                  {M.l}
                </div>
                <div className="muted fs-11 mt-2">{M.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionHd
        title="启用模块"
        ico="grid"
        hint={`${enabledCount} / ${MODULES.length} 已启用`}
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
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Icon
                name={m.ico}
                size={16}
                style={{ color: on ? 'var(--brand-1)' : 'var(--text-3)' }}
              />
              <span
                className="fw-600 fs-13 flex-1"
                style={{ color: on ? 'var(--text-0)' : 'var(--text-2)' }}
              >
                {m.l}
              </span>
              <span className={cn('toggle', on && 'on')} style={{ transform: 'scale(.85)' }} />
            </div>
          )
        })}
      </div>
    </>
  )
}

function Step4Activate({
  data,
  set,
}: {
  data: WizardState
  set: (p: Partial<WizardState>) => void
}) {
  const cname = `${(data.name || 'site').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'site'}.nebulawaf.example.cn`
  const domains = [
    data.domain,
    ...(data.aliases
      ? data.aliases
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      : []),
  ].filter(Boolean)

  return (
    <>
      <div
        className="flex items-center gap-3 mb-4"
        style={{
          padding: 16,
          borderRadius: 12,
          background:
            'linear-gradient(135deg, rgba(168,85,247,.10), rgba(236,72,153,.06) 60%, rgba(245,158,11,.05))',
          border: '1px solid var(--line-strong)',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'var(--grad-brand)',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
          }}
        >
          <Icon name="sparkles" size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="fw-700 text-0 fs-15">配置已就绪 · 仅剩最后一步</div>
          <div className="muted fs-12 mt-2">
            请在你的 DNS 服务商添加下方 CNAME 记录，待生效后即可正式开启防护。
          </div>
        </div>
      </div>

      <SectionHd title="DNS 接入指引" ico="globe" />
      <div className="card" style={{ background: 'var(--bg-0)', borderColor: 'var(--line)', marginBottom: 16 }}>
        <div style={{ padding: 14 }}>
          <div className="muted fs-11 mb-3" style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
            添加以下 CNAME 记录到 DNS 服务商
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '110px 1fr 1fr 36px',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div className="muted fs-11">类型</div>
            <div className="muted fs-11">主机记录</div>
            <div className="muted fs-11">记录值</div>
            <div />
          </div>
          {domains.length === 0 && <div className="muted fs-12">未填写域名 · 请返回第 1 步</div>}
          {domains.map((d, i) => (
            <DnsRow key={i} domain={d} target={cname} />
          ))}
        </div>
      </div>

      <SectionHd title="接入验证" ico="check" />
      <div className="card" style={{ background: 'var(--bg-0)', borderColor: 'var(--line)', marginBottom: 16 }}>
        <div style={{ padding: 14 }}>
          {[
            { l: 'DNS 解析校验', d: '检查 CNAME 是否生效 · 全球节点', state: 'wait' },
            { l: '源站连通性', d: '校验源站可达且响应正常', state: 'ok' },
            { l: '证书校验', d: '匹配 SAN · 链完整性', state: 'ok' },
            { l: '试运行 (Dry-run)', d: '镜像 1% 流量验证规则无误报', state: 'wait' },
          ].map(c => (
            <div
              key={c.l}
              className="flex items-center gap-3"
              style={{ padding: '10px 0', borderBottom: '1px solid var(--line-2)' }}
            >
              <Tag kind={c.state === 'ok' ? 'ok' : 'warn'} lg>
                <span className="dot" />
                {c.state === 'ok' ? '通过' : '待验证'}
              </Tag>
              <div style={{ flex: 1 }}>
                <div className="fw-600 text-0 fs-13">{c.l}</div>
                <div className="muted fs-11">{c.d}</div>
              </div>
              <Button variant="ghost" size="sm">
                {c.state === 'ok' ? '重新校验' : '立即检测'}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: 14,
          borderRadius: 10,
          background: data.accepted ? 'rgba(16,185,129,.06)' : 'rgba(245,158,11,.06)',
          border: '1px solid ' + (data.accepted ? 'rgba(16,185,129,.3)' : 'rgba(245,158,11,.3)'),
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: data.accepted ? 'var(--ok)' : 'transparent',
            border: '1.5px solid ' + (data.accepted ? 'var(--ok)' : 'var(--warn)'),
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            color: '#fff',
            flexShrink: 0,
          }}
          onClick={() => set({ accepted: !data.accepted })}
        >
          {data.accepted && <Icon name="check" size={14} />}
        </span>
        <div style={{ flex: 1 }}>
          <div className="fw-700 text-0 fs-13">我已添加 DNS 记录并确认配置正确</div>
          <div className="muted fs-11">
            勾选后将创建站点。
            {data.mode === 'observe'
              ? '当前为观察模式，命中规则只记录不拦截。'
              : '当前为阻断模式，将立即生效。'}
          </div>
        </div>
      </div>
    </>
  )
}

function DnsRow({ domain, target }: { domain: string; target: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(target)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr 1fr 36px',
        gap: 8,
        alignItems: 'center',
        padding: '8px 0',
        borderTop: '1px solid var(--line-2)',
      }}
    >
      <Tag kind="info">CNAME</Tag>
      <code
        className="mono fs-12"
        style={{
          background: 'var(--bg-1)',
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid var(--line)',
          color: 'var(--text-0)',
        }}
      >
        {domain}
      </code>
      <code
        className="mono fs-12"
        style={{
          background: 'var(--bg-1)',
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid var(--line)',
          color: 'var(--brand-1)',
        }}
      >
        {target}
      </code>
      <Button variant="ghost" size="sm" onClick={copy}>
        <Icon name={copied ? 'check' : 'logs'} size={12} className="ico" />
      </Button>
    </div>
  )
}

function SidePreview({ data, step }: { data: WizardState; step: number }) {
  const json = useMemo(() => {
    const out: Record<string, unknown> = {}
    out.name = data.name || '<待填写>'
    out.domain = data.domain || '<待填写>'
    if (data.aliases) out.aliases = data.aliases.split(',').map(s => s.trim()).filter(Boolean)
    out.protocol = data.proto
    out.port = Number(data.port)
    out.certificate = data.certType
    if (step >= 1) {
      out.upstream = {
        origins: data.origins
          .filter(o => o.host)
          .map(o => `${o.proto}://${o.host}:${o.port} weight=${o.weight}`),
        health: {
          path: data.healthPath,
          interval: data.healthInterval + 's',
          threshold: data.healthFails,
        },
      }
    }
    if (step >= 2) {
      out.protection = {
        cluster: data.cluster,
        level: data.level,
        mode: data.mode,
        modules: Object.keys(data.modules).filter(k => data.modules[k]),
      }
    }
    return out
  }, [data, step])

  const tips: Record<number, { i: 'info' | 'warn'; t: string; d: string }[]> = {
    0: [
      { i: 'info', t: '泛域名', d: '使用 *.example.com 可一次覆盖所有子域' },
      { i: 'info', t: 'HTTP/2', d: '默认启用，可显著提升加载性能' },
      { i: 'warn', t: "Let's Encrypt", d: '签发前需 DNS 已生效，否则可能失败' },
    ],
    1: [
      { i: 'info', t: '加权轮询', d: '权重之和不必为 100，会按比例分配' },
      { i: 'info', t: '健康检查', d: '探测频率越高越精准，但占用源站资源' },
      { i: 'warn', t: 'Host 头', d: '若源站有虚拟主机，请保留客户端 Host' },
    ],
    2: [
      { i: 'info', t: '观察模式', d: '建议新站点先观察 24h，确认无误报后再切阻断' },
      { i: 'warn', t: '高等级', d: '可能拦截合法请求，请配合白名单使用' },
      { i: 'info', t: '模块组合', d: 'CC + Bot + API 推荐同时启用以应对自动化攻击' },
    ],
    3: [
      { i: 'info', t: 'TTL', d: '将 DNS TTL 调至 60-300s 可加速切换' },
      { i: 'info', t: '回退', d: '若发现问题，可在站点列表中切换至"观察模式"' },
      { i: 'warn', t: '验证', d: '建议先用单一子域试点，验证无误后再全量切换' },
    ],
  }

  return (
    <div className="stack">
      <div className="card" style={{ background: 'var(--bg-0)' }}>
        <div className="card-hd">
          <h3>
            <Icon name="sparkles" size={14} />
            配置预览
          </h3>
          <Tag kind="pink">
            <span className="dot" />
            LIVE
          </Tag>
        </div>
        <pre
          className="mono"
          style={{
            padding: 14,
            margin: 0,
            fontSize: 11.5,
            lineHeight: 1.7,
            color: 'var(--text-1)',
            overflow: 'auto',
            maxHeight: 320,
          }}
        >
          {Object.entries(json).map(([k, v]) => (
            <span key={k}>
              <span style={{ color: 'var(--brand-1)' }}>{k}</span>
              <span style={{ color: 'var(--text-3)' }}>:</span>{' '}
              <span style={{ color: typeof v === 'string' ? 'var(--brand-2)' : 'var(--text-0)' }}>
                {typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}
              </span>
              {'\n'}
            </span>
          ))}
        </pre>
      </div>

      <Card title="提示" ico="alert" meta={`步骤 ${step + 1}/4`}>
        <div className="stack" style={{ gap: 10 }}>
          {tips[step].map((t, i) => (
            <div key={i} className="flex items-start gap-2">
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  background: t.i === 'warn' ? 'rgba(245,158,11,.15)' : 'rgba(34,211,238,.15)',
                  color: t.i === 'warn' ? 'var(--warn)' : 'var(--info)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <Icon name={t.i === 'warn' ? 'alert' : 'sparkles'} size={11} />
              </span>
              <div style={{ flex: 1 }}>
                <div className="fw-600 fs-12 text-0">{t.t}</div>
                <div className="muted fs-11" style={{ lineHeight: 1.5 }}>
                  {t.d}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {step === 3 && (
        <Card title="预期效果" ico="activity">
          <div className="row r-1-1 gap-3" style={{ textAlign: 'center' }}>
            <div>
              <div className="mono fw-700 fs-20 t-brand">~2 ms</div>
              <div className="muted fs-11">额外延迟</div>
            </div>
            <div>
              <div className="mono fw-700 fs-20 t-pink">
                {data.level === 'high' ? '99.5%' : data.level === 'medium' ? '98%' : '92%'}
              </div>
              <div className="muted fs-11">拦截覆盖</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
