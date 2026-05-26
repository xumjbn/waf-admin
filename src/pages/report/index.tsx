import { useEffect, useMemo, useState } from 'react'
import { Card, Icon, KPI, Tag, Button, Toggle } from '@/components/ui'
import * as reportApi from '@/api/live/report'
import * as instanceApi from '@/api/live/instance'
import type { OperationLogRow } from '@/api/live/instance'

// 报表类型 → UI 中文 label + Tag 配色
const TYPE_META: Record<reportApi.ReportKind, { label: string; kind: 'info' | 'warn' | 'danger' | 'pink' | 'ok' }> = {
  custom: { label: '自定义', kind: 'info' },
  combined: { label: '合并', kind: 'warn' },
  timing: { label: '定时', kind: 'pink' },
  manual: { label: '手动', kind: 'info' },
}

export default function ReportsPage() {
  // 真后端：统一报表列表（custom / combined / timing / manual）
  const [allReports, setAllReports] = useState<reportApi.ReportUnifiedItem[]>([])
  // 真后端：定时任务（侧栏右上小卡）
  const [tasks, setTasks] = useState<reportApi.ReportTask[]>([])
  // 真后端：操作日志（页底）
  const [oplogs, setOplogs] = useState<OperationLogRow[]>([])
  const [keyword, setKeyword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    const [allRes, tasksRes, oplogRes] = await Promise.allSettled([
      reportApi.listAllReports(),
      reportApi.listReportTasks(),
      instanceApi.listOperationLogs({ pathContains: '/reports', pageSize: 20 }),
    ])
    if (allRes.status === 'fulfilled') setAllReports(allRes.value)
    if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value)
    if (oplogRes.status === 'fulfilled') setOplogs(oplogRes.value)
    // 任一致错就提示，但其他面板仍渲染已成功部分
    const errs = [allRes, tasksRes].filter(r => r.status === 'rejected') as PromiseRejectedResult[]
    if (errs.length > 0) {
      setError(errs.map(e => (e.reason instanceof Error ? e.reason.message : String(e.reason))).join('; '))
    }
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  // KPI 派生
  const kpi = useMemo(() => {
    const custom = allReports.filter(r => r.type === 'custom').length
    const combined = allReports.filter(r => r.type === 'combined').length
    const timing = allReports.filter(r => r.type === 'timing').length
    // 『本月生成』：last_run_at 落在本月的 ↓
    const now = new Date()
    const ym = now.getFullYear() * 12 + now.getMonth()
    const thisMonth = allReports.filter(r => {
      if (!r.last_run_at) return false
      const d = new Date(r.last_run_at)
      return d.getFullYear() * 12 + d.getMonth() === ym
    }).length
    return { custom, combined, timing, thisMonth }
  }, [allReports])

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return allReports
    return allReports.filter(
      r => r.name.toLowerCase().includes(kw) || (r.description || '').toLowerCase().includes(kw),
    )
  }, [allReports, keyword])

  const onRun = async (r: reportApi.ReportUnifiedItem) => {
    const key = `${r.type}-${r.id}`
    setBusyId(key)
    try {
      await reportApi.runReport(r.type, r.id)
      window.alert(`已触发『${r.name}』生成，请稍候到列表查看结果`)
      await refresh()
    } catch (e: unknown) {
      window.alert(`生成失败：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusyId(null)
    }
  }

  const onDownload = async (r: reportApi.ReportUnifiedItem) => {
    try {
      const blob = await reportApi.downloadReport(r.type, r.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${r.name}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e: unknown) {
      window.alert(`下载失败：${e instanceof Error ? e.message : String(e)}`)
    }
  }

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
          <Button
            variant="line"
            onClick={async () => {
              // 批量导出 = 当前过滤后列表里所有 enabled 报表逐个 download
              const list = filtered.filter(r => r.is_enabled)
              if (list.length === 0) {
                window.alert('当前过滤结果中没有启用的报表')
                return
              }
              if (!window.confirm(`确认批量下载 ${list.length} 份报表？`)) return
              for (const r of list) {
                // eslint-disable-next-line no-await-in-loop
                await onDownload(r)
              }
            }}
          >
            <Icon name="download" size={13} className="ico" />
            批量导出
          </Button>
          <Button
            variant="pri"
            onClick={() =>
              window.alert(
                '创建报表请到对应类型的子页：\n· 自定义报表 / 合并报表 / 定时任务\n（NW · 08 子页待落地）',
              )
            }
          >
            <Icon name="plus" size={13} className="ico" />
            创建报表
          </Button>
        </div>
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
          部分数据加载失败：{error}
        </div>
      )}

      <div className="kpi-grid">
        <KPI label="自定义报表" value={String(kpi.custom)} ico="reports" kind="brand" />
        <KPI label="合并报表" value={String(kpi.combined)} ico="grid" kind="info" />
        <KPI label="定时任务" value={String(kpi.timing)} ico="refresh" kind="warn" />
        <KPI label="本月生成" value={String(kpi.thisMonth)} ico="check" kind="ok" />
      </div>

      <div className="row r-2-1 mb-4">
        <Card
          title="报表列表"
          ico="reports"
          meta={loading ? '加载中…' : `共 ${filtered.length} 条 / ${allReports.length}`}
          actions={
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="搜索报表"
                style={{ width: 200 }}
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </div>
          }
          bodyClass="np"
        >
          <table>
            <thead>
              <tr>
                <th>报表名</th>
                <th>类型</th>
                <th>调度</th>
                <th>最近生成</th>
                <th>启用</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="muted fs-12"
                    style={{ padding: '32px 0', textAlign: 'center' }}
                  >
                    暂无报表{keyword && `（关键字 "${keyword}"）`}
                  </td>
                </tr>
              )}
              {filtered.map(r => {
                const meta = TYPE_META[r.type] ?? { label: r.type, kind: 'info' as const }
                const key = `${r.type}-${r.id}`
                const busy = busyId === key
                return (
                  <tr key={key}>
                    <td>
                      <div className="fw-600 text-0 fs-13">{r.name}</div>
                      {r.description && <div className="muted fs-11">{r.description}</div>}
                    </td>
                    <td>
                      <Tag kind={meta.kind}>{meta.label}</Tag>
                    </td>
                    <td className="mono fs-11">{r.schedule || '—'}</td>
                    <td className="mono fs-12">
                      {r.last_run_at
                        ? r.last_run_at.replace('T', ' ').replace(/:\d+(\.\d+)?Z?$/, '')
                        : '—'}
                    </td>
                    <td>
                      <Tag kind={r.is_enabled ? 'ok' : 'def'}>{r.is_enabled ? '启用' : '禁用'}</Tag>
                    </td>
                    <td className="fs-12">
                      <span
                        className="tbl-link"
                        style={{ cursor: busy ? 'wait' : 'pointer' }}
                        onClick={() => !busy && onRun(r)}
                      >
                        {busy ? '生成中…' : '立即生成'}
                      </span>
                      {' · '}
                      <span
                        className="tbl-link"
                        style={{ cursor: 'pointer' }}
                        onClick={() => onDownload(r)}
                      >
                        下载
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        <Card title="定时任务" ico="refresh" meta={`活跃 ${tasks.filter(t => t.on).length} / ${tasks.length}`}>
          {tasks.length === 0 && !loading && (
            <div className="muted fs-12" style={{ padding: '16px 0', textAlign: 'center' }}>
              暂无定时任务
            </div>
          )}
          {tasks.map((t, i) => (
            <div key={t.n} style={{ padding: '10px 0', borderBottom: '1px solid var(--line-2)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="fw-600 text-0 fs-13">{t.n}</span>
                <Toggle
                  on={t.on}
                  onChange={v =>
                    // 仅本地切，后端 timing 没有 PUT enabled 端点，留 TODO
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

      <Card title="操作日志" ico="logs" meta={`最近 ${oplogs.length} 条`} bodyClass="np">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>操作人</th>
              <th>方法</th>
              <th>路径</th>
              <th>状态</th>
              <th>来源 IP</th>
            </tr>
          </thead>
          <tbody>
            {oplogs.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="muted fs-12"
                  style={{ padding: '24px 0', textAlign: 'center' }}
                >
                  暂无报表相关操作记录
                </td>
              </tr>
            )}
            {oplogs.map(r => (
              <tr key={r.id}>
                <td className="mono fs-11">
                  {r.createdAt.replace('T', ' ').replace(/\..*$/, '')}
                </td>
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
                <td className="mono fs-11 muted">{r.clientIP}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}
