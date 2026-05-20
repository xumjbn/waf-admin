import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
  const [showNodeModal, setShowNodeModal] = useState(false)
  const [showClusterModal, setShowClusterModal] = useState(false)

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

  const submitNode = async (payload: {
    hostname: string
    ip: string
    description: string
  }) => {
    await instanceApi.registerNodeIntent(payload)
    setShowNodeModal(false)
  }

  const submitCluster = async (payload: {
    name: string
    vip: string
    algo: string
    description: string
  }) => {
    const c = await instanceApi.createCluster(payload)
    setClusters(prev => [...prev, c])
    setShowClusterModal(false)
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
          <Button variant="ghost" onClick={() => setShowNodeModal(true)}>
            <Icon name="server" size={13} className="ico" />
            新增节点
          </Button>
          <Button variant="pri" onClick={() => setShowClusterModal(true)}>
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

      {showNodeModal && (
        <AddNodeModal
          clusters={clusters}
          onCancel={() => setShowNodeModal(false)}
          onSubmit={submitNode}
        />
      )}
      {showClusterModal && (
        <AddClusterModal
          onCancel={() => setShowClusterModal(false)}
          onSubmit={submitCluster}
        />
      )}
    </>
  )
}

// ---------- 弹窗：新增节点 ----------
// 真正的 register 由 agent 启动后通过 gRPC 自动完成，这里只是给管理员
// 一个『预登记意图』入口，调 POST /instances/register-intent；
// agent 上线后会自然出现在实例列表，无需手动绑定。
function AddNodeModal(props: {
  clusters: Cluster[]
  onCancel: () => void
  onSubmit: (payload: { hostname: string; ip: string; description: string }) => Promise<void>
}) {
  const [hostname, setHostname] = useState('')
  const [ip, setIp] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onConfirm = async () => {
    if (!hostname.trim()) {
      setError('主机名必填')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await props.onSubmit({
        hostname: hostname.trim(),
        ip: ip.trim(),
        description: description.trim(),
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setSubmitting(false)
    }
  }

  return (
    <ModalShell title="新增节点" subtitle="预登记意图 · agent 启动后自动注册" onCancel={props.onCancel}>
      <Field label="主机名" required hint="与节点 agent.toml 中 [agent].hostname 保持一致">
        <input
          className="input"
          value={hostname}
          onChange={e => setHostname(e.target.value)}
          placeholder="如 waf-edge-shanghai-01"
          autoFocus
        />
      </Field>
      <Field label="IP 地址" hint="可选 —— agent 上线时会上报真实 IP，这里仅供检索">
        <input
          className="input"
          value={ip}
          onChange={e => setIp(e.target.value)}
          placeholder="如 10.0.5.21"
        />
      </Field>
      <Field label="备注" hint="可选 —— 部署位置 / 运维负责人 / 资产编号">
        <textarea
          className="input"
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{ resize: 'vertical' }}
        />
      </Field>
      <div
        className="fs-11 muted"
        style={{
          marginTop: 8,
          padding: 10,
          background: 'var(--bg-2)',
          borderRadius: 6,
          lineHeight: 1.6,
        }}
      >
        🛈 接下来：在该节点部署 <code>waf-agent</code>，把{' '}
        <code>configs/agent.toml</code> 的{' '}
        <code>[server].address</code> 指向控制面 gRPC 端口（默认 :50051），启动后将自动出现在『实例列表』。
        {props.clusters.length > 0 && (
          <>
            <br />
            想绑到具体集群？上线后在『集群编排』卡里点对应集群、把节点拉进来即可。
          </>
        )}
      </div>
      <ModalActions
        onCancel={props.onCancel}
        onConfirm={onConfirm}
        confirmText={submitting ? '提交中…' : '记录意图'}
        disabled={submitting}
        error={error}
      />
    </ModalShell>
  )
}

// ---------- 弹窗：新建集群 ----------
function AddClusterModal(props: {
  onCancel: () => void
  onSubmit: (payload: {
    name: string
    vip: string
    algo: string
    description: string
  }) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [vip, setVip] = useState('')
  const [algo, setAlgo] = useState('round-robin')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onConfirm = async () => {
    if (!name.trim()) {
      setError('集群名称必填')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await props.onSubmit({
        name: name.trim(),
        vip: vip.trim(),
        algo,
        description: description.trim(),
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setSubmitting(false)
    }
  }

  return (
    <ModalShell title="新建集群" subtitle="VIP + 调度算法，节点上线后再绑入" onCancel={props.onCancel}>
      <Field label="集群名称" required hint="全局唯一 · 推荐 CLU-XXX 前缀">
        <input
          className="input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="如 CLU-PAYMENT"
          autoFocus
        />
      </Field>
      <Field label="VIP" hint="集群对外暴露的浮动 IP（keepalived/LVS 维护）">
        <input
          className="input"
          value={vip}
          onChange={e => setVip(e.target.value)}
          placeholder="如 10.0.5.100"
        />
      </Field>
      <Field label="调度算法" required>
        <select className="select" value={algo} onChange={e => setAlgo(e.target.value)}>
          <option value="round-robin">round-robin · 加权轮询</option>
          <option value="least-conn">least-conn · 最小连接数</option>
          <option value="ip-hash">ip-hash · 会话粘滞</option>
          <option value="sticky">sticky · 自定义粘滞</option>
        </select>
      </Field>
      <Field label="备注" hint="可选">
        <textarea
          className="input"
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{ resize: 'vertical' }}
        />
      </Field>
      <ModalActions
        onCancel={props.onCancel}
        onConfirm={onConfirm}
        confirmText={submitting ? '创建中…' : '创建集群'}
        disabled={submitting}
        error={error}
      />
    </ModalShell>
  )
}

// ---------- Modal 通用件 ----------
function ModalShell(props: {
  title: string
  subtitle?: string
  onCancel: () => void
  children: ReactNode
}) {
  return (
    <div
      onClick={props.onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13,10,24,.62)',
        backdropFilter: 'blur(4px)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width: 480,
          maxWidth: 'calc(100vw - 32px)',
          background: 'var(--bg-1)',
          border: '1px solid var(--line-strong)',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 24px 80px rgba(0,0,0,.45)',
        }}
      >
        <div className="mb-3">
          <div className="fw-700 text-0 fs-16">{props.title}</div>
          {props.subtitle && <div className="muted fs-12 mt-1">{props.subtitle}</div>}
        </div>
        {props.children}
      </div>
    </div>
  )
}

function Field(props: {
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="mb-3">
      <label
        className="fs-12 fw-600"
        style={{ display: 'block', marginBottom: 6, color: 'var(--text-0)' }}
      >
        {props.label}
        {props.required && <span style={{ color: 'var(--brand-1)', marginLeft: 4 }}>*</span>}
      </label>
      {props.children}
      {props.hint && (
        <div className="muted fs-11" style={{ marginTop: 4 }}>
          {props.hint}
        </div>
      )}
    </div>
  )
}

function ModalActions(props: {
  onCancel: () => void
  onConfirm: () => void
  confirmText: string
  disabled?: boolean
  error?: string | null
}) {
  return (
    <>
      {props.error && (
        <div
          className="fs-12"
          style={{
            padding: '8px 12px',
            marginBottom: 10,
            background: 'var(--bg-danger-1, #fee2e2)',
            color: 'var(--text-danger, #b91c1c)',
            borderRadius: 6,
          }}
        >
          {props.error}
        </div>
      )}
      <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
        <Button variant="ghost" onClick={props.onCancel}>
          取消
        </Button>
        <Button variant="pri" onClick={props.onConfirm} disabled={props.disabled}>
          {props.confirmText}
        </Button>
      </div>
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
