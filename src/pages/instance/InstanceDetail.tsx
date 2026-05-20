import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Card, Icon, KPI, Tag, Button, Tabs, Toggle, Bar } from '@/components/ui'
import { AreaChart } from '@/components/charts'
import { INSTANCES, type Instance } from '@/mocks/nebula'
import type { Cluster } from '@/mocks/nebula'
import * as instanceApi from '@/api/live/instance'
import type { OperationLogRow } from '@/api/live/instance'

type TabKey = 'detail' | 'config' | 'history'

// 资源限制 + 维护窗口字段（设计稿配置 Tab 右栏）—— 与后端 instance_configs 1:1
interface ExtraConfig {
  maxConnections: number
  maxQps: number
  cpuSoftLimit: number
  maintenanceWindow: string
}

export default function InstanceDetail() {
  const nav = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [sp, setSp] = useSearchParams()
  const [tab, setTab] = useState<TabKey>(((sp.get('tab') as TabKey) || 'detail'))

  // 实例运行时状态：来自 listInstances（agent heartbeat）。
  // INSTANCES mock 作为兜底 —— 后端拿不到时显示设计稿示例值，UI 不会空白。
  const [inst, setInst] = useState<Instance>(() => {
    const found = INSTANCES.find(i => i.id === id) ?? INSTANCES[0]
    return found
  })
  const [clusters, setClusters] = useState<Cluster[]>([])

  // 配置 Tab 的 draft：与后端 instance_configs 字段一一对应 + UI 兼容字段（ip / cluster）
  const [draft, setDraft] = useState<
    Instance & {
      gateway: string
      dns: string
      role: string
      tags: string
    }
  >(() => ({
    ...(INSTANCES.find(i => i.id === id) ?? INSTANCES[0]),
    gateway: '',
    dns: '',
    role: 'data',
    tags: '',
  }))
  const [extra, setExtra] = useState<ExtraConfig>({
    maxConnections: 50000,
    maxQps: 20000,
    cpuSoftLimit: 80,
    maintenanceWindow: '周日 02:00 - 04:00',
  })
  const [enabled, setEnabled] = useState(true)
  const [saved, setSaved] = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const upd = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) =>
    setDraft(d => ({ ...d, [k]: v }))
  const updExtra = <K extends keyof ExtraConfig>(k: K, v: ExtraConfig[K]) =>
    setExtra(e => ({ ...e, [k]: v }))

  // 操作历史
  const [oplogs, setOplogs] = useState<OperationLogRow[]>([])
  const [oplogLoading, setOplogLoading] = useState(false)

  // ---- 数据加载 ----
  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const [i, cls, cfg] = await Promise.all([
          instanceApi.getInstance(id).catch(() => null),
          instanceApi.listClusters().catch(() => [] as Cluster[]),
          instanceApi.getInstanceConfig(id).catch(() => null),
        ])
        if (cancelled) return
        if (i) {
          setInst(i)
          setDraft(d => ({
            ...d,
            ...i,
            // 后端配置覆盖默认
            role: cfg?.role || d.role,
            gateway: cfg?.gateway ?? d.gateway,
            dns: cfg?.dns ?? d.dns,
            tags: cfg?.tags ?? d.tags,
          }))
        }
        setClusters(cls)
        if (cfg) {
          setExtra({
            maxConnections: cfg.max_connections,
            maxQps: cfg.max_qps,
            cpuSoftLimit: cfg.cpu_soft_limit,
            maintenanceWindow: cfg.maintenance_window,
          })
          setEnabled(cfg.enabled)
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[instance detail] load', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  // 切到 history Tab 时按需拉
  useEffect(() => {
    if (tab !== 'history' || !id) return
    setOplogLoading(true)
    instanceApi
      .listOperationLogs({ pathContains: id, pageSize: 50 })
      .then(setOplogs)
      .catch(() => setOplogs([]))
      .finally(() => setOplogLoading(false))
  }, [tab, id])

  const onSave = async () => {
    if (!id) return
    setSaving(true)
    setSaveErr(null)
    try {
      // 1) 实例归属 / 角色 → 走 cluster_members（如果 draft.cluster 改了）
      // 2) instance_configs 的字段 → 走 instances/{id}/config
      await instanceApi.updateInstanceConfig(id, {
        role: draft.role as 'data' | 'control' | 'edge',
        gateway: draft.gateway,
        dns: draft.dns,
        tags: draft.tags,
        enabled,
        max_connections: extra.maxConnections,
        max_qps: extra.maxQps,
        cpu_soft_limit: extra.cpuSoftLimit,
        maintenance_window: extra.maintenanceWindow,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 1600)
    } catch (err: unknown) {
      setSaveErr(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const onRestart = async () => {
    if (!id) return
    if (!window.confirm(`确认重启 ${id}（${inst.ip}）？\n重启期间该实例不接收新连接。`)) return
    try {
      await instanceApi.restartInstance(id, '管理员从实例详情触发重启')
      window.alert('重启已提交，请稍候在实例列表查看状态')
    } catch (err: unknown) {
      window.alert(`重启失败：${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const changeTab = (v: TabKey) => {
    setTab(v)
    setSp({ tab: v }, { replace: true })
  }

  // 资源水位趋势图：当前后端没有时序 metrics endpoint，先用 sin/random 占位
  // 让 UI 设计稿的图表区域不空。等 metrics-history 端点上线后切真数据。
  const trendLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  const trendQps = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) =>
        Math.floor(800 + Math.sin(i / 3) * 300 + Math.random() * 200),
      ),
    [],
  )

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
            <Tag kind={inst.state === 'online' ? 'ok' : inst.state === 'busy' ? 'warn' : 'danger'}>
              <span className="dot" />
              {inst.state === 'online' ? '在线' : inst.state === 'busy' ? '繁忙' : '离线'}
            </Tag>
          </p>
        </div>
        <div className="actions">
          <Button variant="ghost" onClick={() => nav('/instance')}>返回实例列表</Button>
          <Button variant="line" onClick={onRestart}>
            <Icon name="refresh" size={13} className="ico" />
            重启实例
          </Button>
          <Button variant="pri" onClick={onSave} disabled={saving}>
            {saved && <Icon name="check" size={13} className="ico" />}
            {saving ? '保存中…' : saved ? '已保存' : '保存配置'}
          </Button>
        </div>
      </div>

      <div className="kpi-grid">
        <KPI label="CPU" value={`${inst.cpu}`} unit="%" ico="cpu" kind={inst.cpu > 80 ? 'danger' : inst.cpu > 60 ? 'warn' : 'ok'} />
        <KPI label="内存" value={`${inst.mem}`} unit="%" ico="database" kind={inst.mem > 80 ? 'danger' : 'info'} />
        <KPI label="连接数" value={inst.conn.toLocaleString()} ico="activity" kind="info" />
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
          <Card title="资源水位" ico="activity" meta="近 24h">
            <AreaChart
              height={160}
              labels={trendLabels}
              series={[{ label: 'QPS', data: trendQps, color: '#a855f7' }]}
            />
            <div className="stack mt-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="muted fs-12">CPU</span>
                  <span className="mono fs-12">{inst.cpu}%</span>
                </div>
                <Bar value={inst.cpu} max={100} kind={inst.cpu > 80 ? 'danger' : inst.cpu > 60 ? 'warn' : 'ok'} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="muted fs-12">内存</span>
                  <span className="mono fs-12">{inst.mem}%</span>
                </div>
                <Bar value={inst.mem} max={100} kind={inst.mem > 80 ? 'danger' : 'brand'} />
              </div>
            </div>
          </Card>

          <Card title="基础信息" ico="server">
            <table>
              <tbody>
                {[
                  ['实例 ID', inst.id, true],
                  ['IP 地址', inst.ip, true],
                  ['所属集群', inst.cluster, false],
                  ['角色', draft.role, false],
                  ['吞吐', inst.tp, true],
                  ['运行时间', inst.uptime, false],
                  ['标签', draft.tags, false],
                ].map(([k, v, mono]) => (
                  <tr key={String(k)}>
                    <td className="muted fs-12" style={{ width: 110 }}>{k}</td>
                    <td className={mono ? 'mono fs-12' : 'fs-12 text-0'}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === 'config' && (
        <Card title="实例配置" ico="sliders" meta="保存后生效">
          <div className="row r-2-1 gap-3">
            <div className="stack">
              <div className="field">
                <label>实例启用</label>
                <div className="flex items-center gap-2">
                  <Toggle on={enabled} onChange={setEnabled} />
                  <span className="muted fs-12">关闭后停止接收流量，但保留配置与监控</span>
                </div>
              </div>
              <div className="field">
                <label>IP 地址</label>
                <input
                  className="input"
                  value={draft.ip}
                  onChange={e => upd('ip', e.target.value)}
                />
              </div>
              <div className="field">
                <label>所属集群</label>
                <select
                  className="select"
                  value={draft.cluster}
                  onChange={e => upd('cluster', e.target.value)}
                >
                  <option value="">未分配</option>
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
                  value={draft.role}
                  onChange={e => upd('role', e.target.value)}
                >
                  <option value="data">数据面（处理流量）</option>
                  <option value="control">控制面（仅 API/管理）</option>
                  <option value="edge">边缘（CDN 协同）</option>
                </select>
              </div>
              <div className="field">
                <label>默认网关</label>
                <input
                  className="input"
                  value={draft.gateway}
                  onChange={e => upd('gateway', e.target.value)}
                />
              </div>
              <div className="field">
                <label>DNS 服务器</label>
                <input
                  className="input"
                  value={draft.dns}
                  onChange={e => upd('dns', e.target.value)}
                />
              </div>
              <div className="field">
                <label>标签（逗号分隔）</label>
                <input
                  className="input"
                  value={draft.tags}
                  onChange={e => upd('tags', e.target.value)}
                  placeholder="prod, edge, dmz"
                />
              </div>
            </div>

            <div className="stack">
              <Card title="资源限制" ico="cpu">
                <div className="stack">
                  <div className="field">
                    <label>最大连接数</label>
                    <input
                      type="number"
                      className="input"
                      value={extra.maxConnections}
                      onChange={e =>
                        updExtra('maxConnections', Number(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="field">
                    <label>QPS 上限</label>
                    <input
                      type="number"
                      className="input"
                      value={extra.maxQps}
                      onChange={e => updExtra('maxQps', Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="field">
                    <label>CPU 软限制（%）</label>
                    <input
                      type="number"
                      className="input"
                      min={0}
                      max={100}
                      value={extra.cpuSoftLimit}
                      onChange={e =>
                        updExtra('cpuSoftLimit', Number(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
              </Card>

              <Card title="维护窗口" ico="settings">
                <div className="field">
                  <label>每周维护时段</label>
                  <input
                    className="input"
                    value={extra.maintenanceWindow}
                    onChange={e => updExtra('maintenanceWindow', e.target.value)}
                  />
                </div>
                <div className="muted fs-11 mt-2">
                  维护窗口内允许重启 / 升级；窗口外重启将触发严重告警。
                </div>
              </Card>
            </div>
          </div>
          {saveErr && (
            <div
              className="fs-12 mt-3"
              style={{
                padding: '8px 12px',
                background: 'var(--bg-danger-1, #fee2e2)',
                color: 'var(--text-danger, #b91c1c)',
                borderRadius: 6,
              }}
            >
              保存失败：{saveErr}
            </div>
          )}
        </Card>
      )}

      {tab === 'history' && (
        <Card
          title="操作历史"
          ico="logs"
          meta={`最近 ${oplogs.length} 条`}
          bodyClass="np"
        >
          {oplogLoading ? (
            <div
              className="muted fs-13"
              style={{ padding: '32px 0', textAlign: 'center' }}
            >
              加载中…
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>操作人</th>
                  <th>动作</th>
                  <th>详情</th>
                  <th>来源 IP</th>
                </tr>
              </thead>
              <tbody>
                {oplogs.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="muted fs-12"
                      style={{ padding: '24px 0', textAlign: 'center' }}
                    >
                      暂无操作记录
                    </td>
                  </tr>
                )}
                {oplogs.map(r => (
                  <tr key={r.id}>
                    <td className="mono fs-12">
                      {r.createdAt.replace('T', ' ').replace(/\..*$/, '')}
                    </td>
                    <td className="fw-600 fs-12">{r.username}</td>
                    <td>
                      <Tag kind="info">{r.method}</Tag>
                    </td>
                    <td className="mono fs-11">{r.path}</td>
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
