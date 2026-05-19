import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Card, Icon, KPI, Tag, Button, Tabs, Toggle, Bar } from '@/components/ui'
import { AreaChart } from '@/components/charts'
import { INSTANCES, CLUSTERS, type Instance } from '@/mocks/nebula'

type TabKey = 'detail' | 'config' | 'history'

export default function InstanceDetail() {
  const nav = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [sp, setSp] = useSearchParams()

  const inst = useMemo(() => INSTANCES.find(i => i.id === id) ?? INSTANCES[0], [id])
  const [tab, setTab] = useState<TabKey>(((sp.get('tab') as TabKey) || 'detail'))

  const [draft, setDraft] = useState<Instance & { gateway: string; dns: string; role: string; tags: string }>({
    ...inst,
    gateway: '10.0.2.1',
    dns: '10.0.0.2, 10.0.0.3',
    role: 'data',
    tags: 'prod, edge',
  })

  const [enabled, setEnabled] = useState(inst.state !== 'offline')
  const [saved, setSaved] = useState(false)
  const upd = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft(d => ({ ...d, [k]: v }))

  const onSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
  }

  const changeTab = (v: TabKey) => {
    setTab(v)
    setSp({ tab: v }, { replace: true })
  }

  const trendLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  const trendQps = Array.from({ length: 24 }, () => Math.floor(800 + Math.random() * 1200))

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
          <Button variant="line">
            <Icon name="refresh" size={13} className="ico" />
            重启实例
          </Button>
          <Button variant="pri" onClick={onSave}>
            {saved && <Icon name="check" size={13} className="ico" />}
            {saved ? '已保存' : '保存配置'}
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
        items={[
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
                <Bar value={inst.mem} max={100} kind={inst.mem > 80 ? 'danger' : 'info'} />
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
                  {CLUSTERS.map(c => (
                    <option key={c.id} value={c.id}>{c.name}（{c.id}）</option>
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
                    <input type="number" className="input" defaultValue={50000} />
                  </div>
                  <div className="field">
                    <label>QPS 上限</label>
                    <input type="number" className="input" defaultValue={20000} />
                  </div>
                  <div className="field">
                    <label>CPU 软限制（%）</label>
                    <input type="number" className="input" defaultValue={80} />
                  </div>
                </div>
              </Card>

              <Card title="维护窗口" ico="settings">
                <div className="field">
                  <label>每周维护时段</label>
                  <input className="input" defaultValue="周日 02:00 - 04:00" />
                </div>
                <div className="muted fs-11 mt-2">
                  维护窗口内允许重启 / 升级；窗口外重启将触发严重告警。
                </div>
              </Card>
            </div>
          </div>
        </Card>
      )}

      {tab === 'history' && (
        <Card title="操作历史" ico="logs" meta="最近 20 条" bodyClass="np">
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
              {[
                ['2026-05-19 14:32', 'admin', '修改配置', '更新 CPU 软限制 70 → 80', '10.0.0.5'],
                ['2026-05-19 09:10', 'lisi', '重启实例', '手动触发', '10.0.2.10'],
                ['2026-05-18 22:08', 'system', '自动扩容', 'QPS > 阈值触发', '—'],
                ['2026-05-18 03:00', 'system', '维护窗口', '内核升级 5.15 → 5.18', '—'],
                ['2026-05-17 16:45', 'wangwu', '修改配置', '更换 DNS', '10.0.2.21'],
              ].map((r, idx) => (
                <tr key={idx}>
                  <td className="mono fs-12">{r[0]}</td>
                  <td className="fw-600 fs-12">{r[1]}</td>
                  <td><Tag kind="info">{r[2]}</Tag></td>
                  <td className="fs-12">{r[3]}</td>
                  <td className="mono fs-12 muted">{r[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  )
}
