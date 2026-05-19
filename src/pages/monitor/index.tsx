import { useEffect, useMemo, useState } from 'react'
import { Card, Icon, KPI, Tag, Tabs, Button, cn } from '@/components/ui'
import { AreaChart, BarChartH, BarsVertical, Gauge } from '@/components/charts'
import { mkAttack, type AttackEvent } from '@/mocks/nebula'

type FilterValue = 'all' | 'blocked' | 'challenged' | 'logged'

const FILTER_TABS = [
  { value: 'all' as const, label: '全部' },
  { value: 'blocked' as const, label: '拦截' },
  { value: 'challenged' as const, label: '挑战' },
  { value: 'logged' as const, label: '记录' },
]

const TYPE_COLORS = ['#ef4444', '#f59e0b', '#a855f7', '#ec4899', '#22d3ee', '#10b981']

function tagKind(type: string): 'danger' | 'warn' | 'info' {
  if (type === 'SQLi' || type === 'CC' || type === 'WS') return 'danger'
  if (type === 'XSS' || type === 'CMDi') return 'warn'
  return 'info'
}

function riskKind(risk: AttackEvent['risk']): 'danger' | 'warn' | 'def' {
  if (risk === '高') return 'danger'
  if (risk === '中') return 'warn'
  return 'def'
}

function actionKind(action: AttackEvent['action']): 'ok' | 'pink' | 'def' {
  if (action === 'blocked') return 'ok'
  if (action === 'challenged') return 'pink'
  return 'def'
}

function actionShort(action: AttackEvent['action']): string {
  if (action === 'blocked') return 'BLOCK'
  if (action === 'challenged') return 'CHAL'
  return 'LOG'
}

