import { useMemo, useState } from 'react'
import { Card, Icon, Tag, Button, Tabs } from '@/components/ui'
import { mkAttack, type AttackEvent } from '@/mocks/nebula'

type FilterTab = 'all' | 'block' | 'chal' | 'log'

export default function LogsPage() {
  const allEvents = useMemo(() => Array.from({ length: 40 }, () => mkAttack()), [])
  const [ipFilter, setIpFilter] = useState<string | null>(null)
  const events = useMemo(
    () => (ipFilter ? allEvents.filter(e => e.ip === ipFilter) : allEvents),
    [allEvents, ipFilter],
  )
  const [selected, setSelected] = useState<AttackEvent>(allEvents[0])
  const [tab, setTab] = useState<FilterTab>('all')

  return (
    <>
      <div className="page-hd">
        <div>
          <h1>
            <span className="ord">NW · 05</span>
            攻击日志 / 取证分析
          </h1>
          <p>原始请求 · 命中规则 · Payload 解码 · 关联事件分析</p>
        </div>
        <div className="actions">
          <Button variant="ghost">
            <Icon name="filter" size={13} className="ico" />
            高级筛选
          </Button>
          <Button variant="ghost">
            <Icon name="download" size={13} className="ico" />
            导出 CSV
          </Button>
        </div>
      </div>

      <Card bodyClass="" className="mb-4">
        <div className="frow">
          <div className="field">
            <label>时间范围</label>
            <select className="select">
              <option>近 1 小时</option>
              <option>近 24 小时</option>
              <option>近 7 天</option>
              <option>自定义</option>
            </select>
          </div>
          <div className="field">
            <label>站点</label>
            <select className="select">
              <option>全部</option>
            </select>
          </div>
          <div className="field">
            <label>攻击类型</label>
            <select className="select">
              <option>全部</option>
            </select>
          </div>
          <div className="field">
            <label>风险等级</label>
            <select className="select">
              <option>全部</option>
            </select>
          </div>
          <div className="field">
            <label>处置</label>
            <select className="select">
              <option>全部</option>
              <option>拦截</option>
              <option>挑战</option>
              <option>放行</option>
            </select>
          </div>
          <div className="field">
            <label>来源 IP / CIDR</label>
            <input className="input" placeholder="如 1.2.3.4 / 24" />
          </div>
          <Button variant="pri">
            <Icon name="search" size={13} className="ico" />
            查询
          </Button>
          <Button variant="ghost" onClick={() => setIpFilter(null)}>
            {ipFilter ? '清除 IP 关联' : '重置'}
          </Button>
        </div>
      </Card>

      <div className="row r-2-1">
        <Card
          title="攻击日志"
          ico="logs"
          meta={
            ipFilter
              ? `IP ${ipFilter} · ${events.length} 条关联事件`
              : `共 ${events.length} 条匹配`
          }
          actions={
            <Tabs
              tabs={[
                { value: 'all', label: '全部' },
                { value: 'block', label: '拦截', count: 28 },
                { value: 'chal', label: '挑战', count: 8 },
                { value: 'log', label: '记录', count: 4 },
              ]}
              value={tab}
              onChange={v => setTab(v as FilterTab)}
            />
          }
          bodyClass="np"
        >
          <div className="tbl-wrap" style={{ maxHeight: 600, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>IP</th>
                  <th>站点</th>
                  <th>类型</th>
                  <th>请求</th>
                  <th>规则</th>
                  <th>动作</th>
                </tr>
              </thead>
              <tbody>
                {events.map(e => (
                  <tr
                    key={e.id}
                    onClick={() => setSelected(e)}
                    style={{
                      cursor: 'pointer',
                      background: selected.id === e.id ? 'rgba(168,85,247,.08)' : undefined,
                    }}
                  >
                    <td className="mono fs-11">{e.t}</td>
                    <td className="mono">
                      <span className="t-brand">{e.ip}</span>
                    </td>
                    <td className="fs-12">{e.site}</td>
                    <td>
                      <Tag kind={e.type === 'SQLi' || e.type === 'CC' ? 'danger' : 'warn'}>
                        {e.type}
                      </Tag>
                    </td>
                    <td
                      className="mono fs-11"
                      style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      <span className="t-pink">{e.method}</span> {e.uri}
                    </td>
                    <td className="mono fs-11 muted">#{e.ruleId}</td>
                    <td>
                      <Tag kind={e.action === 'blocked' ? 'ok' : 'warn'}>
                        {e.action.toUpperCase()}
                      </Tag>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <ForensicsPanel
          event={selected}
          onRelated={ip => {
            setIpFilter(ip)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      </div>
    </>
  )
}

function ForensicsPanel({ event, onRelated }: { event: AttackEvent; onRelated: (ip: string) => void }) {
  return (
    <div className="stack">
      <Card title="事件取证" ico="eye" meta={event.id} bracketed>
        <div className="stack">
          <KV label="事件 ID" value={event.id} mono />
          <KV label="时间戳" value={event.t} mono />
          <KV
            label="来源 IP"
            value={
              <>
                <span className="mono t-brand">{event.ip}</span>{' '}
                <span className="muted fs-11">· {event.region}</span>
              </>
            }
          />
          <KV label="目标站点" value={`${event.site} (${event.domain})`} />
          <KV
            label="攻击类型"
            value={
              <Tag kind="danger" lg>
                {event.typeLabel}
              </Tag>
            }
          />
          <KV
            label="风险等级"
            value={
              <Tag kind={event.risk === '高' ? 'danger' : event.risk === '中' ? 'warn' : 'def'} lg>
                {event.risk}
              </Tag>
            }
          />
          <KV
            label="命中规则"
            value={
              <>
                <code className="mono">#{event.ruleId}</code>{' '}
                <span className="muted fs-11">OWASP CRS</span>
              </>
            }
          />
          <KV
            label="处置动作"
            value={
              <Tag kind="ok">已 {event.action === 'blocked' ? '拦截' : '挑战'}</Tag>
            }
          />
        </div>
        <div className="divider-h" />
        <div className="muted fs-11 mb-2" style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
          原始请求
        </div>
        <pre
          style={{
            background: 'var(--bg-0)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: 12,
            fontFamily: 'JetBrains Mono',
            fontSize: 11.5,
            color: 'var(--text-1)',
            lineHeight: 1.7,
            overflow: 'auto',
            maxHeight: 200,
          }}
        >
          <span className="t-pink">{event.method}</span> {event.uri}
          <span style={{ color: 'var(--danger)' }}>{event.payload}</span> HTTP/1.1{'\n'}
          <span className="t-brand">Host:</span> {event.domain}
          {'\n'}
          <span className="t-brand">User-Agent:</span> {event.ua}
          {'\n'}
          <span className="t-brand">X-Forwarded-For:</span> {event.ip}
          {'\n'}
          <span className="t-brand">Accept:</span> */*{'\n'}
          <span className="t-brand">Connection:</span> close{'\n'}
        </pre>
        <div className="muted fs-11 mt-3 mb-2" style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
          Payload 解码
        </div>
        <div
          className="mono fs-11"
          style={{
            padding: 10,
            borderRadius: 8,
            background: 'rgba(239,68,68,.06)',
            border: '1px solid rgba(239,68,68,.2)',
            color: 'var(--text-0)',
          }}
        >
          {event.payload}
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            variant="pri"
            size="sm"
            onClick={() => {
              if (window.confirm(`确认将 ${event.ip} 加入封禁列表？\n\n该 IP 将立即被所有站点拒绝访问。`)) {
                window.alert(`已封禁 ${event.ip}\n生效范围：全部站点 · 持续 24h`)
              }
            }}
          >
            封禁此 IP
          </Button>
          <Button
            variant="line"
            size="sm"
            onClick={() => {
              if (window.confirm(`确认将 ${event.ip} 加入白名单？\n\n该 IP 的请求将跳过所有 WAF 检测。`)) {
                window.alert(`已加入白名单 · ${event.ip}`)
              }
            }}
          >
            加入白名单
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRelated(event.ip)}
          >
            关联事件
          </Button>
        </div>
      </Card>
    </div>
  )
}

function KV({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div
      className="flex items-center"
      style={{ padding: '5px 0', borderBottom: '1px solid var(--line-2)' }}
    >
      <span className="muted fs-11" style={{ width: 80, letterSpacing: 0.5 }}>
        {label}
      </span>
      <span className={`fs-12 text-1 ${mono ? 'mono' : ''}`} style={{ flex: 1 }}>
        {value}
      </span>
    </div>
  )
}
