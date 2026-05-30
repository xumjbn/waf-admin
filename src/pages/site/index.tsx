import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Card, Icon, KPI, Tag, Bar, Button, Tabs } from '@/components/ui'
import { AreaChart } from '@/components/charts'
import { CLUSTERS, type Site } from '@/mocks/nebula'
import * as siteApi from '@/api/live/site'
import * as logApi from '@/api/live/log'
import SiteWizard from './SiteWizard'
import SiteEdit from './SiteEdit'

type ViewMode = 'topology' | 'list'

const PLACEHOLDER_SITE: Site = {
  id: '',
  name: '加载中…',
  domain: '',
  proto: '—',
  upstream: '—',
  instance: '—',
  rps: 0,
  blockedRate: 0,
  state: 'observe',
}

function SitesPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<ViewMode>('topology')
  const [sites, setSites] = useState<Site[]>([])
  const [selected, setSelected] = useState<Site>(PLACEHOLDER_SITE)

  useEffect(() => {
    siteApi
      .listSites()
      .then(list => {
        setSites(list)
        if (list.length > 0) setSelected(prev => (prev.id ? prev : list[0]))
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.error('[site api]', err)
      })
  }, [])

  return (
    <>
      <div className="page-hd">
        <div>
          <h1>
            <span className="ord">NW · 03</span>
            站点接入 & 防护拓扑
          </h1>
          <p>查看从客户端 → WAF 集群 → 上游服务的全链路防护拓扑</p>
        </div>
        <div className="actions">
          <Tabs
            tabs={[
              { value: 'topology', label: '拓扑视图', ico: 'topology' },
              { value: 'list', label: '列表视图', ico: 'sites' },
            ]}
            value={view}
            onChange={v => setView(v as ViewMode)}
          />
          <Button
            variant="ghost"
            onClick={() => setView('list')}
            title="筛选需要切到列表视图后顶部搜索"
          >
            <Icon name="filter" size={13} className="ico" />
            筛选
          </Button>
          <Button variant="pri" onClick={() => navigate('/site/new')}>
            <Icon name="plus" size={13} className="ico" />
            接入新站点
          </Button>
        </div>
      </div>

      <div className="kpi-grid">
        <KPI label="受保护站点" value="8" ico="sites" kind="brand" delta="+2" deltaDir="up" />
        <KPI label="HTTPS 覆盖" value="100" unit="%" ico="lock" kind="ok" />
        <KPI label="总 QPS" value="56.3K" ico="activity" kind="info" />
        <KPI label="平均拦截率" value="2.8" unit="%" ico="shield" kind="warn" />
      </div>

      {view === 'topology' ? (
        <div className="row r-2-1">
          <Card
            title="防护拓扑"
            ico="topology"
            meta="实时链路"
            actions={
              <>
                <Tag kind="ok">
                  <span className="dot" />
                  正常
                </Tag>
                <Tag kind="warn">
                  <span className="dot" />
                  异常
                </Tag>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    siteApi
                      .listSites()
                      .then(list => {
                        setSites(list)
                        if (list.length > 0)
                          setSelected(prev => (prev.id ? prev : list[0]))
                      })
                      .catch(err => {
                        // eslint-disable-next-line no-console
                        console.error('[site refresh]', err)
                      })
                  }}
                  title="刷新拓扑数据"
                >
                  <Icon name="refresh" size={11} className="ico" />
                </Button>
              </>
            }
            bodyClass="np"
          >
            <TopologyView sites={sites} selected={selected} onSelect={setSelected} />
          </Card>
          <SiteDetailPanel site={selected} />
        </div>
      ) : (
        <SiteListView sites={sites} onPick={setSelected} />
      )}
    </>
  )
}

