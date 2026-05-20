import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Card, Icon, KPI, Tag, Button, Tabs, Bar } from '@/components/ui'
import type { Instance, Cluster } from '@/mocks/nebula'
import * as instanceApi from '@/api/live/instance'
import type { OperationLogRow } from '@/api/live/instance'

type TabKey = 'detail' | 'config' | 'history'

export default function InstanceDetail() {
  const nav = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [sp, setSp] = useSearchParams()
  const [tab, setTab] = useState<TabKey>(((sp.get('tab') as TabKey) || 'detail'))

  const [inst, setInst] = useState<Instance | null>(null)
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [oplogs, setOplogs] = useState<OperationLogRow[]>([])
  const [oplogLoading, setOplogLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 集群归属选择 / 角色（仅这两个字段会真正落到 cluster_members）
  const [selectedCluster, setSelectedCluster] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<'primary' | 'standby'>('primary')
  const [saving, setSaving] = useState(false)
  const [saveOk, setSaveOk] = useState(false)
  const [restarting, setRestarting] = useState(false)

  const refresh = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [i, cls] = await Promise.all([
        instanceApi.getInstance(id),
        instanceApi.listClusters(),
      ])
      setInst(i)
      setClusters(cls)
      if (i) {
        // i.cluster 是 cluster 名（在 listInstancesWithClusterMap 里就反查过）；
        // 详情页可能拿不到名，回退到 'cluster-default' —— 用户在 select 里再选。
        const matched = cls.find(c => c.name === i.cluster || c.id === i.cluster)
        setSelectedCluster(matched?.id ?? '')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // 切到 history Tab 时按需拉
  useEffect(() => {
    if (tab !== 'history' || !id) return
    setOplogLoading(true)
    // 用实例 id 做 path 子串过滤，命中 /instances/...?hostname=<id>、
    // /clusters/.../nodes/<id> 等所有涉及该节点的操作
    instanceApi
      .listOperationLogs({ pathContains: id, pageSize: 50 })
      .then(setOplogs)
      .catch(err => {
        // eslint-disable-next-line no-console
        console.warn('[oplog]', err)
        setOplogs([])
      })
      .finally(() => setOplogLoading(false))
  }, [tab, id])

  const changeTab = (v: TabKey) => {
    setTab(v)
    setSp({ tab: v }, { replace: true })
  }

  const assignToCluster = async () => {
    if (!inst || !selectedCluster) return
    setSaving(true)
    setSaveOk(false)
    setError(null)
    try {
      await instanceApi.assignClusterNode(selectedCluster, inst.id, selectedRole)
      setSaveOk(true)
      window.setTimeout(() => setSaveOk(false), 1800)
      await refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const removeFromCluster = async () => {
    if (!inst || !selectedCluster) return
    if (!window.confirm(`从集群中移除 ${inst.id}？\n节点本身不受影响。`)) return
    setSaving(true)
    setError(null)
    try {
      await instanceApi.removeClusterNode(selectedCluster, inst.id)
      setSelectedCluster('')
      await refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const restart = async () => {
    if (!inst) return
    if (!window.confirm(`确认重启 ${inst.id}（${inst.ip}）？\n重启期间不接收新连接。`)) return
    setRestarting(true)
    setError(null)
    try {
      await instanceApi.restartInstance(inst.id, '管理员从实例详情页触发重启')
      window.setTimeout(refresh, 5000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRestarting(false)
    }
  }

  if (loading) {
    return (
      <div className="muted fs-13" style={{ padding: 32, textAlign: 'center' }}>
        加载实例详情…
      </div>
    )
  }
  if (!inst) {
    return (
      <div className="muted fs-13" style={{ padding: 32, textAlign: 'center' }}>
        实例 {id} 不在线或已下线。
        <div className="mt-3">
          <Button variant="ghost" onClick={() => nav('/instance')}>
            返回实例列表
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="page-hd">
        <div>
          <h1>
            <span className="ord">NW · 06 · 实例</span>
            {inst.id} · {inst.ip}
          </h1>
          <p>
            集群 {inst.cluster} · 已运行 {inst.uptime} ·{' '}
            <Tag
              kind={
                inst.state === 'online' ? 'ok' : inst.state === 'busy' ? 'warn' : 'danger'
              }
            >
              <span className="dot" />
              {inst.state === 'online' ? '在线' : inst.state === 'busy' ? '繁忙' : '离线'}
            </Tag>
          </p>
        </div>
        <div className="actions">
          <Button variant="ghost" onClick={() => nav('/instance')}>
            返回实例列表
          </Button>
          <Button variant="line" onClick={restart} disabled={restarting}>
            <Icon name="refresh" size={13} className="ico" />
            {restarting ? '重启中…' : '重启实例'}
          </Button>
        </div>
      </div>

      {error && (
        <div
          className="mb-3"
          style={{
            padding: '8px 14px',
            background: 'var(--bg-danger-1, #fee2e2)',
            color: 'var(--text-danger, #b91c1c)',
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div className="kpi-grid">
        <KPI
          label="CPU"
          value={`${inst.cpu}`}
          unit="%"
          ico="cpu"
          kind={inst.cpu > 80 ? 'danger' : inst.cpu > 60 ? 'warn' : 'ok'}
        />
        <KPI
          label="内存"
          value={`${inst.mem}`}
          unit="%"
          ico="database"
          kind={inst.mem > 80 ? 'danger' : 'info'}
        />
        <KPI
          label="连接数"
          value={inst.conn.toLocaleString()}
          ico="activity"
          kind="info"
        />
        <KPI label="QPS" value={inst.qps.toLocaleString()} ico="pulse" kind="brand" />
      </div>

      <Tabs
        tabs={[
          { value: 'detail', label: '详情', ico: 'eye' },
          { value: 'config', label: '配置', ico: 'sliders' },
          { value: 'history', label: '操作历史', ico: 'logs' },
        ]}
        value={tab}
        onChange={v => changeTab(v as TabKey)}
      />

      {tab === 'detail' && (
        <div className="row r-1-1 gap-3">
          <Card title="实时资源水位" ico="activity" meta="来自最近一次 heartbeat">
            <div className="stack">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="muted fs-12">CPU</span>
                  <span className="mono fs-12">{inst.cpu}%</span>
                </div>
                <Bar
                  value={inst.cpu}
                  max={100}
                  kind={inst.cpu > 80 ? 'danger' : inst.cpu > 60 ? 'warn' : 'ok'}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="muted fs-12">内存</span>
                  <span className="mono fs-12">{inst.mem}%</span>
                </div>
                <Bar
                  value={inst.mem}
                  max={100}
                  kind={inst.mem > 80 ? 'danger' : 'brand'}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="muted fs-12">连接数</span>
                  <span className="mono fs-12">{inst.conn.toLocaleString()}</span>
                </div>
                <Bar value={Math.min(100, inst.conn / 500)} max={100} kind="brand" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="muted fs-12">QPS</span>
                  <span className="mono fs-12">{inst.qps.toLocaleString()}</span>
                </div>
                <Bar value={Math.min(100, inst.qps / 200)} max={100} kind="brand" />
              </div>
            </div>
            <div
              className="muted fs-11 mt-3"
              style={{ padding: 8, background: 'var(--bg-2)', borderRadius: 6 }}
            >
              🛈 时序指标（CPU/QPS 趋势图）需要 metrics pipeline 落地后才能渲染；
              当前只展示最近一次 heartbeat 采样值，请配合实例列表的自动刷新看趋势。
            </div>
          </Card>

          <Card title="基础信息" ico="server">
            <table>
              <tbody>
                {(
                  [
                    ['实例 ID', inst.id, true],
                    ['IP 地址', inst.ip, true],
                    ['所属集群', inst.cluster, false],
                    ['网络吞吐', inst.tp, true],
                    ['连接数', inst.conn.toLocaleString(), true],
                    ['QPS', inst.qps.toLocaleString(), true],
                    ['运行时间', inst.uptime, false],
                    ['状态', inst.state, false],
                  ] as Array<[string, string | number, boolean]>
                ).map(([k, v, mono]) => (
                  <tr key={k}>
                    <td className="muted fs-12" style={{ width: 110 }}>
                      {k}
                    </td>
                    <td className={mono ? 'mono fs-12' : 'fs-12 text-0'}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === 'config' && (
        <Card title="实例配置" ico="sliders" meta="只显示 control 真正能改的字段">
          <div className="row r-1-1 gap-4">
            <div className="stack">
              <div className="field">
                <label>集群归属</label>
                <select
                  className="select"
                  value={selectedCluster}
                  onChange={e => setSelectedCluster(e.target.value)}
                >
                  <option value="">未分配（请先选集群再保存）</option>
                  {clusters.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}（{c.id}）
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>角色</label>
                <select
                  className="select"
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value as 'primary' | 'standby')}
                >
                  <option value="primary">primary · 主</option>
                  <option value="standby">standby · 备</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="pri"
                  onClick={assignToCluster}
                  disabled={!selectedCluster || saving}
                >
                  {saveOk ? (
                    <>
                      <Icon name="check" size={13} className="ico" /> 已保存
                    </>
                  ) : (
                    <>
                      <Icon name="check" size={13} className="ico" /> 保存归属
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={removeFromCluster}
                  disabled={!selectedCluster || saving}
                >
                  从集群移除
                </Button>
              </div>
              <div
                className="muted fs-11 mt-2"
                style={{
                  padding: 10,
                  background: 'var(--bg-2)',
                  borderRadius: 6,
                  lineHeight: 1.6,
                }}
              >
                💡 「集群归属」会写入 <code>cluster_members</code> 表（
                <code>PUT /clusters/&#123;id&#125;/nodes/&#123;nodeId&#125;</code>）。
                这是 control 真正能远程改的实例配置。
              </div>
            </div>

            <Card title="agent.toml 控制的字段（只读）" ico="settings">
              <div
                className="muted fs-12"
                style={{ lineHeight: 1.8, padding: '4px 0' }}
              >
                以下字段由节点本地 <code>configs/agent.toml</code> 控制，control
                不通过 UI 下发：
                <ul style={{ paddingLeft: 18, margin: '8px 0' }}>
                  <li>
                    <code>[agent]</code> node_id / hostname / data_dir
                  </li>
                  <li>
                    <code>[server]</code> address / tls_enabled
                  </li>
                  <li>
                    <code>[nginx]</code> config_dir / modsec_dir / reload_cmd
                  </li>
                  <li>
                    <code>[collector]</code> interval_sec
                  </li>
                  <li>
                    <code>[reporter]</code> base_url / auth_token
                  </li>
                </ul>
                改这些字段需要登录节点编辑配置文件 + 重启 waf-agent 进程。
                未来如要支持远程下发，需扩 proto 加 ConfigApplier.SetAgentConfig RPC。
              </div>
            </Card>
          </div>
        </Card>
      )}

      {tab === 'history' && (
        <Card title="操作历史" ico="logs" meta={`最近 ${oplogs.length} 条（按实例 ID 过滤）`} bodyClass="np">
          {oplogLoading ? (
            <div className="muted fs-13" style={{ padding: 32, textAlign: 'center' }}>
              加载操作日志…
            </div>
          ) : oplogs.length === 0 ? (
            <div
              className="muted fs-12"
              style={{ padding: 32, textAlign: 'center', lineHeight: 1.8 }}
            >
              暂无与此实例相关的操作日志。
              <br />
              管理员在 UI 上操作（重启 / 集群归属变更等）会自动通过 <code>middleware/oplog.go</code> 落到 <code>operation_logs</code> 表，再到这里。
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>操作人</th>
                  <th>方法</th>
                  <th>路径</th>
                  <th>状态</th>
                  <th>耗时</th>
                  <th>来源 IP</th>
                </tr>
              </thead>
              <tbody>
                {oplogs.map(r => (
                  <tr key={r.id}>
                    <td className="mono fs-12">{r.createdAt.replace('T', ' ').replace(/\..*$/, '')}</td>
                    <td className="fw-600 fs-12">{r.username}</td>
                    <td>
                      <Tag kind="info">{r.method}</Tag>
                    </td>
                    <td className="mono fs-11 text-0">{r.path}</td>
                    <td>
                      <Tag
                        kind={
                          r.statusCode >= 500
                            ? 'danger'
                            : r.statusCode >= 400
                              ? 'warn'
                              : 'ok'
                        }
                      >
                        {r.statusCode}
                      </Tag>
                    </td>
                    <td className="mono fs-12 muted">{r.durationMs}ms</td>
                    <td className="mono fs-12 muted">{r.clientIP}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </>
  )
}
