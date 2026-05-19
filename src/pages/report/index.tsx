import { useState } from 'react'
import { Card, Icon, KPI, Tag, Button, Toggle } from '@/components/ui'

export default function ReportsPage() {
  const [tasks, setTasks] = useState([
    { n: '周安全态势', cr: '0 9 * * 1', next: '2026-05-18 09:00', on: true },
    { n: '月度流量分析', cr: '0 8 1 * *', next: '2026-06-01 08:00', on: true },
    { n: '日志归档', cr: '0 2 * * 0', next: '2026-05-24 02:00', on: true },
    { n: '快速摘要', cr: '0 */6 * * *', next: '2026-05-17 18:00', on: false },
  ])

  return (
    <>
      <div className="page-hd">
        <div>
          <h1>
            <span className="ord">NW · 08</span>
            报表中心
          </h1>
          <p>自动化报表 · 多源合并 · 定时下发</p>
        </div>
        <div className="actions">
          <Button variant="line">
            <Icon name="download" size={13} className="ico" />
            批量导出
          </Button>
          <Button variant="pri">
            <Icon name="plus" size={13} className="ico" />
            创建报表
          </Button>
        </div>
      </div>

      <div className="kpi-grid">
        <KPI label="自定义报表" value="12" ico="reports" kind="brand" />
        <KPI label="合并报表" value="5" ico="grid" kind="info" />
        <KPI label="定时任务" value="3" ico="refresh" kind="warn" />
        <KPI label="本月生成" value="86" ico="check" kind="ok" />
      </div>

      <div className="row r-2-1 mb-4">
        <Card
          title="报表列表"
          ico="reports"
          meta="周期 + 手动"
          actions={
            <div className="flex gap-2">
              <input className="input" placeholder="搜索报表" style={{ width: 200 }} />
            </div>
          }
          bodyClass="np"
        >
          <table>
            <thead>
              <tr>
                <th>报表名</th>
                <th>类型</th>
                <th>覆盖</th>
                <th>周期</th>
                <th>最近生成</th>
                <th>大小</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['周安全态势报告', '安全', '全部站点', 'Cron: 0 9 * * 1', '2026-05-11', '4.2 MB'],
                ['月度流量分析', '流量', '官网主站', 'Cron: 0 8 1 * *', '2026-05-01', '8.7 MB'],
                ['攻击事件专项', '事件', 'API 网关', '手动', '2026-05-17', '2.1 MB'],
                ['等保 2.0 合规', '合规', '全部站点', '季度', '2026-04-01', '12.4 MB'],
                ['Q2 安全审计汇总', '合并', '12 周报 + 3 月报', '季度', '2026-04-01', '15.2 MB'],
              ].map(r => (
                <tr key={r[0]}>
                  <td>
                    <span className="tbl-link">{r[0]}</span>
                  </td>
                  <td>
                    <Tag
                      kind={
                        r[1] === '事件'
                          ? 'danger'
                          : r[1] === '合规'
                            ? 'pink'
                            : r[1] === '合并'
                              ? 'warn'
                              : 'info'
                      }
                    >
                      {r[1]}
                    </Tag>
                  </td>
                  <td className="muted fs-12">{r[2]}</td>
                  <td className="mono fs-11">{r[3]}</td>
                  <td className="fs-12">{r[4]}</td>
                  <td className="mono fs-11">{r[5]}</td>
                  <td className="fs-12">
                    <span className="tbl-link">查看</span> · <span className="tbl-link">生成</span>{' '}
                    · <span className="tbl-link">下载</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="定时任务" ico="refresh" meta="活跃 3 / 5">
          {tasks.map((t, i) => (
            <div key={t.n} style={{ padding: '10px 0', borderBottom: '1px solid var(--line-2)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="fw-600 text-0 fs-13">{t.n}</span>
                <Toggle
                  on={t.on}
                  onChange={v =>
                    setTasks(prev => prev.map((x, j) => (i === j ? { ...x, on: v } : x)))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <code className="mono">{t.cr}</code>
                <span className="muted fs-11 mono">下次 {t.next}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card title="操作日志" ico="logs" meta="近 24h 关键操作" bodyClass="np">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>操作人</th>
              <th>动作</th>
              <th>对象</th>
              <th>详情</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['15:30:12', 'admin', '更新策略', '官网主站', '防护等级 低 → 中', '10.0.0.1'],
              ['15:25:08', 'zhangsan', '导出报表', '周安全态势报告', 'PDF · 4.2 MB', '10.0.0.5'],
              ['15:18:45', 'admin', '创建站点', 'm.example.com', '接入移动端网关', '10.0.0.1'],
              ['14:55:22', 'lisi', '修改配置', 'waf-03', '更新网络接口配置', '10.0.2.10'],
              ['14:12:08', 'admin', '新建规则', 'JWT 重放保护', '挑战动作 · 优先级 8', '10.0.0.1'],
            ].map(r => (
              <tr key={r[0]}>
                <td className="mono fs-11">{r[0]}</td>
                <td className="fw-600">{r[1]}</td>
                <td>
                  <Tag kind="info">{r[2]}</Tag>
                </td>
                <td>{r[3]}</td>
                <td className="muted fs-12">{r[4]}</td>
                <td className="mono fs-11 muted">{r[5]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}