function TopologyView({
  sites: allSites,
  selected,
  onSelect,
}: {
  sites: Site[]
  selected: Site
  onSelect: (s: Site) => void
}) {
  const sites = allSites.slice(0, 6)

  return (
    <div style={{ position: 'relative', height: 560, overflow: 'hidden' }}>
      <svg
        viewBox="0 0 1000 560"
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient id="topoLink" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity=".5" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity=".4" />
          </linearGradient>
          <linearGradient id="topoLinkOk" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity=".55" />
            <stop offset="100%" stopColor="#10b981" stopOpacity=".4" />
          </linearGradient>
          <radialGradient id="nodeGlow">
            <stop offset="0%" stopColor="#a855f7" stopOpacity=".6" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <text x="100" y="32" style={{ fill: 'var(--text-2)' }} fontSize="11" fontFamily="JetBrains Mono" letterSpacing="2">
          INTERNET / CLIENT
        </text>
        <text x="430" y="32" style={{ fill: 'var(--brand-1)' }} fontSize="11" fontFamily="JetBrains Mono" letterSpacing="2">
          NEBULAWAF · 防护层
        </text>
        <text x="780" y="32" style={{ fill: 'var(--text-2)' }} fontSize="11" fontFamily="JetBrains Mono" letterSpacing="2">
          UPSTREAM / 业务
        </text>

        <line x1="180" x2="180" y1="60" y2="540" stroke="rgba(168,85,247,.15)" strokeDasharray="2 4" />
        <line x1="500" x2="500" y1="60" y2="540" stroke="rgba(168,85,247,.15)" strokeDasharray="2 4" />
        <line x1="820" x2="820" y1="60" y2="540" stroke="rgba(168,85,247,.15)" strokeDasharray="2 4" />

        <g transform="translate(100, 240)">
          <circle r="56" fill="rgba(168,85,247,.05)" stroke="rgba(168,85,247,.3)" strokeDasharray="3 3" />
          <circle r="42" fill="rgba(34,211,238,.06)" stroke="rgba(34,211,238,.25)" />
          <text textAnchor="middle" y="-6" style={{ fill: 'var(--text-1)' }} fontSize="11" fontFamily="JetBrains Mono">
            INTERNET
          </text>
          <text textAnchor="middle" y="10" style={{ fill: 'var(--brand-c)' }} fontSize="20" fontWeight="700">
            ∞
          </text>
          <text textAnchor="middle" y="28" style={{ fill: 'var(--text-3)' }} fontSize="9" fontFamily="JetBrains Mono">
            56.3K QPS
          </text>
        </g>

        {CLUSTERS.map((cl, i) => {
          const y = 100 + i * 110
          return (
            <g key={cl.id} transform={`translate(500, ${y})`}>
              <rect
                x="-90"
                y="-32"
                width="180"
                height="64"
                rx="10"
                style={{ fill: 'var(--bg-2)', fillOpacity: 0.85 }}
                stroke={cl.state === 'ok' ? 'rgba(168,85,247,.5)' : 'rgba(245,158,11,.6)'}
                strokeWidth="1.5"
              />
              <circle r="50" fill="url(#nodeGlow)" opacity={cl.state === 'ok' ? 0.35 : 0.15} />
              <text x="-42" y="-6" style={{ fill: 'var(--text-0)' }} fontSize="12" fontWeight="700">
                {cl.name}
              </text>
              <text x="-42" y="10" style={{ fill: 'var(--text-2)' }} fontSize="10" fontFamily="JetBrains Mono">
                VIP {cl.vip}
              </text>
              <text x="-42" y="24" style={{ fill: 'var(--brand-1)' }} fontSize="9.5" fontFamily="JetBrains Mono">
                {cl.nodes} 节点 · {cl.algo}
              </text>
              <circle cx="74" cy="-18" r="4" fill={cl.state === 'ok' ? '#10b981' : '#f59e0b'}>
                <animate attributeName="opacity" values="1;.3;1" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>
          )
        })}

        {CLUSTERS.map((cl, i) => {
          const y = 100 + i * 110
          const path = `M156 240 Q 330 ${(240 + y) / 2} 410 ${y}`
          return (
            <g key={'l1-' + cl.id}>
              <path d={path} stroke="url(#topoLink)" strokeWidth="2" fill="none" />
              <circle r="3" fill="#ec4899">
                <animateMotion dur={`${2 + i * 0.3}s`} repeatCount="indefinite" path={path} />
              </circle>
            </g>
          )
        })}

        {sites.map((s, i) => {
          const y = 80 + i * 80
          const isSel = s.id === selected.id
          const cl = CLUSTERS.find(c => c.id === s.instance)
          const clIdx = cl ? CLUSTERS.indexOf(cl) : 0
          const clY = 100 + clIdx * 110
          const path = `M590 ${clY} Q 700 ${(clY + y) / 2} 770 ${y}`
          return (
            <g key={s.id} style={{ cursor: 'pointer' }} onClick={() => onSelect(s)}>
              <path
                d={path}
                stroke={isSel ? '#ec4899' : 'url(#topoLinkOk)'}
                strokeWidth={isSel ? 2.5 : 1.5}
                fill="none"
                opacity={isSel ? 1 : 0.6}
              />
              <circle r="2" fill="#22d3ee">
                <animateMotion dur={`${1.8 + i * 0.2}s`} repeatCount="indefinite" path={path} />
              </circle>
              <g transform={`translate(820, ${y})`}>
                <rect
                  x="-46"
                  y="-22"
                  width="160"
                  height="44"
                  rx="8"
                  style={
                    isSel
                      ? { fill: 'rgba(236,72,153,.10)' }
                      : { fill: 'var(--bg-2)', fillOpacity: 0.85 }
                  }
                  stroke={isSel ? '#ec4899' : 'rgba(168,85,247,.25)'}
                  strokeWidth="1.2"
                  filter={isSel ? 'url(#glow)' : 'none'}
                />
                <text x="-8" y="-3" style={{ fill: 'var(--text-0)' }} fontSize="11" fontWeight="600">
                  {s.name}
                </text>
                <text x="-8" y="12" style={{ fill: 'var(--text-2)' }} fontSize="9.5" fontFamily="JetBrains Mono">
                  {s.domain}
                </text>
                <text x="100" y="-3" style={{ fill: 'var(--brand-c)' }} fontSize="10" fontFamily="JetBrains Mono" textAnchor="end">
                  {s.rps}
                </text>
                <text x="100" y="9" style={{ fill: 'var(--text-3)' }} fontSize="8" textAnchor="end">
                  QPS
                </text>
                <circle
                  cx="-50"
                  cy="-15"
                  r="3"
                  fill={s.state === 'protected' ? '#10b981' : s.state === 'paused' ? '#5d556e' : '#f59e0b'}
                />
              </g>
            </g>
          )
        })}
      </svg>

      <div
        style={{
          position: 'absolute',
          bottom: 14,
          right: 14,
          background: 'var(--bg-1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--line-strong)',
          borderRadius: 10,
          padding: '10px 12px',
          fontSize: 11,
          fontFamily: 'JetBrains Mono',
          color: 'var(--text-1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          boxShadow: '0 4px 16px rgba(0,0,0,.08)',
        }}
      >
        <div className="flex items-center gap-2">
          <span style={{ width: 8, height: 2, background: 'var(--brand-1)' }} />
          客户端 → WAF
        </div>
        <div className="flex items-center gap-2">
          <span style={{ width: 8, height: 2, background: 'var(--brand-c)' }} />
          WAF → 业务
        </div>
        <div className="flex items-center gap-2">
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 6px #10b981',
            }}
          />
          健康 · 活跃
        </div>
      </div>
    </div>
  )
}

