import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Card, Icon, KPI, Tag, Bar, Button } from '@/components/ui'
import type { Instance, Cluster } from '@/mocks/nebula'
import * as instanceApi from '@/api/live/instance'
import type { HAGroupRow, ClusterDetail } from '@/api/live/instance'
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
  const [editingClusterId, setEditingClusterId] = useState<string | null>(null)

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
    // 创建完直接打开详情让用户绑节点（之前的痛点：建完没地方加成员）
    setEditingClusterId(c.id)
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
                onClick={() => setEditingClusterId(c.id)}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid var(--line-2)',
                  cursor: 'pointer',
                }}
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
                  <div className="flex items-center gap-2">
                    <Tag kind={c.state === 'ok' ? 'ok' : 'warn'}>
                      {c.state === 'ok' ? '健康' : '降级'}
                    </Tag>
                    <Icon name="chevron-right" size={13} style={{ color: 'var(--text-3)' }} />
                  </div>
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
      {editingClusterId && (
        <ClusterDetailModal
          clusterId={editingClusterId}
          allInstances={list}
          onClose={() => setEditingClusterId(null)}
          onChanged={refresh}
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

// ---------- 弹窗：集群详情 / 编辑 / 成员管理 ----------
// 这是『集群编排』的核心交互入口。打开后做四件事：
//   1. 展示集群基本信息（name / VIP / algo / state / description / 创建时间）
//   2. 编辑表单（inline 保存）
//   3. 成员管理：当前节点列表（带 role 切换 + 移除）+ 添加成员下拉
//   4. 危险区：删除集群（双重确认）
function ClusterDetailModal(props: {
  clusterId: string
  allInstances: Instance[]
  onClose: () => void
  onChanged: () => void
}) {
  const [detail, setDetail] = useState<ClusterDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // 编辑态
  const [name, setName] = useState('')
  const [vip, setVip] = useState('')
  const [algo, setAlgo] = useState('round-robin')
  const [state, setState] = useState<'ok' | 'warn' | 'critical'>('ok')
  const [description, setDescription] = useState('')
  const [dirty, setDirty] = useState(false)

  // 添加成员
  const [addNodeId, setAddNodeId] = useState('')
  const [addRole, setAddRole] = useState<'primary' | 'standby'>('primary')

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await instanceApi.getClusterDetail(props.clusterId)
      setDetail(d)
      setName(d.name)
      setVip(d.vip)
      setAlgo(d.rawAlgo || 'round-robin')
      setState(d.state)
      setDescription(d.description)
      setDirty(false)
      // 默认选第一个未被本集群绑定的实例
      const unbound = props.allInstances.find(i => !d.nodeIds.includes(i.id))
      setAddNodeId(unbound?.id ?? '')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.clusterId])

  const saveEdits = async () => {
    if (!detail) return
    setBusy(true)
    setError(null)
    try {
      await instanceApi.updateCluster(detail.id, {
        name: name.trim(),
        vip: vip.trim(),
        algo,
        state,
        description: description.trim(),
      })
      setDirty(false)
      props.onChanged()
      await refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const addMember = async () => {
    if (!detail || !addNodeId) return
    setBusy(true)
    setError(null)
    try {
      await instanceApi.assignClusterNode(detail.id, addNodeId, addRole)
      props.onChanged()
      await refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const removeMember = async (nodeId: string) => {
    if (!detail) return
    if (!window.confirm(`确认从『${detail.name}』移除节点 ${nodeId}？\n该节点仍会在线，仅解除集群归属。`))
      return
    setBusy(true)
    setError(null)
    try {
      await instanceApi.removeClusterNode(detail.id, nodeId)
      props.onChanged()
      await refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const changeRole = async (nodeId: string, nextRole: 'primary' | 'standby') => {
    if (!detail) return
    setBusy(true)
    setError(null)
    try {
      await instanceApi.assignClusterNode(detail.id, nodeId, nextRole)
      props.onChanged()
      await refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const deleteCluster = async () => {
    if (!detail) return
    if (!window.confirm(`⚠️ 危险操作\n\n确认删除集群『${detail.name}』(${detail.id})？\n\n所有节点归属关系会被清除（节点本身不受影响）。此操作不可撤销。`))
      return
    setBusy(true)
    try {
      await instanceApi.deleteCluster(detail.id)
      props.onChanged()
      props.onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  // 实例 → 行渲染用
  const instanceByID = useMemo(() => {
    const m = new Map<string, Instance>()
    for (const i of props.allInstances) m.set(i.id, i)
    return m
  }, [props.allInstances])

  const unboundInstances = useMemo(() => {
    if (!detail) return [] as Instance[]
    return props.allInstances.filter(i => !detail.nodeIds.includes(i.id))
  }, [props.allInstances, detail])

  return (
    <div
      onClick={props.onClose}
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
          width: 720,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 64px)',
          overflow: 'auto',
          background: 'var(--bg-1)',
          border: '1px solid var(--line-strong)',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 24px 80px rgba(0,0,0,.45)',
        }}
      >
        {loading || !detail ? (
          <div className="muted fs-13" style={{ padding: 32, textAlign: 'center' }}>
            {error ? `加载失败：${error}` : '加载集群详情…'}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: detail.state === 'ok' ? '#10b981' : '#f59e0b',
                      boxShadow: `0 0 6px ${detail.state === 'ok' ? '#10b981' : '#f59e0b'}`,
                    }}
                  />
                  <div className="fw-700 text-0 fs-16">{detail.name}</div>
                  <span className="mono fs-12 muted">ID {detail.id}</span>
                </div>
                <div className="muted fs-12 mt-1">
                  {detail.nodes} 节点 · {detail.siteCount} 站点 · VIP {detail.vip || '—'}
                </div>
              </div>
              <Button variant="ghost" onClick={props.onClose}>
                <Icon name="x" size={13} className="ico" />
                关闭
              </Button>
            </div>

            {error && (
              <div
                className="fs-12 mb-3"
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-danger-1, #fee2e2)',
                  color: 'var(--text-danger, #b91c1c)',
                  borderRadius: 6,
                }}
              >
                {error}
              </div>
            )}

            {/* —— 基本信息（可编辑） —— */}
            <div
              className="fw-700 text-0 fs-13"
              style={{ marginTop: 4, marginBottom: 10 }}
            >
              基本信息
            </div>
            <Field label="集群名称" required>
              <input
                className="input"
                value={name}
                onChange={e => {
                  setName(e.target.value)
                  setDirty(true)
                }}
              />
            </Field>
            <div className="row r-1-1 gap-3">
              <Field label="VIP" hint="对外浮动 IP（由 keepalived/LVS 维护）">
                <input
                  className="input"
                  value={vip}
                  onChange={e => {
                    setVip(e.target.value)
                    setDirty(true)
                  }}
                />
              </Field>
              <Field label="调度算法">
                <select
                  className="select"
                  value={algo}
                  onChange={e => {
                    setAlgo(e.target.value)
                    setDirty(true)
                  }}
                >
                  <option value="round-robin">round-robin · 加权轮询</option>
                  <option value="least-conn">least-conn · 最小连接数</option>
                  <option value="ip-hash">ip-hash · 会话粘滞</option>
                  <option value="sticky">sticky · 自定义粘滞</option>
                </select>
              </Field>
            </div>
            <Field label="状态">
              <select
                className="select"
                value={state}
                onChange={e => {
                  setState(e.target.value as 'ok' | 'warn' | 'critical')
                  setDirty(true)
                }}
              >
                <option value="ok">ok · 健康</option>
                <option value="warn">warn · 降级</option>
                <option value="critical">critical · 严重</option>
              </select>
            </Field>
            <Field label="备注">
              <textarea
                className="input"
                rows={2}
                value={description}
                onChange={e => {
                  setDescription(e.target.value)
                  setDirty(true)
                }}
                style={{ resize: 'vertical' }}
              />
            </Field>
            <div className="flex" style={{ justifyContent: 'flex-end', marginBottom: 18 }}>
              <Button
                variant={dirty ? 'pri' : 'ghost'}
                disabled={!dirty || busy}
                onClick={saveEdits}
              >
                <Icon name="check" size={13} className="ico" />
                {busy ? '保存中…' : dirty ? '保存修改' : '已保存'}
              </Button>
            </div>

            {/* —— 成员节点 —— */}
            <div className="fw-700 text-0 fs-13" style={{ marginBottom: 10 }}>
              成员节点（{detail.nodes}）
            </div>
            {detail.nodeIds.length === 0 ? (
              <div
                className="muted fs-12"
                style={{
                  padding: '16px 0',
                  textAlign: 'center',
                  border: '1px dashed var(--line)',
                  borderRadius: 8,
                  marginBottom: 10,
                }}
              >
                还没有节点加入此集群。请在下方下拉里选实例添加。
              </div>
            ) : (
              <table style={{ marginBottom: 10 }}>
                <thead>
                  <tr>
                    <th>节点 ID</th>
                    <th>IP</th>
                    <th>状态</th>
                    <th>角色</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.nodeIds.map(nid => {
                    const inst = instanceByID.get(nid)
                    return (
                      <tr key={nid}>
                        <td className="mono fw-600">{nid}</td>
                        <td className="mono fs-12 muted">{inst?.ip ?? '—'}</td>
                        <td>
                          {inst ? (
                            <Tag
                              kind={
                                inst.state === 'online'
                                  ? 'ok'
                                  : inst.state === 'busy'
                                    ? 'warn'
                                    : 'danger'
                              }
                            >
                              <span className="dot" />
                              {inst.state === 'online'
                                ? '在线'
                                : inst.state === 'busy'
                                  ? '繁忙'
                                  : '离线'}
                            </Tag>
                          ) : (
                            <Tag kind="def">未连接</Tag>
                          )}
                        </td>
                        <td>
                          <select
                            className="select"
                            style={{ height: 26, fontSize: 12, padding: '0 6px' }}
                            defaultValue="primary"
                            onChange={e =>
                              changeRole(nid, e.target.value as 'primary' | 'standby')
                            }
                          >
                            <option value="primary">primary</option>
                            <option value="standby">standby</option>
                          </select>
                        </td>
                        <td className="fs-12">
                          <span
                            className="tbl-link"
                            style={{ cursor: 'pointer', color: 'var(--danger)' }}
                            onClick={() => removeMember(nid)}
                          >
                            移除
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {/* —— 添加成员 —— */}
            <div
              style={{
                padding: 12,
                border: '1px solid var(--line)',
                borderRadius: 8,
                background: 'var(--bg-0)',
                marginBottom: 18,
                display: 'grid',
                gridTemplateColumns: '1fr 120px 80px',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <select
                className="select"
                value={addNodeId}
                onChange={e => setAddNodeId(e.target.value)}
                disabled={unboundInstances.length === 0}
              >
                {unboundInstances.length === 0 ? (
                  <option value="">所有在线实例均已绑定</option>
                ) : (
                  <>
                    <option value="">选择实例…</option>
                    {unboundInstances.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.id} ({i.ip})
                      </option>
                    ))}
                  </>
                )}
              </select>
              <select
                className="select"
                value={addRole}
                onChange={e => setAddRole(e.target.value as 'primary' | 'standby')}
              >
                <option value="primary">primary</option>
                <option value="standby">standby</option>
              </select>
              <Button
                variant="pri"
                onClick={addMember}
                disabled={!addNodeId || busy}
              >
                <Icon name="plus" size={12} className="ico" />
                添加
              </Button>
            </div>

            {/* —— 危险区 —— */}
            <div
              style={{
                padding: 12,
                border: '1px dashed rgba(239,68,68,.4)',
                borderRadius: 8,
                background: 'rgba(239,68,68,.04)',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="fw-600 fs-13" style={{ color: 'var(--danger)' }}>
                    删除集群
                  </div>
                  <div className="muted fs-11 mt-1">
                    会清除所有节点的归属（节点本身不受影响），站点若绑定此集群会变成无主状态。
                  </div>
                </div>
                <Button variant="ghost" onClick={deleteCluster} disabled={busy}>
                  <Icon name="trash" size={13} className="ico" />
                  删除
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
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
