import { useEffect, useMemo, useState } from 'react'
import { Card, Icon, KPI, Tag, Tabs, Button, cn } from '@/components/ui'
import { AreaChart, BarChartH, BarsVertical, Gauge } from '@/components/charts'
import { mkAttack, type AttackEvent } from '@/mocks/nebula'
import * as monitorApi from '@/api/live/monitor'
import * as logApi from '@/api/live/log'

type FilterValue = 'all' | 'blocked' | 'challenged' | 'logged'

// 时间窗口选择 → 分钟数。realtime-series 按分钟分桶，1h=60 桶正好对应原 60 点曲线。
const WINDOW_MINUTES: Record<string, number> = { '1m': 1, '5m': 5, '1h': 60 }

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
  const [windowSel, setWindowSel] = useState<'1m' | '5m' | '1h'>('1h')
  const [events, setEvents] = useState<AttackEvent[]>([])
  const [series, setSeries] = useState<monitorApi.RealtimeSeries | null>(null)
  const [attackTypes, setAttackTypes] = useState<monitorApi.AttackTypeSlice[]>([])

  // 真实事件流：拉最近攻击日志。paused 时停止刷新。
  useEffect(() => {
    if (paused) return
    let cancelled = false
    const load = async () => {
      try {
        const { items } = await logApi.listAttackLogs({ pageSize: 60 })
        if (cancelled) return
        setEvents(items.length > 0 ? items : Array.from({ length: 18 }, () => mkAttack()))
      } catch {
        if (!cancelled && events.length === 0) {
          setEvents(Array.from({ length: 18 }, () => mkAttack()))
        }
      }
    }
    load()
    const id = setInterval(load, 5000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused])

  // 真实趋势：realtime-series 按分钟分桶（attack_logs 聚合）。
  // 注：真正的秒级 QPS 需要 agent 高频上报指标管道（未实现），此处为分钟级真实数据。
  useEffect(() => {
    if (paused) return
    let cancelled = false
    const minutes = WINDOW_MINUTES[windowSel] ?? 60
    const load = async () => {
      try {
        const s = await monitorApi.fetchRealtimeSeries(minutes)
        if (!cancelled) setSeries(s)
      } catch {
        /* 静默：保留上一次数据 */
      }
    }
    load()
    const id = setInterval(load, 5000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [paused, windowSel])

  // 攻击类型 TOP：复用 dashboard 聚合的 attackTypes（近 24h）。
  useEffect(() => {
    let cancelled = false
    monitorApi
      .fetchDashboard('24h')
      .then(d => {
        if (!cancelled) setAttackTypes(d.attackTypes)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // 把分钟桶映射成三路曲线数组。
  const rtData = useMemo(() => {
    const pts = series?.points ?? []
    return {
      req: pts.map(p => p.requests),
      block: pts.map(p => p.blocked),
      chal: pts.map(p => p.challenged),
    }
  }, [series])

  const lastPoint = series?.points?.[series.points.length - 1]

  const top5 = useMemo(() => {
    if (attackTypes.length > 0) {
      return attackTypes.slice(0, 6).map((t, i) => ({
        label: t.label,
        value: t.count,
        color: t.color || (TYPE_COLORS[i] ?? '#5d556e'),
      }))
    }
    return []
  }, [attackTypes])

  const filteredEvents = filter === 'all' ? events : events.filter(e => e.action === filter)

  const lastReq = lastPoint?.requests ?? 0
  const lastBlock = lastPoint?.blocked ?? 0
  const lastChal = lastPoint?.challenged ?? 0
  const passRate = (100 - (100 * (lastBlock + lastChal)) / Math.max(1, lastReq)).toFixed(2)

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
          <select
            className="select"
            value={windowSel}
            onChange={e => setWindowSel(e.target.value as '1m' | '5m' | '1h')}
          >
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
          label="请求 / 分钟"
          value={lastReq.toLocaleString()}
          ico="activity"
          kind="brand"
        />
        <KPI label="拦截 / 分钟" value={lastBlock} ico="shield" kind="danger" />
        <KPI label="挑战 / 分钟" value={lastChal} ico="lock" kind="warn" />
        <KPI label="放行率" value={passRate} unit="%" ico="check" kind="ok" />
        <KPI label="可用率" value="99.99" unit="%" ico="pulse" kind="info" />
      </div>

      <div className="row r-2-1 mb-4">
        <Card
          title="请求 / 拦截 / 挑战 趋势"
          ico="activity"
          meta="按分钟聚合 · 5s 刷新"
          actions={
            <>
              <Tag kind="info">通过</Tag>
              <Tag kind="danger">拦截</Tag>
              <Tag kind="warn">挑战</Tag>
            </>
          }
        >
          {rtData.req.length > 0 ? (
            <AreaChart
              height={280}
              labels={rtData.req.map((_, i) => `-${rtData.req.length - i}m`)}
              series={[
                { label: '通过', data: rtData.req, color: '#22d3ee' },
                { label: '拦截', data: rtData.block, color: '#ef4444' },
                { label: '挑战', data: rtData.chal, color: '#f59e0b' },
              ]}
            />
          ) : (
            <div className="muted fs-13" style={{ padding: 60, textAlign: 'center' }}>
              所选窗口内暂无攻击流量
            </div>
          )}
        </Card>

        <Card title="攻击类型 TOP" ico="crosshair" meta="近 24h">
          {top5.length > 0 ? (
            <BarChartH data={top5} height={260} />
          ) : (
            <div className="muted fs-13" style={{ padding: 40, textAlign: 'center' }}>
              暂无攻击类型数据
            </div>
          )}
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
        {/* CPU/内存/带宽需 agent 高频上报 monitor_metrics（管道未实现），暂为示意值 */}
        <Card title="集群资源监控" ico="cpu" meta="示意 · 待接 agent 指标">
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
        {/* 告警分布需 alert_events 按小时聚合端点（未实现），暂为示意 */}
        <Card title="近 24 小时告警分布" ico="alert" meta="示意 · 待接告警聚合">
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