function SiteDetailPanel({ site }: { site: Site }) {
  const navigate = useNavigate()
  // 近 24h 该站点攻击趋势（真实 —— attack_logs 按小时聚合）。
  const [trend, setTrend] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] })
  useEffect(() => {
    let cancelled = false
    logApi
      .attackTrend({ site: site.name, hours: 24 })
      .then(pts => {
        if (cancelled) return
        setTrend({
          labels: pts.map(p => {
            const d = new Date(p.t)
            return `${String(d.getHours()).padStart(2, '0')}:00`
          }),
          data: pts.map(p => p.count),
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [site.name])

  return (
    <div className="stack">
      <Card title={`站点详情 · ${site.name}`} ico="sites" meta={site.id} bracketed>
        <div className="flex items-center gap-3 mb-3">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'var(--grad-soft)',
              border: '1px solid var(--line-strong)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--brand-1)',
            }}
          >
            <Icon name="sites" size={22} />
          </div>
          <div>
            <div className="fw-700 text-0 fs-14">{site.domain}</div>
            <div className="mono fs-11 muted">{site.proto} · 接入于 2026-04-12</div>
          </div>
          <Tag kind={site.state === 'protected' ? 'ok' : 'def'} style={{ marginLeft: 'auto' }}>
            <span className="dot" />
            {site.state === 'protected' ? '防护中' : site.state === 'observe' ? '观察模式' : '已停用'}
          </Tag>
        </div>

        <div className="row r-1-1 gap-3">
          <Stat label="今日 QPS" value={site.rps.toLocaleString()} hint="峰值 12.4K" />
          <Stat label="拦截率" value={site.blockedRate + '%'} hint="基线 1.2%" tone="warn" />
          <Stat label="上游" value={site.upstream} mono small />
          <Stat label="实例组" value={site.instance} mono small />
        </div>

        <div className="divider-h" />

        <div>
          <div
            className="muted fs-11 mb-2"
            style={{ letterSpacing: 1, textTransform: 'uppercase' }}
          >
            启用模块 · 5/8
          </div>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            <Tag kind="ok">SQLi</Tag>
            <Tag kind="ok">XSS</Tag>
            <Tag kind="ok">CC 防护</Tag>
            <Tag kind="ok">Bot 管理</Tag>
            <Tag kind="ok">API 安全</Tag>
            <Tag kind="def">访问控制</Tag>
            <Tag kind="def">区域屏蔽</Tag>
            <Tag kind="def">证书托管</Tag>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="pri" onClick={() => navigate(`/site/${site.id}/edit`)}>
            <Icon name="edit" size={12} className="ico" />
            编辑站点
          </Button>
          <Button variant="ghost" onClick={() => navigate('/policy')}>
            <Icon name="rules" size={12} className="ico" />
            配置规则
          </Button>
          <Button variant="ghost" onClick={() => navigate('/log')}>
            <Icon name="logs" size={12} className="ico" />
            查看日志
          </Button>
        </div>
      </Card>

      <Card title="近 24h 攻击趋势" ico="activity">
        {trend.data.length > 0 ? (
          <AreaChart
            height={130}
            labels={trend.labels}
            series={[{ label: '攻击', data: trend.data, color: '#a855f7' }]}
          />
        ) : (
          <div className="muted fs-12" style={{ padding: 28, textAlign: 'center' }}>
            该站点近 24h 暂无攻击记录
          </div>
        )}
      </Card>
    </div>
  )
}

interface StatProps {
  label: string
  value: React.ReactNode
  hint?: string
  tone?: 'warn'
  mono?: boolean
  small?: boolean
}
function Stat({ label, value, hint, tone, mono, small }: StatProps) {
  const cls = [
    mono && 'mono',
    tone === 'warn' ? 't-warn' : 'text-0',
    'fw-700',
    small ? 'fs-12' : 'fs-16',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div>
      <div className="muted fs-11" style={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div className={cls} style={{ marginTop: 3 }}>
        {value}
      </div>
      {hint && <div className="muted fs-11">{hint}</div>}
    </div>
  )
}

function SiteListView({ sites, onPick }: { sites: Site[]; onPick: (s: Site) => void }) {
  const navigate = useNavigate()
  return (
    <Card
      title="站点列表"
      ico="sites"
      meta={`${sites.length} 个`}
      actions={
        <div className="flex gap-2">
          <input className="input" placeholder="搜索站点 / 域名" />
          <select className="select">
            <option>全部协议</option>
          </select>
          <select className="select">
            <option>全部状态</option>
          </select>
        </div>
      }
      bodyClass="np"
    >
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>站点</th>
              <th>域名</th>
              <th>协议</th>
              <th>上游</th>
              <th>实例组</th>
              <th>QPS</th>
              <th>拦截率</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sites.map(s => (
              <tr key={s.id}>
                <td>
                  <span className="tbl-link" onClick={() => onPick(s)}>
                    {s.name}
                  </span>
                </td>
                <td className="mono">{s.domain}</td>
                <td>
                  <Tag kind="info">{s.proto}</Tag>
                </td>
                <td className="mono fs-11 muted">{s.upstream}</td>
                <td>{s.instance}</td>
                <td className="mono">{s.rps.toLocaleString()}</td>
                <td>
                  <Bar
                    value={s.blockedRate}
                    max={10}
                    kind={s.blockedRate > 5 ? 'danger' : s.blockedRate > 2 ? 'warn' : 'brand'}
                    width={50}
                    label={s.blockedRate + '%'}
                  />
                </td>
                <td>
                  <Tag kind={s.state === 'protected' ? 'ok' : s.state === 'observe' ? 'warn' : 'def'}>
                    <span className="dot" />
                    {s.state === 'protected' ? '防护中' : s.state === 'observe' ? '观察' : '停用'}
                  </Tag>
                </td>
                <td className="fs-12">
                  <span className="tbl-link" onClick={() => navigate(`/site/${s.id}/edit`)}>
                    编辑
                  </span>{' '}
                  · <span className="tbl-link">规则</span> ·{' '}
                  <span className="tbl-link">日志</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export default function SiteRoutes() {
  return (
    <Routes>
      <Route index element={<SitesPage />} />
      <Route path="new" element={<SiteWizard />} />
      <Route path=":id/edit" element={<SiteEdit />} />
      <Route path="*" element={<Navigate to="/site" replace />} />
    </Routes>
  )
}
