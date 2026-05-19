// MSW handlers for log module
// 对照 API_REFERENCE.md §4-§9
import { http, HttpResponse } from 'msw'
import type {
  AttackQueryCriteria,
  AttackLogBackupTiming,
  FlowQueryOperation,
} from '../api/types/log'
import {
  attackLogs,
  attackQueryCriteria,
  attackLogBackupTiming,
  flowLogs,
  flowQueryOperations,
  antiVirusLogs,
  antiTamperLogs,
  updateAttackLogs,
  updateAttackQueryCriteria,
  updateAttackLogBackupTiming,
  updateFlowLogs,
  updateFlowQueryOperations,
  updateAntiVirusLogs,
  updateAntiTamperLogs,
  genId,
} from './log-mock-data'

// CSV 导出辅助
const toCSV = (headers: string[], rows: string[][]) => {
  const lines = [headers.join(','), ...rows.map(r => r.join(','))]
  return lines.join('\n')
}

export const logHandlers = [
  // === §4 攻击日志 ===

  // GET /v1/attack_logs
  http.get('/v1/attack_logs', () => HttpResponse.json({ attack_logs: attackLogs })),

  // GET /v1/attack_logs/:id
  http.get('/v1/attack_logs/:id', ({ params }) => {
    const log = attackLogs.find(l => l.id === params.id)
    return log
      ? HttpResponse.json({ attack_log: log })
      : HttpResponse.json({ error: '攻击日志不存在' }, { status: 404 })
  }),

  // POST /v1/attack_logs/query/custom
  http.post('/v1/attack_logs/query/custom', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const filtered = attackLogs.filter(log => {
      if (body.severity && log.severity !== body.severity) return false
      if (body.action && log.action !== body.action) return false
      if (body.category && log.category !== body.category) return false
      return true
    })
    return HttpResponse.json({ attack_logs: filtered })
  }),

  // GET /v1/attack_logs_num
  http.get('/v1/attack_logs_num', () => HttpResponse.json({ total: attackLogs.length })),

  // GET /v1/attack_logs_export
  http.get('/v1/attack_logs_export', () => {
    const headers = [
      'ID',
      '时间',
      '源IP',
      '目标IP',
      '主机',
      'URL',
      '动作',
      '严重度',
      '规则名称',
      '分类',
    ]
    const rows = attackLogs.map(l => [
      l.id,
      l.datetime,
      l.src_ip,
      l.dst_ip,
      l.host,
      l.url,
      l.action,
      l.severity,
      l.rule_name,
      l.category,
    ])
    const csv = toCSV(headers, rows)
    return new HttpResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="attack_logs.csv"',
      },
    })
  }),

  // DELETE /v1/attack_logs
  http.delete('/v1/attack_logs', () => {
    updateAttackLogs([])
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /v1/attack_query_criteria
  http.get('/v1/attack_query_criteria', () =>
    HttpResponse.json({ attack_query_criteria: attackQueryCriteria }),
  ),

  // GET /v1/attack_query_criteria/:id
  http.get('/v1/attack_query_criteria/:id', ({ params }) => {
    const criteria = attackQueryCriteria.find(c => c.id === params.id)
    return criteria
      ? HttpResponse.json({ attack_query_criteria: criteria })
      : HttpResponse.json({ error: '查询条件不存在' }, { status: 404 })
  }),

  // POST /v1/attack_query_criteria
  http.post('/v1/attack_query_criteria', async ({ request }) => {
    const body = (await request.json()) as Partial<AttackQueryCriteria>
    const newCriteria: AttackQueryCriteria = { id: genId('aqc'), ...body } as AttackQueryCriteria
    updateAttackQueryCriteria([...attackQueryCriteria, newCriteria])
    return HttpResponse.json({ attack_query_criteria: newCriteria }, { status: 201 })
  }),

  // PUT /v1/attack_query_criteria/:id
  http.put('/v1/attack_query_criteria/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<AttackQueryCriteria>
    const index = attackQueryCriteria.findIndex(c => c.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ error: '查询条件不存在' }, { status: 404 })
    }
    const updated = { ...attackQueryCriteria[index], ...body }
    updateAttackQueryCriteria([
      ...attackQueryCriteria.slice(0, index),
      updated,
      ...attackQueryCriteria.slice(index + 1),
    ])
    return HttpResponse.json({ attack_query_criteria: updated })
  }),

  // DELETE /v1/attack_query_criteria/:id
  http.delete('/v1/attack_query_criteria/:id', ({ params }) => {
    const index = attackQueryCriteria.findIndex(c => c.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ error: '查询条件不存在' }, { status: 404 })
    }
    updateAttackQueryCriteria([
      ...attackQueryCriteria.slice(0, index),
      ...attackQueryCriteria.slice(index + 1),
    ])
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /v1/data_maintenance/attack_log_backup_timing
  http.get('/v1/data_maintenance/attack_log_backup_timing', () =>
    HttpResponse.json(attackLogBackupTiming),
  ),

  // PUT /v1/data_maintenance/attack_log_backup_timing
  http.put('/v1/data_maintenance/attack_log_backup_timing', async ({ request }) => {
    const body = (await request.json()) as AttackLogBackupTiming
    updateAttackLogBackupTiming(body)
    return HttpResponse.json(body)
  }),

  // === §5 流量日志 ===

  // POST /v1/flow-logs/query
  http.post('/v1/flow-logs/query', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const filtered = flowLogs.filter(log => {
      if (body.protocol && log.protocol !== body.protocol) return false
      if (body.app_name && log.app_name !== body.app_name) return false
      return true
    })
    return HttpResponse.json({ flow_logs: filtered })
  }),

  // POST /v1/flow-logs/count
  http.post('/v1/flow-logs/count', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const filtered = flowLogs.filter(log => {
      if (body.protocol && log.protocol !== body.protocol) return false
      if (body.app_name && log.app_name !== body.app_name) return false
      return true
    })
    return HttpResponse.json({ total: filtered.length })
  }),

  // GET /v1/flow-logs/query/operation
  http.get('/v1/flow-logs/query/operation', () =>
    HttpResponse.json({ operations: flowQueryOperations }),
  ),

  // GET /v1/flow-logs/query/operation/:id
  http.get('/v1/flow-logs/query/operation/:id', ({ params }) => {
    const operation = flowQueryOperations.find(o => o.id === params.id)
    return operation
      ? HttpResponse.json({ operation })
      : HttpResponse.json({ error: '查询操作不存在' }, { status: 404 })
  }),

  // POST /v1/flow-logs/query/operation
  http.post('/v1/flow-logs/query/operation', async ({ request }) => {
    const body = (await request.json()) as Partial<FlowQueryOperation>
    const newOperation: FlowQueryOperation = { id: genId('fqo'), ...body } as FlowQueryOperation
    updateFlowQueryOperations([...flowQueryOperations, newOperation])
    return HttpResponse.json({ operation: newOperation }, { status: 201 })
  }),

  // PUT /v1/flow-logs/query/operation/:id
  http.put('/v1/flow-logs/query/operation/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<FlowQueryOperation>
    const index = flowQueryOperations.findIndex(o => o.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ error: '查询操作不存在' }, { status: 404 })
    }
    const updated = { ...flowQueryOperations[index], ...body }
    updateFlowQueryOperations([
      ...flowQueryOperations.slice(0, index),
      updated,
      ...flowQueryOperations.slice(index + 1),
    ])
    return HttpResponse.json({ operation: updated })
  }),

  // DELETE /v1/flow-logs/query/operation/:id
  http.delete('/v1/flow-logs/query/operation/:id', ({ params }) => {
    const index = flowQueryOperations.findIndex(o => o.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ error: '查询操作不存在' }, { status: 404 })
    }
    updateFlowQueryOperations([
      ...flowQueryOperations.slice(0, index),
      ...flowQueryOperations.slice(index + 1),
    ])
    return new HttpResponse(null, { status: 204 })
  }),

  // DELETE /v1/flow-logs/clear
  http.delete('/v1/flow-logs/clear', () => {
    updateFlowLogs([])
    return new HttpResponse(null, { status: 204 })
  }),

  // === §6 防病毒日志 ===

  // GET /v1/anti_virus_logs
  http.get('/v1/anti_virus_logs', () => HttpResponse.json({ anti_virus_logs: antiVirusLogs })),

  // GET /v1/anti_virus_logs/:id
  http.get('/v1/anti_virus_logs/:id', ({ params }) => {
    const log = antiVirusLogs.find(l => l.id === params.id)
    return log
      ? HttpResponse.json({ anti_virus_log: log })
      : HttpResponse.json({ error: '防病毒日志不存在' }, { status: 404 })
  }),

  // GET /v1/anti_virus_logs_amount
  http.get('/v1/anti_virus_logs_amount', () => HttpResponse.json({ total: antiVirusLogs.length })),

  // DELETE /v1/anti_virus_logs
  http.delete('/v1/anti_virus_logs', () => {
    updateAntiVirusLogs([])
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /v1/anti_virus_logs_export
  http.get('/v1/anti_virus_logs_export', () => {
    const headers = ['ID', '时间', '站点', '文件名', '病毒名', '动作', '源IP']
    const rows = antiVirusLogs.map(l => [
      l.id,
      l.datetime,
      l.site_name,
      l.file_name,
      l.virus_name,
      l.action,
      l.src_ip,
    ])
    const csv = toCSV(headers, rows)
    return new HttpResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="anti_virus_logs.csv"',
      },
    })
  }),

  // === §7 防篡改日志 ===

  // GET /v1/anti_tamper_logs
  http.get('/v1/anti_tamper_logs', () => HttpResponse.json({ anti_tamper_logs: antiTamperLogs })),

  // GET /v1/anti_tamper_logs/:id
  http.get('/v1/anti_tamper_logs/:id', ({ params }) => {
    const log = antiTamperLogs.find(l => l.id === params.id)
    return log
      ? HttpResponse.json({ anti_tamper_log: log })
      : HttpResponse.json({ error: '防篡改日志不存在' }, { status: 404 })
  }),

  // GET /v1/anti_tamper_log_num
  http.get('/v1/anti_tamper_log_num', () => HttpResponse.json({ total: antiTamperLogs.length })),

  // DELETE /v1/anti_tamper_logs
  http.delete('/v1/anti_tamper_logs', () => {
    updateAntiTamperLogs([])
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /v1/anti_tamper_logs/:id/old_file/:fileName
  http.get('/v1/anti_tamper_logs/:id/old_file/:fileName', ({ params }) => {
    const log = antiTamperLogs.find(l => l.id === params.id)
    if (!log) {
      return HttpResponse.json({ error: '防篡改日志不存在' }, { status: 404 })
    }
    const content = `原始文件内容: ${params.fileName}\n这是模拟的原始文件内容。`
    return new HttpResponse(content, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${params.fileName}"`,
      },
    })
  }),

  // GET /v1/anti_tamper_logs/:id/new_file/:fileName
  http.get('/v1/anti_tamper_logs/:id/new_file/:fileName', ({ params }) => {
    const log = antiTamperLogs.find(l => l.id === params.id)
    if (!log) {
      return HttpResponse.json({ error: '防篡改日志不存在' }, { status: 404 })
    }
    const content = `篡改后文件内容: ${params.fileName}\n这是模拟的篡改后文件内容。`
    return new HttpResponse(content, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${params.fileName}"`,
      },
    })
  }),

  // PUT /v1/anti_tamper_logs/:id/confirm_update
  http.put('/v1/anti_tamper_logs/:id/confirm_update', ({ params }) => {
    const index = antiTamperLogs.findIndex(l => l.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ error: '防篡改日志不存在' }, { status: 404 })
    }
    const updated = { ...antiTamperLogs[index], status: 'confirmed' as const }
    updateAntiTamperLogs([
      ...antiTamperLogs.slice(0, index),
      updated,
      ...antiTamperLogs.slice(index + 1),
    ])
    return HttpResponse.json({ anti_tamper_log: updated })
  }),
]
