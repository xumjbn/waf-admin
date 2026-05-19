// MSW handlers for operation logs and web audit
// 对照 API_REFERENCE.md §8-§9
import { http, HttpResponse } from 'msw'
import { operationLogs, updateOperationLogs } from './log-mock-data'

// CSV 导出辅助
const toCSV = (headers: string[], rows: string[][]) => {
  const lines = [headers.join(','), ...rows.map(r => r.join(','))]
  return lines.join('\n')
}

export const logOpsHandlers = [
  // === §8 操作日志 ===

  // GET /v1/operation_logs
  http.get('/v1/operation_logs', () => HttpResponse.json({ operation_logs: operationLogs })),

  // GET /v1/operation_log_num
  http.get('/v1/operation_log_num', () => HttpResponse.json({ total: operationLogs.length })),

  // DELETE /v1/operation_logs
  http.delete('/v1/operation_logs', () => {
    updateOperationLogs([])
    return new HttpResponse(null, { status: 204 })
  }),

  // POST /v1/operation_logs/query
  http.post('/v1/operation_logs/query', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const filtered = operationLogs.filter(log => {
      if (body.user_name && log.user_name !== body.user_name) return false
      if (body.operation && log.operation !== body.operation) return false
      if (body.result && log.result !== body.result) return false
      return true
    })
    return HttpResponse.json({ operation_logs: filtered })
  }),

  // GET /v1/operation_logs/export
  http.get('/v1/operation_logs/export', () => {
    const headers = ['ID', '时间', '用户', '操作', '资源', '结果', '详情']
    const rows = operationLogs.map(l => [
      l.id,
      l.datetime,
      l.user_name,
      l.operation,
      l.resource,
      l.result,
      l.detail ?? '',
    ])
    const csv = toCSV(headers, rows)
    return new HttpResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="operation_logs.csv"',
      },
    })
  }),

  // GET /v1/operation_logs/back_up
  http.get('/v1/operation_logs/back_up', () => {
    const backup = JSON.stringify({
      operation_logs: operationLogs,
      exported_at: new Date().toISOString(),
    })
    return new HttpResponse(backup, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="operation_logs_backup.json"',
      },
    })
  }),

  // POST /v1/operation_logs/import_backup
  http.post('/v1/operation_logs/import_backup', async () => {
    // 模拟导入成功
    return HttpResponse.json({ message: '备份导入成功', imported: operationLogs.length })
  }),

  // === §9 Web 审计 ===

  // GET /v1/web_access/:siteId/type/:repType
  http.get('/v1/web_access/:siteId/type/:repType', ({ params }) =>
    HttpResponse.json({
      site_id: params.siteId,
      rep_type: params.repType,
      data: {
        total_requests: 12580,
        unique_visitors: 3420,
        bandwidth: '2.5 GB',
        top_pages: [
          { url: '/index.html', visits: 4520 },
          { url: '/api/data', visits: 3210 },
          { url: '/login', visits: 1890 },
        ],
        top_referrers: [
          { referrer: 'https://www.google.com', count: 2100 },
          { referrer: 'direct', count: 1850 },
        ],
        status_codes: { '200': 10200, '301': 580, '404': 320, '500': 45 },
      },
    }),
  ),

  // GET /v1/web_access/:siteId/statistics/:id
  http.get('/v1/web_access/:siteId/statistics/:id', ({ params }) =>
    HttpResponse.json({
      id: params.id,
      site_id: params.siteId,
      statistics_data: {
        period: '2024-06-01 ~ 2024-06-30',
        total_requests: 385000,
        avg_response_time: '120ms',
        peak_qps: 850,
        error_rate: '0.35%',
      },
    }),
  ),

  // POST /v1/web_access/:siteId
  http.post('/v1/web_access/:siteId', ({ params }) =>
    HttpResponse.json(
      {
        message: '手动统计任务已提交',
        site_id: params.siteId,
        task_id: `task-${Date.now()}`,
      },
      { status: 201 },
    ),
  ),

  // DELETE /v1/web_access
  http.delete('/v1/web_access', () => new HttpResponse(null, { status: 204 })),
]
