import { Card, Icon, KPI, Tag, Button, Toggle } from '@/components/ui'
import { ALERTS } from '@/mocks/nebula'
import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import AlertPolicy from './AlertPolicy'

function AlertsPage() {
  const nav = useNavigate()
  const [channels, setChannels] = useState({
    email: true,
    wechat: true,
    pagerduty: true,
    webhook: false,
    sms: false,
  })

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
          <Button variant="line">全部已读</Button>
        </div>
      </div>

      <div className="kpi-grid">
        <KPI label="未处理告警" value="3" ico="alert" kind="danger" />
        <KPI label="处理中" value="2" ico="refresh" kind="warn" />
        <KPI label="今日已闭环" value="14" ico="check" kind="ok" />
        <KPI label="平均响应时间" value="3.4" unit="min" ico="pulse" kind="info" />
      </div>

      <Card title="活跃告警列表" ico="alert" meta="按时间倒序" bodyClass="np">
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
            {ALERTS.map(a => (
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
                  <span className="tbl-link">认领</span> · <span className="tbl-link">详情</span>{' '}
                  · <span className="tbl-link">忽略</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="row r-1-1 mt-4">
        <Card title="告警通知渠道" ico="bell">
          {(
            [
              { k: 'email', l: '邮件', d: 'admin@cloudwall.local · ops@' },
              { k: 'wechat', l: '企业微信 / 钉钉', d: '机器人 webhook · 已对接' },
              { k: 'pagerduty', l: 'PagerDuty', d: '严重告警自动 page' },
              { k: 'webhook', l: 'Webhook', d: 'https://hooks.example.com/...' },
              { k: 'sms', l: '短信', d: '运维负责人手机号' },
            ] as const
          ).map(c => (
            <div
              key={c.k}
              className="flex items-center"
              style={{ padding: '10px 0', borderBottom: '1px solid var(--line-2)' }}
            >
              <div className="flex-1">
                <div className="fw-600 text-0 fs-13">{c.l}</div>
                <div className="muted fs-11">{c.d}</div>
              </div>
              <Toggle
                on={(channels as Record<string, boolean>)[c.k]}
                onChange={v => setChannels(s => ({ ...s, [c.k]: v }))}
              />
            </div>
          ))}
        </Card>

        <Card title="告警策略" ico="sliders" meta="阈值 / 抑制 / 升级">
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
    </>
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
