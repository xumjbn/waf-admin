import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Card, Icon, KPI, Tag, Bar, Button } from '@/components/ui'
import { CLUSTERS, INSTANCES, type Instance } from '@/mocks/nebula'
import InstanceDetail from './InstanceDetail'

function InstancesPage() {
  const nav = useNavigate()
  const [list, setList] = useState<Instance[]>(INSTANCES)

  const restart = (id: string) => {
    const inst = list.find(x => x.id === id)
    if (!inst) return
    if (!window.confirm(`确认重启实例 ${inst.id} (${inst.ip})？\n\n重启期间该实例不接收新连接，预计 10-15 秒。`)) return
    setList(prev => prev.map(x => (x.id === id ? { ...x, state: 'offline' as const, uptime: '0s' } : x)))
    setTimeout(() => {
      setList(prev => prev.map(x => (x.id === id ? { ...x, state: 'online' as const, uptime: '12s' } : x)))
    }, 1500)
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
          <Button variant="ghost" onClick={() => window.alert('新增节点向导待接入')}>
            <Icon name="server" size={13} className="ico" />
            新增节点
          </Button>
          <Button variant="pri" onClick={() => window.alert('新建集群向导待接入')}>
            <Icon name="plus" size={13} className="ico" />
            新建集群
          </Button>
        </div>
      </div>

      <div className="kpi-grid">
        <KPI label="总实例数" value="8" ico="server" kind="brand" />
        <KPI label="在线" value="6" ico="check" kind="ok" />
        <KPI label="繁忙 / 离线" value="1 / 1" ico="alert" kind="warn" />
        <KPI label="集群" value="4" ico="grid" kind="info" />
      </div>

      <div className="row r-1-1 mb-4">
        <Card title="集群编排" ico="topology" meta="4 个 · 2 节点冗余">
          {CLUSTERS.map(c => (
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
                  <div className="mono text-0">{c.vip}</div>
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
          ))}
        </Card>

        <Card title="HA 主备状态" ico="refresh" meta="自动切换">
          <table>
            <thead>
              <tr>
                <th>HA 组</th>
                <th>主</th>
                <th>备</th>
                <th>VIP</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['HA-01', 'waf-01', 'waf-02', '10.0.1.100', 'ok'],
                ['HA-02', 'waf-03', 'waf-04', '10.0.2.100', 'ok'],
                ['HA-03', 'waf-05', 'waf-06', '10.0.3.100', 'warn'],
                ['HA-04', 'waf-07', 'waf-08', '10.0.4.100', 'ok'],
              ].map(r => (
                <tr key={r[0]}>
                  <td className="fw-600">{r[0]}</td>
                  <td className="mono">
                    <span className="t-brand">{r[1]}</span>
                  </td>
                  <td className="mono muted">{r[2]}</td>
                  <td className="mono">{r[3]}</td>
                  <td>
                    <Tag kind={r[4] === 'ok' ? 'ok' : 'warn'}>
                      {r[4] === 'ok' ? '同步中' : '检查中'}
                    </Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card
        title="实例列表"
        ico="server"
        meta={`${list.length} 个节点`}
        actions={
          <div className="flex gap-2">
            <input className="input" placeholder="搜索实例 / IP" style={{ width: 220 }} />
            <select className="select">
              <option>全部集群</option>
            </select>
          </div>
        }
        bodyClass="np"
      >
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
            {list.map(i => (
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
                    kind={i.state === 'online' ? 'ok' : i.state === 'busy' ? 'warn' : 'danger'}
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
