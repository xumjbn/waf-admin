import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Icon, Tag, Button, Toggle, KPI } from '@/components/ui'

type Severity = 'critical' | 'warn' | 'info'

interface Policy {
  id: string
  enabled: boolean
  condition: string
  window: string
  severity: Severity
  recipients: string
  channel: string
  suppressMin: number
}

const WINDOWS = ['即时', '1 分钟', '5 分钟', '15 分钟', '1 小时', '每日']
const CHANNELS = ['邮件 + 企业微信', '邮件', '企业微信 / 钉钉', 'PagerDuty', 'Webhook', '短信']

const DEFAULT: Policy[] = [
  {
    id: 'p1',
    enabled: true,
    condition: 'CC 攻击突增 ≥ 300%',
    window: '5 分钟',
    severity: 'critical',
    recipients: '运维 + CTO',
    channel: '邮件 + 企业微信',
    suppressMin: 10,
  },
  {
    id: 'p2',
    enabled: true,
    condition: 'CPU > 85% 持续',
    window: '5 分钟',
    severity: 'warn',
    recipients: '运维',
    channel: '企业微信 / 钉钉',
    suppressMin: 5,
  },
  {
    id: 'p3',
    enabled: true,
    condition: '实例离线',
    window: '即时',
    severity: 'critical',
    recipients: '运维 + 平台组',
    channel: 'PagerDuty',
    suppressMin: 0,
  },
  {
    id: 'p4',
    enabled: true,
    condition: '证书 ≤ 7 天到期',
    window: '每日',
    severity: 'warn',
    recipients: '安全',
    channel: '邮件',
    suppressMin: 1440,
  },
  {
    id: 'p5',
    enabled: false,
    condition: '许可证 ≤ 30 天到期',
    window: '每日',
    severity: 'info',
    recipients: '管理员',
    channel: '邮件',
    suppressMin: 1440,
  },
]

let seq = 100
const nextId = () => `p${++seq}`

