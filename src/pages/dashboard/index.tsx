import { useEffect, useMemo, useState } from 'react'
import { Card, Icon, KPI, Tag, Bar, Button } from '@/components/ui'
import { AreaChart, BarChartH, Donut, Heatmap, Radar } from '@/components/charts'
import { AttackGlobe } from '@/components/globe/AttackGlobe'
import { INSTANCES, mkAttack, type AttackEvent } from '@/mocks/nebula'
import * as logApi from '@/api/live/log'

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
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const sparkAttack = useMemo(() => Array.from({ length: 24 }, () => 60 + Math.random() * 140), [])
  const sparkReq = useMemo(() => Array.from({ length: 24 }, () => 800 + Math.random() * 400), [])
  const sparkLatency = useMemo(() => Array.from({ length: 24 }, () => 18 + Math.random() * 12), [])
  const sparkBlock = useMemo(() => Array.from({ length: 24 }, () => 30 + Math.random() * 80), [])

  const trendLabels = useMemo(
    () => Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
    [],
  )
  const trendBlocked = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) =>
        Math.floor(200 + Math.sin(i / 3) * 80 + Math.random() * 100),
      ),
    [],
  )
  const trendPassed = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) =>
        Math.floor(3000 + Math.cos(i / 4) * 800 + Math.random() * 600),
      ),
    [],
  )

  const attackBreakdown = [
    { label: 'SQL 注入', value: 35, color: '#ef4444' },
    { label: 'CC 攻击', value: 22, color: '#f59e0b' },
    { label: 'XSS', value: 16, color: '#ec4899' },
    { label: '恶意 Bot', value: 12, color: '#a855f7' },
    { label: 'API 滥用', value: 8, color: '#22d3ee' },
    { label: '其他', value: 7, color: '#5d556e' },
  ]

  const topSources = [
    { label: '美国 弗吉尼亚', value: 12420, color: '#ec4899' },
    { label: '俄罗斯 莫斯科', value: 10180, color: '#a855f7' },
    { label: '荷兰 阿姆斯特丹', value: 7320, color: '#22d3ee' },
    { label: '越南 河内', value: 5240, color: '#f59e0b' },
    { label: '巴西 圣保罗', value: 3850, color: '#ef4444' },
    { label: '伊朗 德黑兰', value: 2740, color: '#a855f7' },
  ]

  const heatmap = useMemo(
    () =>
      Array.from({ length: 7 }, (_, d) =>
        Array.from({ length: 24 }, (_, h) => {
          const base = h > 8 && h < 22 ? 60 : 20
          const burst = d === 2 && h === 14 ? 90 : 0
          return Math.floor(base + burst + Math.random() * 50)
        }),
      ),
    [],
  )

  const radarSeries = [
    { label: '本月', data: [88, 76, 92, 81, 70, 96], color: '#a855f7' },
    { label: '上月', data: [80, 68, 84, 72, 66, 94], color: '#22d3ee' },
  ]

  const [events, setEvents] = useState<AttackEvent[]>(() =>
    Array.from({ length: 7 }, () => mkAttack()),
  )
  useEffect(() => {
    const id = setInterval(() => {
      setEvents(prev => [mkAttack(), ...prev].slice(0, 7))
    }, 2200)
    return () => clearInterval(id)
  }, [])

  // 地球攻击轨迹：用真实攻击日志的 lat/lng/country 作为数据源。
  // 拉最近 500 条 → 前端按 country 聚合给国家级柱子，单点照样保留。
  // 拉失败/没数据时回退到 mkAttack() mock 让球面也别空着。
  const [globeAttacks, setGlobeAttacks] = useState<AttackEvent[]>([])
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const { items } = await logApi.listAttackLogs({ pageSize: 500 })
        if (cancelled) return
        if (items.length === 0) {
          setGlobeAttacks(Array.from({ length: 50 }, () => mkAttack()))
        } else {
          setGlobeAttacks(items)
        }
      } catch {
        if (!cancelled) setGlobeAttacks(Array.from({ length: 50 }, () => mkAttack()))
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
          <select className="select" defaultValue="24h">
            <option value="24h">近 24 小时</option>
            <option value="7d">近 7 天</option>
            <option value="30d">近 30 天</option>
          </select>
          <Button variant="ghost">
            <Icon name="refresh" size={13} className="ico" />
            刷新
          </Button>
          <Button variant="pri">
            <Icon name="download" size={13} className="ico" />
            导出报告
          </Button>
        </div>
      </div>

      <div className="kpi-grid c5">
        <KPI
          label="今日拦截攻击"
          value="84,620"
          ico="shield"
          kind="danger"
          delta="+12.4%"
          deltaDir="up"
          sparkData={sparkAttack}
          sparkColor="#ef4444"
        />
        <KPI
          label="今日总请求"
          value="2.84M"
          ico="activity"
          kind="brand"
          delta="+3.1%"
          deltaDir="up"
          sparkData={sparkReq}
          sparkColor="#a855f7"
        />
        <KPI
          label="平均响应延迟"
          value="24"
          unit="ms"
          ico="pulse"
          kind="info"
          delta="-2.0ms"
          deltaDir="down"
          sparkData={sparkLatency}
          sparkColor="#22d3ee"
        />
        <KPI
          label="拦截/挑战率"
          value="2.98"
          unit="%"
          ico="crosshair"
          kind="warn"
          delta="+0.4pp"
          deltaDir="up"
          sparkData={sparkBlock}
          sparkColor="#f59e0b"
        />
        <KPI
          label="活跃高危告警"
          value="3"
          ico="alert"
          kind="ok"
          delta="-2"
          deltaDir="down"
          sparkData={[1, 2, 3, 4, 3, 3, 3]}
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
              <Button variant="ghost" size="sm">
                <Icon name="expand" size={11} className="ico" />
              </Button>
            </>
          }
          bodyClass="np"
        >
          <AttackGlobe height={480} attacks={globeAttacks} />
        </Card>

        <div className="stack">
          <Card title="攻击类型分布" ico="crosshair" meta="近 1h">
            <Donut
              data={attackBreakdown}
              size={150}
              thickness={20}
              centerValue="84.6K"
              centerLabel="次拦截"
            />
          </Card>

          <Card title="威胁源 TOP 6" ico="globe" meta="GeoIP">
            <BarChartH data={topSources} height={180} />
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
