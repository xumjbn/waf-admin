import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, Icon, KPI, Tag, Bar, Button } from '@/components/ui'
import { AreaChart, BarChartH, Donut, Heatmap, Radar } from '@/components/charts'
import { AttackGlobe, type AttackGlobeHandle } from '@/components/globe/AttackGlobe'
import { INSTANCES, mkAttack, type AttackEvent } from '@/mocks/nebula'
import * as logApi from '@/api/live/log'
import * as monitorApi from '@/api/live/monitor'

// 数字格式化：大数转 K/M，给 KPI 卡用。
function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}

// 后端 heatmap[dow][hour]，dow 0=周日..6=周六；前端行序是 周一..周日。
// 这里把后端矩阵重排成前端期望的行序。
function remapHeatmap(matrix: number[][]): number[][] {
  if (!matrix || matrix.length < 7) return matrix ?? []
  // 周一(后端1) 周二(2) 周三(3) 周四(4) 周五(5) 周六(6) 周日(0)
  const order = [1, 2, 3, 4, 5, 6, 0]
  return order.map(d => matrix[d] ?? new Array(24).fill(0))
}

const TYPE_FALLBACK_COLORS = ['#ef4444', '#f59e0b', '#ec4899', '#a855f7', '#22d3ee', '#5d556e']
const SOURCE_BAR_COLORS = ['#ec4899', '#a855f7', '#22d3ee', '#f59e0b', '#ef4444', '#a855f7']

const HEATMAP_ROW_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const HEATMAP_COL_LABELS = Array.from({ length: 24 }, (_, i) => `${i}h`)
const RADAR_AXES = ['注入防护', 'Bot 抗扰', 'CC 抗压', '认证安全', '数据脱敏', '业务可用']

function attackTagKind(type: string): 'danger' | 'warn' | 'info' {
  if (type === 'SQLi' || type === 'CC' || type === 'WS') return 'danger'
  if (type === 'XSS' || type === 'BOT' || type === 'CMDi') return 'warn'
  return 'info'
}

function actionLabel(action: AttackEvent['action']): string {
  if (action === 'blocked') return '已拦截'
  if (action === 'challenged') return '已挑战'
  return '已记录'
}

function actionKind(action: AttackEvent['action']): 'ok' | 'pink' | 'def' {
  if (action === 'blocked') return 'ok'
  if (action === 'challenged') return 'pink'
  return 'def'
}

function riskKind(risk: AttackEvent['risk']): 'danger' | 'warn' | 'def' {
  if (risk === '高') return 'danger'
  if (risk === '中') return 'warn'
  return 'def'
}