export default function AlertPolicy() {
  const nav = useNavigate()
  const [list, setList] = useState<Policy[]>(DEFAULT)
  const [saved, setSaved] = useState(false)

  const upd = (id: string, patch: Partial<Policy>) =>
    setList(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)))

  const add = () =>
    setList(prev => [
      ...prev,
      {
        id: nextId(),
        enabled: true,
        condition: '新建告警条件',
        window: '5 分钟',
        severity: 'warn',
        recipients: '运维',
        channel: '邮件',
        suppressMin: 5,
      },
    ])

  const del = (id: string) => setList(prev => prev.filter(p => p.id !== id))

  const sevTagKind = (s: Severity): 'danger' | 'warn' | 'info' =>
    s === 'critical' ? 'danger' : s === 'warn' ? 'warn' : 'info'

  const sevText = (s: Severity) => (s === 'critical' ? '严重' : s === 'warn' ? '警告' : '信息')

  const onSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
  }

  const enabledCount = list.filter(p => p.enabled).length
  const criticalCount = list.filter(p => p.severity === 'critical').length
  const warnCount = list.filter(p => p.severity === 'warn').length

  return (
    <>
      <div className="page-hd">
        <div>
          <h1>
            <span className="ord">NW · 07 · 设置</span>
            告警策略
          </h1>
          <p>阈值 · 时间窗口 · 抑制 · 升级路径 — 命中后按通知渠道分发</p>
        </div>
        <div className="actions">
          <Button variant="ghost" onClick={() => nav('/acl')}>返回告警中心</Button>
          <Button variant="line" onClick={add}>
            <Icon name="plus" size={13} className="ico" />
            新增策略
          </Button>
          <Button variant="pri" onClick={onSave}>
            {saved && <Icon name="check" size={13} className="ico" />}
            {saved ? '已保存' : '保存策略'}
          </Button>
        </div>
      </div>

      <div className="kpi-grid">
        <KPI label="策略总数" value={String(list.length)} ico="sliders" kind="info" />
        <KPI label="已启用" value={String(enabledCount)} ico="check" kind="ok" />
        <KPI label="严重级" value={String(criticalCount)} ico="alert" kind="danger" />
        <KPI label="警告级" value={String(warnCount)} ico="pulse" kind="warn" />
      </div>

      <Card title="策略列表" ico="sliders" meta={`${list.length} 条 · ${enabledCount} 启用`} bodyClass="np">
        <table>
          <thead>
            <tr>
              <th style={{ width: 60 }}>启用</th>
              <th>触发条件</th>
              <th style={{ width: 110 }}>时间窗口</th>
              <th style={{ width: 100 }}>级别</th>
              <th>通知对象</th>
              <th>通知渠道</th>
              <th style={{ width: 110 }}>抑制 (分钟)</th>
              <th style={{ width: 60 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map(p => (
              <tr key={p.id}>
                <td>
                  <Toggle on={p.enabled} onChange={v => upd(p.id, { enabled: v })} />
                </td>
                <td>
                  <input
                    className="input"
                    value={p.condition}
                    onChange={e => upd(p.id, { condition: e.target.value })}
                    style={{ minWidth: 240 }}
                  />
                </td>
                <td>
                  <select
                    className="select"
                    value={p.window}
                    onChange={e => upd(p.id, { window: e.target.value })}
                  >
                    {WINDOWS.map(w => (
                      <option key={w}>{w}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    className="select"
                    value={p.severity}
                    onChange={e => upd(p.id, { severity: e.target.value as Severity })}
                  >
                    <option value="critical">严重</option>
                    <option value="warn">警告</option>
                    <option value="info">信息</option>
                  </select>
                  <span style={{ marginLeft: 8 }}>
                    <Tag kind={sevTagKind(p.severity)}>{sevText(p.severity)}</Tag>
                  </span>
                </td>
                <td>
                  <input
                    className="input"
                    value={p.recipients}
                    onChange={e => upd(p.id, { recipients: e.target.value })}
                    style={{ minWidth: 140 }}
                  />
                </td>
                <td>
                  <select
                    className="select"
                    value={p.channel}
                    onChange={e => upd(p.id, { channel: e.target.value })}
                    style={{ minWidth: 160 }}
                  >
                    {CHANNELS.map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    className="input"
                    value={p.suppressMin}
                    onChange={e => upd(p.id, { suppressMin: Number(e.target.value) || 0 })}
                    style={{ width: 90 }}
                  />
                </td>
                <td>
                  <span
                    className="tbl-link fs-11 t-danger"
                    style={{ cursor: 'pointer' }}
                    onClick={() => del(p.id)}
                  >
                    删除
                  </span>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={8} className="muted fs-12" style={{ textAlign: 'center', padding: 24 }}>
                  暂无策略 · 点击右上角「新增策略」添加
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <div className="row r-1-1 mt-4">
        <Card title="升级路径" ico="flow" meta="未确认告警的升级链">
          <table>
            <tbody>
              {[
                ['首次触发 → 0 min', '通知主负责人', 'info'],
                ['未确认 → 10 min', '通知二线 + 主管', 'warn'],
                ['未确认 → 30 min', 'PagerDuty 升级 + 运维总监', 'danger'],
                ['未确认 → 60 min', '电话告警 + CTO', 'danger'],
              ].map(r => (
                <tr key={r[0]}>
                  <td className="mono fs-11 muted">{r[0]}</td>
                  <td className="fw-600 fs-12">{r[1]}</td>
                  <td>
                    <Tag kind={r[2] as 'info' | 'warn' | 'danger'}>
                      {r[2] === 'danger' ? '严重' : r[2] === 'warn' ? '警告' : '信息'}
                    </Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="抑制与去重" ico="filter" meta="避免告警风暴">
          <div className="stack">
            <div className="field">
              <label>同一条件抑制窗口（默认）</label>
              <div className="flex items-center gap-2">
                <input type="number" className="input" defaultValue={5} style={{ width: 100 }} />
                <span className="muted fs-12">分钟内重复触发不再通知</span>
              </div>
            </div>
            <div className="field">
              <label>静默时段</label>
              <div className="flex items-center gap-2">
                <input className="input" defaultValue="00:00 - 06:00" style={{ width: 160 }} />
                <span className="muted fs-12">仅记录，不外发（严重级别除外）</span>
              </div>
            </div>
            <div className="field">
              <label>相似度合并</label>
              <div className="flex items-center gap-2">
                <Toggle on={true} onChange={() => {}} />
                <span className="muted fs-12">5 分钟内类似事件聚合为一条</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
