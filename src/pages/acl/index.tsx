import { Card, Icon, KPI, Tag, Button, Toggle } from '@/components/ui'
import type { Alert } from '@/mocks/nebula'
import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import * as alertApi from '@/api/live/alert'
import type { Channel, ChannelKind } from '@/api/live/alert'
import AlertPolicy from './AlertPolicy'

const CHANNEL_META: Record<
  ChannelKind,
  { label: string; placeholder: string; description: string }
> = {
  email: { label: '邮件', placeholder: 'admin@cloudwall.local', description: '收件人，多个用逗号' },
  wechat: { label: '企业微信', placeholder: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/...', description: '机器人 webhook URL' },
  dingtalk: { label: '钉钉', placeholder: 'https://oapi.dingtalk.com/robot/send?access_token=...', description: '机器人 webhook URL' },
  pagerduty: { label: 'PagerDuty', placeholder: 'service-routing-key', description: 'Events V2 routing key' },
  webhook: { label: 'Webhook', placeholder: 'https://hooks.example.com/...', description: '通用 webhook URL' },
  sms: { label: '短信', placeholder: '+86-1380000xxxx', description: '运维负责人手机号' },
}

function AlertsPage() {
  const nav = useNavigate()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<alertApi.AlertStats | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [kinds, setKinds] = useState<ChannelKind[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddChannel, setShowAddChannel] = useState(false)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    const [aRes, sRes, cRes] = await Promise.allSettled([
      alertApi.listAlerts(),
      alertApi.alertStats(),
      alertApi.listAlertChannels(),
    ])
    if (aRes.status === 'fulfilled') setAlerts(aRes.value)
    if (sRes.status === 'fulfilled') setStats(sRes.value)
    if (cRes.status === 'fulfilled') {
      setChannels(cRes.value.channels)
      setKinds(cRes.value.kinds)
    }
    const errs = [aRes, sRes, cRes].filter(r => r.status === 'rejected') as PromiseRejectedResult[]
    if (errs.length > 0) {
      setError(errs.map(e => (e.reason instanceof Error ? e.reason.message : String(e.reason))).join('; '))
    }
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const kpi = useMemo(() => {
    if (stats) return stats
    // 从 alerts 派生（后端没 stats 端点时也能算）
    const open = alerts.filter(a => a.status === 'open').length
    const ack = alerts.filter(a => a.status === 'ack').length
    const closed = alerts.filter(a => a.status === 'closed').length
    return { open, ack, closed, today: alerts.length }
  }, [alerts, stats])

  const markAll = async () => {
    if (!window.confirm(`确认把全部 ${kpi.open} 条未处理告警标记为已读？`)) return
    try {
      await alertApi.markAllAlertsRead()
      await refresh()
    } catch (e: unknown) {
      window.alert(`操作失败：${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const updateAlert = async (a: Alert, status: Alert['status']) => {
    const prev = alerts
    setAlerts(prev.map(x => (x.id === a.id ? { ...x, status, ack: status === 'ack' } : x)))
    try {
      await alertApi.setAlertStatus(a.id, status)
    } catch (e: unknown) {
      window.alert(`状态更新失败：${e instanceof Error ? e.message : String(e)}`)
      setAlerts(prev)
    }
  }

  const toggleChannel = async (c: Channel) => {
    const next = !c.is_enabled
    setChannels(prev => prev.map(x => (x.id === c.id ? { ...x, is_enabled: next } : x)))
    try {
      await alertApi.updateAlertChannel(c.id, { is_enabled: next })
    } catch (e: unknown) {
      window.alert(`切换失败：${e instanceof Error ? e.message : String(e)}`)
      setChannels(prev => prev.map(x => (x.id === c.id ? { ...x, is_enabled: c.is_enabled } : x)))
    }
  }

  const testChannel = async (c: Channel) => {
    try {
      await alertApi.testAlertChannel(c.id)
      window.alert(`测试通知已发送给『${c.name}』，请到对应渠道查看`)
    } catch (e: unknown) {
      window.alert(`测试失败：${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const deleteChannel = async (c: Channel) => {
    if (!window.confirm(`删除告警渠道『${c.name}』？`)) return
    try {
      await alertApi.deleteAlertChannel(c.id)
      await refresh()
    } catch (e: unknown) {
      window.alert(`删除失败：${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <>
      <div className="page-hd">
        <div>
          <h1>
            <span className="ord">NW · 07</span>
            告警中心
          </h1>
          <p>实时安全 + 资源告警 · 多渠道分发 · 工单联动</p>
        </div>
        <div className="actions">
          <Button variant="ghost" onClick={() => nav('/acl/policy')}>
            <Icon name="settings" size={13} className="ico" />
            告警策略
          </Button>
          <Button variant="line" onClick={markAll} disabled={loading || kpi.open === 0}>
            全部已读
          </Button>
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

      <div className="kpi-grid">
        <KPI label="未处理告警" value={String(kpi.open)} ico="alert" kind="danger" />
        <KPI label="处理中" value={String(kpi.ack)} ico="refresh" kind="warn" />
        <KPI label="今日已闭环" value={String(kpi.closed)} ico="check" kind="ok" />
        <KPI label="共" value={String(kpi.today)} ico="pulse" kind="info" />
      </div>

      <Card
        title="活跃告警列表"
        ico="alert"
        meta={loading ? '加载中…' : `${alerts.length} 条`}
        bodyClass="np"
      >
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>级别</th>
              <th>类型</th>
              <th>目标</th>
              <th>详情</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={7}
                  className="muted fs-12"
                  style={{ padding: '32px 0', textAlign: 'center' }}
                >
                  暂无告警
                </td>
              </tr>
            )}
            {alerts.map(a => (
              <tr key={a.id}>
                <td className="mono fs-12">{a.t}</td>
                <td>
                  <Tag
                    kind={a.level === 'critical' ? 'danger' : a.level === 'warn' ? 'warn' : 'info'}
                    lg
                  >
                    <span className="dot" />
                    {a.level === 'critical' ? '严重' : a.level === 'warn' ? '警告' : '信息'}
                  </Tag>
                </td>
                <td className="fw-600">{a.kind}</td>
                <td className="mono fs-12 muted">{a.site}</td>
                <td>{a.msg}</td>
                <td>
                  <Tag kind={a.status === 'open' ? 'danger' : a.status === 'ack' ? 'warn' : 'def'}>
                    {a.status === 'open' ? '未处理' : a.status === 'ack' ? '处理中' : '已闭环'}
                  </Tag>
                </td>
                <td className="fs-12">
                  {a.status === 'open' && (
                    <>
                      <span
                        className="tbl-link"
                        style={{ cursor: 'pointer' }}
                        onClick={() => updateAlert(a, 'ack')}
                      >
                        认领
                      </span>
                      {' · '}
                    </>
                  )}
                  {a.status !== 'closed' && (
                    <>
                      <span
                        className="tbl-link"
                        style={{ cursor: 'pointer', color: 'var(--ok)' }}
                        onClick={() => updateAlert(a, 'closed')}
                      >
                        闭环
                      </span>
                      {' · '}
                    </>
                  )}
                  <span
                    className="tbl-link"
                    style={{ cursor: 'pointer', color: 'var(--text-3)' }}
                    onClick={() => updateAlert(a, 'closed')}
                  >
                    忽略
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="row r-1-1 mt-4">
        <Card
          title="告警通知渠道"
          ico="bell"
          meta={`${channels.length} 个`}
          actions={
            <Button variant="line" size="sm" onClick={() => setShowAddChannel(true)}>
              <Icon name="plus" size={11} className="ico" /> 添加渠道
            </Button>
          }
        >
          {channels.length === 0 && (
            <div className="muted fs-12" style={{ padding: '20px 0', textAlign: 'center' }}>
              暂无告警渠道，点右上『添加渠道』创建第一个
            </div>
          )}
          {channels.map(c => (
            <div
              key={c.id}
              className="flex items-center"
              style={{ padding: '10px 0', borderBottom: '1px solid var(--line-2)' }}
            >
              <div className="flex-1" style={{ minWidth: 0 }}>
                <div className="fw-600 text-0 fs-13">
                  {CHANNEL_META[c.kind]?.label ?? c.kind} · {c.name}
                </div>
                <div
                  className="muted fs-11 mono"
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={c.target}
                >
                  {c.target}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="tbl-link fs-11"
                  style={{ cursor: 'pointer' }}
                  onClick={() => testChannel(c)}
                >
                  测试
                </span>
                <span
                  className="tbl-link fs-11"
                  style={{ cursor: 'pointer', color: 'var(--danger)' }}
                  onClick={() => deleteChannel(c)}
                >
                  删除
                </span>
                <Toggle on={c.is_enabled} onChange={() => toggleChannel(c)} />
              </div>
            </div>
          ))}
        </Card>

        <Card title="告警策略" ico="sliders" meta="阈值 / 抑制 / 升级">
          <div className="muted fs-12 mb-3">
            告警策略 schema 设计中。当前内置 5 条系统级策略，点右上『告警策略』管理详细规则。
          </div>
          <table>
            <tbody>
              {[
                ['CC 攻击突增 ≥ 300%', '5 分钟', '严重', '运维 + CTO'],
                ['CPU > 85% 持续', '5 分钟', '警告', '运维'],
                ['实例离线', '即时', '严重', '运维 + 平台组'],
                ['证书 ≤ 7 天到期', '每日', '警告', '安全'],
                ['许可证 ≤ 30 天到期', '每日', '信息', '管理员'],
              ].map(r => (
                <tr key={r[0]}>
                  <td className="fw-600 fs-12">{r[0]}</td>
                  <td className="mono fs-11 muted">{r[1]}</td>
                  <td>
                    <Tag kind={r[2] === '严重' ? 'danger' : r[2] === '警告' ? 'warn' : 'info'}>
                      {r[2]}
                    </Tag>
                  </td>
                  <td className="fs-12 muted">{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {showAddChannel && (
        <AddChannelModal
          kinds={kinds}
          onCancel={() => setShowAddChannel(false)}
          onSubmit={async payload => {
            await alertApi.createAlertChannel(payload)
            setShowAddChannel(false)
            await refresh()
          }}
        />
      )}
    </>
  )
}

function AddChannelModal(props: {
  kinds: ChannelKind[]
  onCancel: () => void
  onSubmit: (payload: alertApi.SaveChannelPayload) => Promise<void>
}) {
  const [kind, setKind] = useState<ChannelKind>(props.kinds[0] ?? 'email')
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<Channel['severity']>('warn')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const meta = CHANNEL_META[kind] ?? CHANNEL_META.webhook

  const onConfirm = async () => {
    if (!name.trim() || !target.trim()) {
      setErr('名称和目标都必填')
      return
    }
    setSubmitting(true)
    setErr(null)
    try {
      await props.onSubmit({
        kind,
        name: name.trim(),
        target: target.trim(),
        description: description.trim(),
        severity,
        is_enabled: true,
      })
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
      setSubmitting(false)
    }
  }

  return (
    <div
      onClick={props.onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13,10,24,.62)',
        backdropFilter: 'blur(4px)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width: 480,
          maxWidth: 'calc(100vw - 32px)',
          background: 'var(--bg-1)',
          border: '1px solid var(--line-strong)',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div className="mb-3">
          <div className="fw-700 text-0 fs-16">添加告警渠道</div>
          <div className="muted fs-12 mt-1">命中策略后通过该渠道分发通知</div>
        </div>

        <div className="mb-3">
          <label className="fs-12 fw-600" style={{ display: 'block', marginBottom: 6 }}>
            渠道类型
          </label>
          <select
            className="select"
            value={kind}
            onChange={e => setKind(e.target.value as ChannelKind)}
          >
            {props.kinds.map(k => (
              <option key={k} value={k}>
                {CHANNEL_META[k]?.label ?? k} ({k})
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="fs-12 fw-600" style={{ display: 'block', marginBottom: 6 }}>
            名称 <span style={{ color: 'var(--brand-1)' }}>*</span>
          </label>
          <input
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="如 SRE 值班组"
            autoFocus
          />
        </div>
        <div className="mb-3">
          <label className="fs-12 fw-600" style={{ display: 'block', marginBottom: 6 }}>
            目标 <span style={{ color: 'var(--brand-1)' }}>*</span>
          </label>
          <input
            className="input"
            value={target}
            onChange={e => setTarget(e.target.value)}
            placeholder={meta.placeholder}
          />
          <div className="muted fs-11" style={{ marginTop: 4 }}>
            {meta.description}
          </div>
        </div>
        <div className="mb-3">
          <label className="fs-12 fw-600" style={{ display: 'block', marginBottom: 6 }}>
            最低级别（达到此级别才通知）
          </label>
          <select
            className="select"
            value={severity}
            onChange={e => setSeverity(e.target.value as Channel['severity'])}
          >
            <option value="info">info · 全部</option>
            <option value="warn">warn · 仅警告 +</option>
            <option value="critical">critical · 仅严重</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="fs-12 fw-600" style={{ display: 'block', marginBottom: 6 }}>
            备注
          </label>
          <textarea
            className="input"
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        {err && (
          <div
            className="fs-12"
            style={{
              padding: '8px 12px',
              marginBottom: 10,
              background: 'var(--bg-danger-1, #fee2e2)',
              color: 'var(--text-danger, #b91c1c)',
              borderRadius: 6,
            }}
          >
            {err}
          </div>
        )}

        <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="ghost" onClick={props.onCancel}>
            取消
          </Button>
          <Button variant="pri" onClick={onConfirm} disabled={submitting}>
            {submitting ? '创建中…' : '创建渠道'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AclRoutes() {
  return (
    <Routes>
      <Route index element={<AlertsPage />} />
      <Route path="policy" element={<AlertPolicy />} />
      <Route path="*" element={<Navigate to="/acl" replace />} />
    </Routes>
  )
}