export default function PageDashboard() {
  const [now, setNow] = useState(() => new Date())
  const globeRef = useRef<AttackGlobeHandle | null>(null)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // 真聚合数据：/monitor/dashboard 一次拉 KPI + TOP + 类型分布 + 7×24 热力图。
  // 拉失败时各块回退到空，UI 不空白（sparkline 给 0 数组）。
  const [dash, setDash] = useState<monitorApi.DashboardSnapshot | null>(null)
  const [dashError, setDashError] = useState<string | null>(null)
  const [windowSel, setWindowSel] = useState<'24h' | '7d' | '30d'>('24h')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const d = await monitorApi.fetchDashboard(windowSel)
        if (!cancelled) {
          setDash(d)
          setDashError(null)
        }
      } catch (e: unknown) {
        if (!cancelled) setDashError(e instanceof Error ? e.message : String(e))
      }
    }
    load()
    const id = setInterval(load, 30_000) // 30s 刷新
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [windowSel])

  const kpi = dash?.kpi
  const sparkAttack = kpi?.sparkBlocked?.length ? kpi.sparkBlocked : new Array(24).fill(0)
  const sparkReq = kpi?.sparkRequests?.length ? kpi.sparkRequests : new Array(24).fill(0)
  const sparkLatency = kpi?.sparkLatency?.length ? kpi.sparkLatency : new Array(24).fill(0)
  const sparkBlock = kpi?.sparkBlockRate?.length ? kpi.sparkBlockRate : new Array(24).fill(0)
  const sparkAlerts = kpi?.sparkAlerts?.length ? kpi.sparkAlerts : new Array(24).fill(0)

  const trendLabels = useMemo(
    () => Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
    [],
  )
  const trendBlocked = sparkAttack
  const trendPassed = sparkReq

  const attackBreakdown = useMemo(() => {
    const types = dash?.attackTypes ?? []
    if (types.length === 0) return [{ label: '暂无数据', value: 1, color: '#5d556e' }]
    return types.map((t, i) => ({
      label: t.label,
      value: t.count,
      color: t.color || TYPE_FALLBACK_COLORS[i % TYPE_FALLBACK_COLORS.length],
    }))
  }, [dash])

  const topSources = useMemo(() => {
    const srcs = dash?.topSources ?? []
    return srcs.map((s, i) => ({
      label: `${s.country} · ${s.srcIp}`,
      value: s.count,
      color: SOURCE_BAR_COLORS[i % SOURCE_BAR_COLORS.length],
    }))
  }, [dash])

  const heatmap = useMemo(() => remapHeatmap(dash?.heatmap ?? []), [dash])

  const radarSeries = [
    { label: '本月', data: [88, 76, 92, 81, 70, 96], color: '#a855f7' },
    { label: '上月', data: [80, 68, 84, 72, 66, 94], color: '#22d3ee' },
  ]

  // 实时拦截事件 + 地球攻击轨迹共用同一份真实攻击日志（拉最近 500 条）。
  // 事件表取最新 7 条；球面拿全部聚合。拉失败/空时回退 mkAttack 让 UI 不空。
  const [events, setEvents] = useState<AttackEvent[]>([])
  const [globeAttacks, setGlobeAttacks] = useState<AttackEvent[]>([])
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const { items } = await logApi.listAttackLogs({ pageSize: 500 })
        if (cancelled) return
        if (items.length === 0) {
          const fallback = Array.from({ length: 50 }, () => mkAttack())
          setGlobeAttacks(fallback)
          setEvents(fallback.slice(0, 7))
        } else {
          setGlobeAttacks(items)
          setEvents(items.slice(0, 7))
        }
      } catch {
        if (!cancelled) {
          const fallback = Array.from({ length: 50 }, () => mkAttack())
          setGlobeAttacks(fallback)
          setEvents(fallback.slice(0, 7))
        }
      }
    }
    load()
    const id = setInterval(load, 30_000) // 30s 刷新
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <>
      <div className="page-hd">
        <div>
          <h1>
            <span className="ord">NW · 01</span>
            安全态势总览
          </h1>
          <p>
            实时拦截 · 全维度威胁可视化 ·
            <span className="mono" style={{ color: 'var(--text-1)', marginLeft: 8 }}>
              {now.toLocaleString('zh-CN', { hour12: false })}
            </span>
            <span className="t-ok" style={{ marginLeft: 12 }}>
              <span className="live-dot ok" />
              SYNC OK
            </span>
          </p>
        </div>
        <div className="actions">
          <select
            className="select"
            value={windowSel}
            onChange={e => setWindowSel(e.target.value as '24h' | '7d' | '30d')}
          >
            <option value="24h">近 24 小时</option>
            <option value="7d">近 7 天</option>
            <option value="30d">近 30 天</option>
          </select>
          <Button variant="ghost" onClick={() => window.location.reload()}>
            <Icon name="refresh" size={13} className="ico" />
            刷新
          </Button>
          <Button variant="pri" onClick={() => (window.location.href = '/report')}>
            <Icon name="download" size={13} className="ico" />
            导出报告
          </Button>
        </div>
      </div>

      {dashError && (
        <div
          className="mb-3"
          style={{
            padding: '8px 12px',
            background: 'rgba(244,63,94,.10)',
            border: '1px solid rgba(244,63,94,.35)',
            borderRadius: 8,
            color: 'var(--danger)',
            fontSize: 13,
          }}
        >
          指标加载失败：{dashError}（显示为占位 0，请检查 waf-control 是否在线）
        </div>
      )}

      <div className="kpi-grid c5">
        <KPI
          label="今日拦截攻击"
          value={(kpi?.blockedToday ?? 0).toLocaleString()}
          ico="shield"
          kind="danger"
          sparkData={sparkAttack}
          sparkColor="#ef4444"
        />
        <KPI
          label="今日总请求"
          value={fmtCompact(kpi?.totalRequestsToday ?? 0)}
          ico="activity"
          kind="brand"
          sparkData={sparkReq}
          sparkColor="#a855f7"
        />
        <KPI
          label="平均响应延迟"
          value={String(Math.round(kpi?.avgLatencyMs ?? 0))}
          unit="ms"
          ico="pulse"
          kind="info"
          sparkData={sparkLatency}
          sparkColor="#22d3ee"
        />
        <KPI
          label="拦截/挑战率"
          value={(kpi?.blockedRatePct ?? 0).toFixed(2)}
          unit="%"
          ico="crosshair"
          kind="warn"
          sparkData={sparkBlock}
          sparkColor="#f59e0b"
        />
        <KPI
          label="活跃高危告警"
          value={String(kpi?.activeHighAlerts ?? 0)}
          ico="alert"
          kind="ok"
          sparkData={sparkAlerts}
          sparkColor="#10b981"
        />
      </div>

      <div className="row r-2-1 mb-4">
        <Card
          className="glass"
          bracketed
          title="全球攻击轨迹"
          ico="globe"
          meta="LIVE FEED · 自动旋转"
          actions={
            <>
              <Tag kind="pink">
                <span className="dot" />
                LIVE
              </Tag>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => globeRef.current?.toggleFullscreen()}
                title="全屏 / 退出全屏"
              >
                <Icon name="expand" size={11} className="ico" />
              </Button>
            </>
          }
          bodyClass="np"
        >
          <AttackGlobe ref={globeRef} height={480} attacks={globeAttacks} />
        </Card>

        <div className="stack">
          <Card title="攻击类型分布" ico="crosshair" meta="近 24h">
            <Donut
              data={attackBreakdown}
              size={150}
              thickness={20}
              centerValue={fmtCompact(kpi?.blockedToday ?? 0)}
              centerLabel="次拦截"
            />
          </Card>

          <Card title="威胁源 TOP 6" ico="globe" meta="GeoIP · 近 24h">
            {topSources.length > 0 ? (
              <BarChartH data={topSources} height={180} />
            ) : (
              <div className="muted fs-12" style={{ padding: 24, textAlign: 'center' }}>
                暂无攻击来源数据
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="row r-2-1 mb-4">
        <Card
          title="24 小时请求/拦截趋势"
          ico="activity"
          meta="QPS · 平滑曲线"
          actions={
            <>
              <Tag kind="info">通过</Tag>
              <Tag kind="danger">拦截</Tag>
            </>
          }
        >
          <AreaChart
            height={260}
            labels={trendLabels}
            series={[
              { label: '通过', data: trendPassed, color: '#22d3ee' },
              { label: '拦截', data: trendBlocked, color: '#ef4444' },
            ]}
          />
        </Card>
        <Card title="站点防护评分" ico="shield" meta="多维雷达">
          <Radar axes={RADAR_AXES} series={radarSeries} size={260} />
          <div className="flex gap-3 mt-2" style={{ justifyContent: 'center', fontSize: 11.5 }}>
            <span className="flex items-center gap-2">
              <span style={{ width: 8, height: 8, background: '#a855f7', borderRadius: 2 }} />
              本月 84
            </span>
            <span className="flex items-center gap-2">
              <span style={{ width: 8, height: 8, background: '#22d3ee', borderRadius: 2 }} />
              上月 77
            </span>
          </div>
        </Card>
      </div>

      <div className="row r-1-2 mb-4">
        <Card title="实例健康" ico="cpu" meta="集群 · 在线">
          {INSTANCES.slice(0, 5).map(i => (
            <div
              key={i.id}
              className="flex items-center gap-3"
              style={{ padding: '8px 0', borderBottom: '1px solid var(--line-2)' }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background:
                    i.state === 'online'
                      ? 'var(--ok)'
                      : i.state === 'busy'
                        ? 'var(--warn)'
                        : 'var(--danger)',
                  boxShadow:
                    i.state !== 'offline'
                      ? `0 0 8px ${i.state === 'online' ? '#10b981' : '#f59e0b'}`
                      : 'none',
                }}
              />
              <div style={{ flex: 1 }}>
                <div className="fw-600 fs-12 text-0">{i.id}</div>
                <div className="muted fs-11 mono">{i.ip}</div>
              </div>
              <div style={{ width: 100 }}>
                <div className="muted fs-11" style={{ marginBottom: 3 }}>
                  CPU
                </div>
                <Bar
                  value={i.cpu}
                  kind={i.cpu > 70 ? 'danger' : i.cpu > 50 ? 'warn' : 'brand'}
                  width={80}
                  label={`${i.cpu}%`}
                />
              </div>
              <div style={{ width: 80, textAlign: 'right' }}>
                <div className="mono fs-12 t-brand">{i.qps.toLocaleString()}</div>
                <div className="muted fs-10">QPS</div>
              </div>
            </div>
          ))}
        </Card>

        <Card
          title="攻击热力图"
          ico="fire"
          meta="周 × 时辰"
          actions={<span className="muted fs-11">最近 7 天</span>}
        >
          <Heatmap
            matrix={heatmap}
            rowLabels={HEATMAP_ROW_LABELS}
            colLabels={HEATMAP_COL_LABELS}
            color="#a855f7"
            height={170}
          />
          <div
            className="flex items-center gap-2 mt-3"
            style={{ justifyContent: 'flex-end', fontSize: 11 }}
          >
            <span className="muted">低</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {[0.15, 0.3, 0.5, 0.7, 0.95].map((o, i) => (
                <span
                  key={i}
                  style={{
                    width: 18,
                    height: 10,
                    borderRadius: 2,
                    background: `rgba(168,85,247,${o})`,
                  }}
                />
              ))}
            </div>
            <span className="muted">高</span>
          </div>
        </Card>
      </div>

      <Card
        title="实时拦截事件"
        ico="alert"
        meta="LIVE STREAM"
        actions={
          <>
            <Tag kind="danger" lg>
              <span className="live-dot" />
              实时
            </Tag>
            <Button variant="ghost" size="sm">
              <Icon name="pause" size={11} className="ico" />
              暂停
            </Button>
            <Button variant="line" size="sm">
              查看全部
            </Button>
          </>
        }
        bodyClass="np"
      >
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>来源 IP</th>
                <th>地区</th>
                <th>目标站点</th>
                <th>攻击类型</th>
                <th>请求</th>
                <th>风险</th>
                <th>处置</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {events.map(e => (
                <tr key={e.id}>
                  <td className="mono fs-11">{e.t}</td>
                  <td className="mono">
                    <span className="t-brand">{e.ip}</span>
                  </td>
                  <td>{e.region}</td>
                  <td>{e.site}</td>
                  <td>
                    <Tag kind={attackTagKind(e.type)}>{e.typeLabel}</Tag>
                  </td>
                  <td
                    className="mono fs-11 muted"
                    style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {e.method} {e.uri}
                  </td>
                  <td>
                    <Tag kind={riskKind(e.risk)}>{e.risk}</Tag>
                  </td>
                  <td>
                    <Tag kind={actionKind(e.action)}>{actionLabel(e.action)}</Tag>
                  </td>
                  <td>
                    <span className="tbl-link">详情</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
