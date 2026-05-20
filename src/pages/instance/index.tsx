import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Card, Icon, KPI, Tag, Bar, Button } from '@/components/ui'
import type { Instance, Cluster } from '@/mocks/nebula'
import * as instanceApi from '@/api/live/instance'
import type { HAGroupRow } from '@/api/live/instance'
import InstanceDetail from './InstanceDetail'

function InstancesPage() {
  const nav = useNavigate()
  const [list, setList] = useState<Instance[]>([])
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [haGroups, setHAGroups] = useState<HAGroupRow[]>([])
  const [filterCluster, setFilterCluster] = useState<string>('')
  const [keyword, setKeyword] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<{
    instances?: string
    clusters?: string
    ha?: string
  }>({})

  const refresh = async () => {
    setLoading(true)
    const [{ instances, clusters: cl, errors: cmErr }, haSafe] = await Promise.all([
      instanceApi.listInstancesWithClusterMap(),
      instanceApi.listHAGroupsSafe(),
    ])
    setList(instances)
    setClusters(cl)
    setHAGroups(haSafe.rows)
    setErrors({
      instances: cmErr.instances,
      clusters: cmErr.clusters,
      ha: haSafe.error,
    })
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  // 真实 KPI：从 list 派生
  const kpi = useMemo(() => {
    let online = 0
    let busy = 0
    let offline = 0
    for (const i of list) {
      if (i.state === 'online') online++
      else if (i.state === 'busy') busy++
      else offline++
    }
    return { total: list.length, online, busy, offline, clusters: clusters.length }
  }, [list, clusters.length])

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return list.filter(i => {
      if (filterCluster && i.cluster !== filterCluster) return false
      if (kw && !i.id.toLowerCase().includes(kw) && !i.ip.toLowerCase().includes(kw)) return false
      return true
    })
  }, [list, keyword, filterCluster])

  const restart = async (id: string) => {
    const inst = list.find(x => x.id === id)
    if (!inst) return
    if (
      !window.confirm(
        `确认重启实例 ${inst.id} (${inst.ip})？\n\n重启期间该实例不接收新连接，预计 10-15 秒。`,
      )
    )
      return
    // 乐观更新 UI
    setList(prev =>
      prev.map(x => (x.id === id ? { ...x, state: 'offline' as const, uptime: '0s' } : x)),
    )
    try {
      await instanceApi.restartInstance(inst.id, 'manual restart from instance page')
      // 真正的回到 online 由下次心跳带回 —— 这里等 8 秒后拉一次
      window.setTimeout(refresh, 8000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      window.alert(`重启失败：${msg}`)
      refresh()
    }
  }

  const addNode = async () => {
    const hostname = window.prompt(
      '新增节点 —— 输入预登记的主机名（实际 register 由 agent 启动后自动完成）：',
      '',
    )
    if (!hostname) return
    const ip = window.prompt('该节点的 IP（可选）：', '') || ''
    try {
      await instanceApi.registerNodeIntent({ hostname, ip })
      window.alert(`已记录预登记意图：${hostname}\n请在该节点部署 waf-agent 后即可自动注册。`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      window.alert(`登记失败：${msg}`)
    }
  }

  const addCluster = async () => {
    const name = window.prompt('集群名称：', '')
    if (!name) return
    const vip = window.prompt('VIP（如 10.0.5.100）：', '') || ''
    const algo =
      window.prompt('调度算法（round-robin / least-conn / ip-hash）：', 'round-robin') ||
      'round-robin'
    try {
      const c = await instanceApi.createCluster({ name, vip, algo })
      setClusters(prev => [...prev, c])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      window.alert(`创建失败：${msg}`)
    }
  }

  const switchHA = async (row: HAGroupRow) => {
    if (!window.confirm(`确认切换 ${row.name}？\n主 ${row.primary} ↔ 备 ${row.standby}`)) return
    try {
      const updated = await instanceApi.switchoverHAGroup(row.id)
      setHAGroups(prev => prev.map(x => (x.id === row.id ? updated : x)))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      window.alert(`切换失败：${msg}`)
    }
  }

  return (
    <>
      <div className="page-hd">
        <div>
          <h1>
            <span className="ord">NW · 06</span>
            防护实例 & 集群
          </h1>
          <p>WAF 实例池 · 集群编排 · 主备 HA · 资源调度</p>
        </div>
        <div className="actions">
          <Button variant="ghost" onClick={addNode}>
            <Icon name="server" size={13} className="ico" />
            新增节点
          </Button>
          <Button variant="pri" onClick={addCluster}>
            <Icon name="plus" size={13} className="ico" />
            新建集群
          </Button>
        </div>
      </div>

      {(errors.instances || errors.clusters || errors.ha) && (
        <div
          className="mb-3"
          style={{
            padding: '10px 14px',
            background: 'var(--bg-warn-1, #fef3c7)',
            color: 'var(--text-warn, #92400e)',
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          <div className="fw-600 mb-1">部分数据加载失败 —— 其他面板仍可用</div>
          {errors.instances && (
            <div>
              · GET /instances：{errors.instances}（agent 服务未就绪或路由未挂载）
            </div>
          )}
          {errors.clusters && (
            <div>
              · GET /clusters：{errors.clusters}（迁移 000009 未执行？后端会在下次启动时自动建表）
            </div>
          )}
          {errors.ha && (
            <div>
              · GET /ha-groups：{errors.ha}（迁移 000017 未执行？后端会在下次启动时自动建表）
            </div>
          )}
        </div>
      )}

      <div className="kpi-grid">
        <KPI label="总实例数" value={String(kpi.total)} ico="server" kind="brand" />
        <KPI label="在线" value={String(kpi.online)} ico="check" kind="ok" />
        <KPI
          label="繁忙 / 离线"
          value={`${kpi.busy} / ${kpi.offline}`}
          ico="alert"
          kind="warn"
        />
        <KPI label="集群" value={String(kpi.clusters)} ico="grid" kind="info" />
      </div>

      <div className="row r-1-1 mb-4">
        <Card
          title="集群编排"
          ico="topology"
          meta={`${clusters.length} 个 · ${clusters.reduce((s, c) => s + c.nodes, 0)} 节点`}
        >
          {clusters.length === 0 ? (
            <div
              className="muted fs-12"
              style={{ padding: '24px 0', textAlign: 'center' }}
            >
              暂无集群，点击右上『新建集群』创建一个。
            </div>
          ) : (
            clusters.map(c => (
              <div
                key={c.id}
                style={{ padding: '12px 0', borderBottom: '1px solid var(--line-2)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: c.state === 'ok' ? '#10b981' : '#f59e0b',
                        boxShadow: `0 0 6px ${c.state === 'ok' ? '#10b981' : '#f59e0b'}`,
                      }}
                    />
                    <span className="fw-700 text-0 fs-13">{c.name}</span>
                    <span className="mono fs-11 muted">{c.id}</span>
                  </div>
                  <Tag kind={c.state === 'ok' ? 'ok' : 'warn'}>
                    {c.state === 'ok' ? '健康' : '降级'}
                  </Tag>
                </div>
                <div className="row r-4 fs-11" style={{ gap: 12 }}>
                  <div>
                    <span className="muted">VIP</span>
                    <div className="mono text-0">{c.vip || '—'}</div>
                  </div>
                  <div>
                    <span className="muted">节点</span>
                    <div className="text-0 fw-600">{c.nodes}</div>
                  </div>
                  <div>
                    <span className="muted">调度</span>
                    <div className="text-0">{c.algo}</div>
                  </div>
                  <div>
                    <span className="muted">站点</span>
                    <div className="text-0 fw-600">{c.site_count} 个</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </Card>

        <Card title="HA 主备状态" ico="refresh" meta={`${haGroups.length} 组 · 点击切换`}>
          {haGroups.length === 0 ? (
            <div
              className="muted fs-12"
              style={{ padding: '24px 0', textAlign: 'center' }}
            >
              暂无 HA 组。后端 ha_groups 表为空 —— 跑迁移 000017 或调 POST
              /api/v1/ha-groups 添加。
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>HA 组</th>
                  <th>主</th>
                  <th>备</th>
                  <th>VIP</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {haGroups.map(r => (
                  <tr key={r.id}>
                    <td className="fw-600">{r.name}</td>
                    <td className="mono">
                      <span className="t-brand">{r.primary}</span>
                    </td>
                    <td className="mono muted">{r.standby}</td>
                    <td className="mono">{r.vip}</td>
                    <td>
                      <Tag kind={r.state === 'ok' ? 'ok' : 'warn'}>
                        {r.state === 'ok' ? '同步中' : '检查中'}
                      </Tag>
                    </td>
                    <td className="fs-12">
                      <span
                        className="tbl-link"
                        style={{ cursor: 'pointer' }}
                        onClick={() => switchHA(r)}
                      >
                        切换
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Card
        title="实例列表"
        ico="server"
        meta={`${filtered.length}/${list.length} 个节点`}
        actions={
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="搜索实例 / IP"
              style={{ width: 220 }}
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
            <select
              className="select"
              value={filterCluster}
              onChange={e => setFilterCluster(e.target.value)}
            >
              <option value="">全部集群</option>
              {clusters.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        }
        bodyClass="np"
      >
        {loading ? (
          <div className="muted fs-12" style={{ padding: '24px 0', textAlign: 'center' }}>
            正在加载实例…
          </div>
        ) : list.length === 0 ? (
          <div className="muted fs-12" style={{ padding: '32px 16px', textAlign: 'center' }}>
            暂无在线 agent。请在防护节点部署 <code>waf-agent</code>{' '}
            并把 <code>[server].address</code> 指向本控制面（gRPC :50051）。
            <br />
            参考：<code>D:/src/OpenWAF/waf-agent/configs/agent.toml</code> · 容器/二进制部署见{' '}
            <code>deploy/agent/</code>。
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>实例</th>
                <th>IP</th>
                <th>集群</th>
                <th>CPU</th>
                <th>内存</th>
                <th>连接数</th>
                <th>QPS</th>
                <th>吞吐</th>
                <th>状态</th>
                <th>运行时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id}>
                  <td className="fw-600">
                    <span
                      className="tbl-link"
                      style={{ cursor: 'pointer' }}
                      onClick={() => nav(`/instance/${i.id}`)}
                    >
                      {i.id}
                    </span>
                  </td>
                  <td className="mono">{i.ip}</td>
                  <td className="muted">{i.cluster}</td>
                  <td>
                    <Bar
                      value={i.cpu}
                      kind={i.cpu > 70 ? 'danger' : i.cpu > 50 ? 'warn' : 'brand'}
                      width={50}
                      label={i.cpu + '%'}
                    />
                  </td>
                  <td>
                    <Bar
                      value={i.mem}
                      kind={i.mem > 70 ? 'danger' : i.mem > 50 ? 'warn' : 'brand'}
                      width={50}
                      label={i.mem + '%'}
                    />
                  </td>
                  <td className="mono">{i.conn.toLocaleString()}</td>
                  <td className="mono t-brand">{i.qps.toLocaleString()}</td>
                  <td className="mono">{i.tp}</td>
                  <td>
                    <Tag
                      kind={
                        i.state === 'online' ? 'ok' : i.state === 'busy' ? 'warn' : 'danger'
                      }
                    >
                      <span className="dot" />
                      {i.state === 'online' ? '在线' : i.state === 'busy' ? '繁忙' : '离线'}
                    </Tag>
                  </td>
                  <td className="muted fs-12">{i.uptime}</td>
                  <td className="fs-12">
                    <span
                      className="tbl-link"
                      style={{ cursor: 'pointer' }}
                      onClick={() => nav(`/instance/${i.id}?tab=detail`)}
                    >
                      详情
                    </span>{' '}
                    ·{' '}
                    <span
                      className="tbl-link"
                      style={{ cursor: 'pointer' }}
                      onClick={() => nav(`/instance/${i.id}?tab=config`)}
                    >
                      配置
                    </span>{' '}
                    ·{' '}
                    <span
                      className="tbl-link"
                      style={{ cursor: 'pointer' }}
                      onClick={() => restart(i.id)}
                    >
                      重启
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  )
}

export default function InstanceRoutes() {
  return (
    <Routes>
      <Route index element={<InstancesPage />} />
      <Route path=":id" element={<InstanceDetail />} />
      <Route path="*" element={<Navigate to="/instance" replace />} />
    </Routes>
  )
}
