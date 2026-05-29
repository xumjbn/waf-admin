import { useEffect, useMemo, useState } from 'react'
import { Card, Icon, Tag, Button, Tabs } from '@/components/ui'
import { type AttackEvent } from '@/mocks/nebula'
import * as logApi from '@/api/live/log'
import { toCSV } from '@/utils/csv'

type FilterTab = 'all' | 'block' | 'chal' | 'log'

const EMPTY_EVENT: AttackEvent = {
  id: '',
  t: '—',
  ts: 0,
  ip: '—',
  region: '—',
  country: '—',
  lat: 0,
  lng: 0,
  site: '—',
  domain: '—',
  type: '—',
  typeLabel: '—',
  typeColor: '#8e84a3',
  risk: '中',
  action: 'logged',
  method: 'GET',
  uri: '—',
  payload: '',
  ruleId: '—',
  ua: '—',
}

export default function LogsPage() {
  const [allEvents, setAllEvents] = useState<AttackEvent[]>([])
  const [ipFilter, setIpFilter] = useState<string | null>(null)
  const [selected, setSelected] = useState<AttackEvent>(EMPTY_EVENT)
  const [tab, setTab] = useState<FilterTab>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 查询条件（受控）
  const [filter, setFilter] = useState({
    timeRange: '1h',           // 1h / 24h / 7d / custom
    site: '',
    attackType: '',
    risk: '',
    action: '',                // blocked / challenged / logged
    srcIP: '',
  })

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const { items } = await logApi.listAttackLogs({
        pageSize: 200,
        site: filter.site || undefined,
        risk: filter.risk || undefined,
        srcIP: filter.srcIP || undefined,
      })
      // tab + 处置 + attackType 在前端二次过滤（后端不一定全支持）
      let filtered = items
      if (filter.action) {
        filtered = filtered.filter(e => e.action === filter.action)
      }
      if (filter.attackType) {
        const kw = filter.attackType.toLowerCase()
        filtered = filtered.filter(
          e => e.type.toLowerCase() === kw || e.typeLabel.toLowerCase().includes(kw),
        )
      }
      setAllEvents(filtered)
      if (filtered.length > 0) setSelected(prev => (prev.id ? prev : filtered[0]))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // tab 切换在本地过滤已加载的数据（避免每次切都查后端）
  const tabFiltered = useMemo(() => {
    if (tab === 'all') return allEvents
    if (tab === 'block') return allEvents.filter(e => e.action === 'blocked')
    if (tab === 'chal') return allEvents.filter(e => e.action === 'challenged')
    return allEvents.filter(e => e.action === 'logged')
  }, [allEvents, tab])

  const events = useMemo(
    () => (ipFilter ? tabFiltered.filter(e => e.ip === ipFilter) : tabFiltered),
    [tabFiltered, ipFilter],
  )

  const resetAll = () => {
    setIpFilter(null)
    setFilter({ timeRange: '1h', site: '', attackType: '', risk: '', action: '', srcIP: '' })
    setTab('all')
    fetchLogs()
  }

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
          <Button variant="ghost" onClick={fetchLogs} disabled={loading}>
            <Icon name="refresh" size={13} className="ico" />
            刷新
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              // 前端组装 CSV，导出当前过滤后的列表（事件量小，无需后端 export）。
              // csvCell 同时做 RFC 4180 escape + 防御 Excel formula injection：
              // 攻击者把 `=HYPERLINK(...)` 塞到 site/IP/URI 等用户可控字段后，
              // 直接用 Excel 打开 CSV 会被钓鱼。utils/csv.ts 统一处理。
              const header = ['时间', 'IP', '国家', '站点', '类型', '方法', 'URI', '规则 ID', '处置']
              const rows = events.map(e => [
                e.t,
                e.ip,
                e.country,
                e.site,
                e.type,
                e.method,
                e.uri,
                e.ruleId,
                e.action,
              ])
              const csv = toCSV(header, rows)
              const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `attack_logs_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`
              document.body.appendChild(a)
              a.click()
              a.remove()
              URL.revokeObjectURL(url)
            }}
          >
            <Icon name="download" size={13} className="ico" />
            导出 CSV
          </Button>
        </div>
      </div>

      <Card bodyClass="" className="mb-4">
        <div className="frow">
          <div className="field">
            <label>时间范围</label>
            <select
              className="select"
              value={filter.timeRange}
              onChange={e => setFilter(f => ({ ...f, timeRange: e.target.value }))}
            >
              <option value="1h">近 1 小时</option>
              <option value="24h">近 24 小时</option>
              <option value="7d">近 7 天</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          <div className="field">
            <label>站点</label>
            <input
              className="input"
              placeholder="站点名（留空=全部）"
              value={filter.site}
              onChange={e => setFilter(f => ({ ...f, site: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>攻击类型</label>
            <select
              className="select"
              value={filter.attackType}
              onChange={e => setFilter(f => ({ ...f, attackType: e.target.value }))}
            >
              <option value="">全部</option>
              <option value="SQLi">SQLi</option>
              <option value="XSS">XSS</option>
              <option value="CMDi">CMDi</option>
              <option value="LFI">LFI</option>
              <option value="CC">CC</option>
              <option value="BOT">BOT</option>
              <option value="SCAN">SCAN</option>
            </select>
          </div>
          <div className="field">
            <label>风险等级</label>
            <select
              className="select"
              value={filter.risk}
              onChange={e => setFilter(f => ({ ...f, risk: e.target.value }))}
            >
              <option value="">全部</option>
              <option value="高">高</option>
              <option value="中">中</option>
              <option value="低">低</option>
            </select>
          </div>
          <div className="field">
            <label>处置</label>
            <select
              className="select"
              value={filter.action}
              onChange={e => setFilter(f => ({ ...f, action: e.target.value }))}
            >
              <option value="">全部</option>
              <option value="blocked">拦截</option>
              <option value="challenged">挑战</option>
              <option value="logged">记录</option>
            </select>
          </div>
          <div className="field">
            <label>来源 IP / CIDR</label>
            <input
              className="input"
              placeholder="如 1.2.3.4 或 1.2.3.0/24"
              value={filter.srcIP}
              onChange={e => setFilter(f => ({ ...f, srcIP: e.target.value }))}
            />
          </div>
          <Button variant="pri" onClick={fetchLogs} disabled={loading}>
            <Icon name="search" size={13} className="ico" />
            {loading ? '查询中…' : '查询'}
          </Button>
          <Button variant="ghost" onClick={resetAll}>
            {ipFilter ? '清除 IP 关联' : '重置'}
          </Button>
        </div>
        {error && (
          <div
            className="fs-12 mt-3"
            style={{
              padding: '8px 12px',
              background: 'var(--bg-danger-1, #fee2e2)',
              color: 'var(--text-danger, #b91c1c)',
              borderRadius: 6,
            }}
          >
            查询失败：{error}
          </div>
        )}
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
                { value: 'all', label: '全部', count: allEvents.length },
                {
                  value: 'block',
                  label: '拦截',
                  count: allEvents.filter(e => e.action === 'blocked').length,
                },
                {
                  value: 'chal',
                  label: '挑战',
                  count: allEvents.filter(e => e.action === 'challenged').length,
                },
                {
                  value: 'log',
                  label: '记录',
                  count: allEvents.filter(e => e.action === 'logged').length,
                },
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
          onShowRelated={async ev => {
            try {
              const { items } = await logApi.listRelatedEvents(ev.id, 50)
              if (items.length > 0) setAllEvents(items)
              setIpFilter(ev.ip)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            } catch (err) {
              console.error('[related events]', err)
              setIpFilter(ev.ip)
            }
          }}
        />
      </div>
    </>
  )
}

function ForensicsPanel({
  event,
  onShowRelated,
}: {
  event: AttackEvent
  onShowRelated: (ev: AttackEvent) => void
}) {
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
            onClick={async () => {
              if (!window.confirm(`确认将 ${event.ip} 加入封禁列表？\n\n该 IP 将立即被所有站点拒绝访问。`)) return
              try {
                await logApi.banAttackerIP(event.id)
                window.alert(`已封禁 ${event.ip}\n已写入 ACL 黑名单`)
              } catch (err) {
                window.alert(`封禁失败：${(err as Error).message}`)
              }
            }}
          >
            封禁此 IP
          </Button>
          <Button
            variant="line"
            size="sm"
            onClick={async () => {
              if (!window.confirm(`确认将 ${event.ip} 加入白名单？\n\n该 IP 的请求将跳过所有 WAF 检测。`)) return
              try {
                await logApi.whitelistAttackerIP(event.id)
                window.alert(`已加入白名单 · ${event.ip}`)
              } catch (err) {
                window.alert(`加入白名单失败：${(err as Error).message}`)
              }
            }}
          >
            加入白名单
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onShowRelated(event)}>
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