export default function PageMonitor() {
  const [paused, setPaused] = useState(false)
  const [filter, setFilter] = useState<FilterValue>('all')
  const [events, setEvents] = useState<AttackEvent[]>(() =>
    Array.from({ length: 18 }, () => mkAttack()),
  )

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      setEvents(prev => {
        const batch = Array.from({ length: 1 + Math.floor(Math.random() * 2) }, () => mkAttack())
        return [...batch, ...prev].slice(0, 30)
      })
    }, 1100)
    return () => clearInterval(id)
  }, [paused])

  const [rtData, setRtData] = useState(() => ({
    req: Array.from({ length: 60 }, () => 800 + Math.random() * 400),
    block: Array.from({ length: 60 }, () => 30 + Math.random() * 60),
    chal: Array.from({ length: 60 }, () => 10 + Math.random() * 30),
  }))
  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      setRtData(d => ({
        req: [...d.req.slice(1), 800 + Math.random() * 500],
        block: [...d.block.slice(1), 30 + Math.random() * 80 + (Math.random() > 0.92 ? 200 : 0)],
        chal: [...d.chal.slice(1), 10 + Math.random() * 40],
      }))
    }, 900)
    return () => clearInterval(id)
  }, [paused])

  const top5 = useMemo(() => {
    const counts: Record<string, number> = {}
    events.forEach(e => {
      counts[e.typeLabel] = (counts[e.typeLabel] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value], i) => ({
        label,
        value: value * 80 + Math.floor(Math.random() * 200),
        color: TYPE_COLORS[i] ?? '#5d556e',
      }))
  }, [events])

  const filteredEvents = filter === 'all' ? events : events.filter(e => e.action === filter)

  const passRate = (
    100 -
    (100 * (rtData.block[59] + rtData.chal[59])) / Math.max(1, rtData.req[59])
  ).toFixed(2)

  return (
    <>
      <div className="page-hd">
        <div>
          <h1>
            <span className="ord">NW · 02</span>实时监控
          </h1>
          <p>
            每秒滚动 · 流量与攻击同步可视化 ·
            <span className="t-pink" style={{ marginLeft: 8 }}>
              <span className="live-dot" />
              LIVE
            </span>
          </p>
        </div>
        <div className="actions">
          <select className="select" defaultValue="all">
            <option value="all">全部站点</option>
            <option value="www">官网主站</option>
            <option value="api">API 网关</option>
          </select>
          <select className="select" defaultValue="1m">
            <option value="1m">近 1 分钟</option>
            <option value="5m">近 5 分钟</option>
            <option value="1h">近 1 小时</option>
          </select>
          <button
            type="button"
            className={cn('btn', paused ? 'btn-pri' : 'btn-ghost')}
            onClick={() => setPaused(p => !p)}
          >
            {paused ? (
              <>
                <Icon name="play" size={11} className="ico" />
                恢复
              </>
            ) : (
              <>
                <Icon name="pause" size={11} className="ico" />
                暂停
              </>
            )}
          </button>
        </div>
      </div>

      <div className="kpi-grid c5">
        <KPI
          label="实时 QPS"
          value={Math.floor(rtData.req[59]).toLocaleString()}
          ico="activity"
          kind="brand"
        />
        <KPI label="拦截 / 秒" value={Math.floor(rtData.block[59])} ico="shield" kind="danger" />
        <KPI label="挑战 / 秒" value={Math.floor(rtData.chal[59])} ico="lock" kind="warn" />
        <KPI label="放行率" value={passRate} unit="%" ico="check" kind="ok" />
        <KPI label="可用率" value="99.99" unit="%" ico="pulse" kind="info" />
      </div>

      <div className="row r-2-1 mb-4">
        <Card
          title="请求 / 拦截 / 挑战 实时趋势"
          ico="activity"
          meta="60s 滚动 · 0.9s 采样"
          actions={
            <>
              <Tag kind="info">通过</Tag>
              <Tag kind="danger">拦截</Tag>
              <Tag kind="warn">挑战</Tag>
            </>
          }
        >
          <AreaChart
            height={280}
            labels={Array.from({ length: 60 }, (_, i) => `-${60 - i}s`)}
            series={[
              { label: '通过', data: rtData.req, color: '#22d3ee' },
              { label: '拦截', data: rtData.block, color: '#ef4444' },
              { label: '挑战', data: rtData.chal, color: '#f59e0b' },
            ]}
          />
        </Card>

        <Card title="攻击类型 TOP" ico="crosshair" meta="实时">
          <BarChartH data={top5} height={260} />
        </Card>
      </div>

      <Card
        title="实时攻击事件流"
        ico="logs"
        meta={`${events.length} 条 · ${paused ? '已暂停' : 'LIVE'}`}
        actions={<Tabs tabs={FILTER_TABS} value={filter} onChange={setFilter} />}
        bodyClass="np"
      >
        <div className="ticker">
          {filteredEvents.slice(0, 14).map((e, idx) => (
            <div
              key={e.id}
              className="ticker-row"
              style={{
                gridTemplateColumns: '90px 1fr 130px 110px 90px 90px 90px',
                opacity: idx > 10 ? 0.55 : 1,
              }}
            >
              <div className="mono fs-11 t-brand">{e.t}</div>
              <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                <span className="mono fs-11" style={{ color: 'var(--text-0)' }}>
                  {e.ip}
                </span>
                <span className="muted fs-11">→ {e.domain}</span>
                <code
                  className="mono"
                  style={{
                    background: 'var(--bg-2)',
                    border: '1px solid var(--line)',
                    color: 'var(--text-1)',
                    marginLeft: 'auto',
                    maxWidth: 360,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    flexShrink: 1,
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 11.5,
                  }}
                >
                  {e.method} {e.uri}
                  {e.payload}
                </code>
              </div>
              <div>{e.region}</div>
              <div>
                <Tag kind={tagKind(e.type)}>{e.typeLabel}</Tag>
              </div>
              <div>
                <Tag kind={riskKind(e.risk)}>{e.risk}</Tag>
              </div>
              <div className="mono fs-11 muted">#{e.ruleId}</div>
              <div>
                <Tag kind={actionKind(e.action)}>{actionShort(e.action)}</Tag>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="row r-1-1 mt-4">
        <Card title="集群资源监控" ico="cpu" meta="近 1h">
          <div className="row r-3 gap-3">
            {[
              { label: 'CPU 平均', value: 38, color: '#a855f7' },
              { label: '内存平均', value: 52, color: '#ec4899' },
              { label: '入网带宽', value: 64, color: '#22d3ee' },
            ].map(g => (
              <div key={g.label} style={{ textAlign: 'center' }}>
                <Gauge value={g.value} label={g.label} color={g.color} size={150} />
              </div>
            ))}
          </div>
        </Card>
        <Card title="近 24 小时告警分布" ico="alert" meta="按级别">
          <BarsVertical
            height={210}
            data={[
              { label: '00h', value: 4, color: '#ef4444' },
              { label: '04h', value: 2, color: '#ef4444' },
              { label: '08h', value: 6, color: '#f59e0b' },
              { label: '12h', value: 9, color: '#f59e0b' },
              { label: '14h', value: 18, color: '#ef4444' },
              { label: '16h', value: 12, color: '#a855f7' },
              { label: '20h', value: 7, color: '#a855f7' },
              { label: '23h', value: 3, color: '#22d3ee' },
            ]}
          />
        </Card>
      </div>

      <div style={{ marginTop: 16 }}>
        <Button variant="ghost" size="sm">
          <Icon name="refresh" size={11} className="ico" />
          重置视图
        </Button>
      </div>
    </>
  )
}
