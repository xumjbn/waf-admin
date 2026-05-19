// MSW handlers for report module
// 对照 API_REFERENCE.md §14
import { http, HttpResponse } from 'msw'
import type {
  CustomReport,
  CombinedReport,
  TimingTask,
  GenerateManualReportRequest,
} from '../api/types/report'
import {
  customReports,
  combinedReports,
  manualGeneratedReports,
  timingGeneratedReports,
  timingTasks,
  updateCustomReports,
  updateCombinedReports,
  updateManualGeneratedReports,
  updateTimingGeneratedReports,
  updateTimingTasks,
  genId,
} from './report-mock-data'

export const reportHandlers = [
  // === §14.1 自定义报表 CRUD ===

  // GET /v1/reports/custom
  http.get('/v1/reports/custom', () => HttpResponse.json({ reports: customReports })),

  // GET /v1/reports/custom/:id
  http.get('/v1/reports/custom/:id', ({ params }) => {
    const report = customReports.find(r => r.id === params.id)
    return report
      ? HttpResponse.json({ report })
      : HttpResponse.json({ error: '自定义报表不存在' }, { status: 404 })
  }),

  // POST /v1/reports/custom
  http.post('/v1/reports/custom', async ({ request }) => {
    const body = (await request.json()) as Partial<CustomReport>
    const newReport: CustomReport = {
      id: genId('cr'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...body,
    } as CustomReport
    updateCustomReports([...customReports, newReport])
    return HttpResponse.json({ report: newReport }, { status: 201 })
  }),

  // PUT /v1/reports/custom/:id
  http.put('/v1/reports/custom/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<CustomReport>
    const index = customReports.findIndex(r => r.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ error: '自定义报表不存在' }, { status: 404 })
    }
    const updated = {
      ...customReports[index],
      ...body,
      updated_at: new Date().toISOString(),
    }
    updateCustomReports([
      ...customReports.slice(0, index),
      updated,
      ...customReports.slice(index + 1),
    ])
    return HttpResponse.json({ report: updated })
  }),

  // DELETE /v1/reports/custom/:id
  http.delete('/v1/reports/custom/:id', ({ params }) => {
    const index = customReports.findIndex(r => r.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ error: '自定义报表不存在' }, { status: 404 })
    }
    updateCustomReports([...customReports.slice(0, index), ...customReports.slice(index + 1)])
    return new HttpResponse(null, { status: 204 })
  }),

  // === §14.2 合并报表 CRUD ===

  // GET /v1/reports/combined
  http.get('/v1/reports/combined', () => HttpResponse.json({ reports: combinedReports })),

  // GET /v1/reports/combined/:id
  http.get('/v1/reports/combined/:id', ({ params }) => {
    const report = combinedReports.find(r => r.id === params.id)
    return report
      ? HttpResponse.json({ report })
      : HttpResponse.json({ error: '合并报表不存在' }, { status: 404 })
  }),

  // POST /v1/reports/combined
  http.post('/v1/reports/combined', async ({ request }) => {
    const body = (await request.json()) as Partial<CombinedReport>
    const newReport: CombinedReport = {
      id: genId('cb'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...body,
    } as CombinedReport
    updateCombinedReports([...combinedReports, newReport])
    return HttpResponse.json({ report: newReport }, { status: 201 })
  }),

  // PUT /v1/reports/combined/:id
  http.put('/v1/reports/combined/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<CombinedReport>
    const index = combinedReports.findIndex(r => r.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ error: '合并报表不存在' }, { status: 404 })
    }
    const updated = {
      ...combinedReports[index],
      ...body,
      updated_at: new Date().toISOString(),
    }
    updateCombinedReports([
      ...combinedReports.slice(0, index),
      updated,
      ...combinedReports.slice(index + 1),
    ])
    return HttpResponse.json({ report: updated })
  }),

  // DELETE /v1/reports/combined/:id
  http.delete('/v1/reports/combined/:id', ({ params }) => {
    const index = combinedReports.findIndex(r => r.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ error: '合并报表不存在' }, { status: 404 })
    }
    updateCombinedReports([...combinedReports.slice(0, index), ...combinedReports.slice(index + 1)])
    return new HttpResponse(null, { status: 204 })
  }),

  // === §14.3 手动生成的报表 ===

  // GET /v1/reports/manual_generated
  http.get('/v1/reports/manual_generated', () =>
    HttpResponse.json({ reports: manualGeneratedReports }),
  ),

  // GET /v1/reports/manual_generated/:id
  http.get('/v1/reports/manual_generated/:id', ({ params }) => {
    const report = manualGeneratedReports.find(r => r.id === params.id)
    return report
      ? HttpResponse.json({ report })
      : HttpResponse.json({ error: '手动生成报表不存在' }, { status: 404 })
  }),

  // DELETE /v1/reports/manual_generated/:id
  http.delete('/v1/reports/manual_generated/:id', ({ params }) => {
    const index = manualGeneratedReports.findIndex(r => r.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ error: '手动生成报表不存在' }, { status: 404 })
    }
    updateManualGeneratedReports([
      ...manualGeneratedReports.slice(0, index),
      ...manualGeneratedReports.slice(index + 1),
    ])
    return new HttpResponse(null, { status: 204 })
  }),

  // === §14.4 定时生成的报表 ===

  // GET /v1/reports/timing_generated
  http.get('/v1/reports/timing_generated', () =>
    HttpResponse.json({ reports: timingGeneratedReports }),
  ),

  // GET /v1/reports/timing_generated/:id
  http.get('/v1/reports/timing_generated/:id', ({ params }) => {
    const report = timingGeneratedReports.find(r => r.id === params.id)
    return report
      ? HttpResponse.json({ report })
      : HttpResponse.json({ error: '定时生成报表不存在' }, { status: 404 })
  }),

  // DELETE /v1/reports/timing_generated/:id
  http.delete('/v1/reports/timing_generated/:id', ({ params }) => {
    const index = timingGeneratedReports.findIndex(r => r.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ error: '定时生成报表不存在' }, { status: 404 })
    }
    updateTimingGeneratedReports([
      ...timingGeneratedReports.slice(0, index),
      ...timingGeneratedReports.slice(index + 1),
    ])
    return new HttpResponse(null, { status: 204 })
  }),

  // === §14.5 定时任务 CRUD ===

  // GET /v1/reports/timing
  http.get('/v1/reports/timing', () => HttpResponse.json({ tasks: timingTasks })),

  // GET /v1/reports/timing/:id
  http.get('/v1/reports/timing/:id', ({ params }) => {
    const task = timingTasks.find(t => t.id === params.id)
    return task
      ? HttpResponse.json({ task })
      : HttpResponse.json({ error: '定时任务不存在' }, { status: 404 })
  }),

  // POST /v1/reports/timing
  http.post('/v1/reports/timing', async ({ request }) => {
    const body = (await request.json()) as Partial<TimingTask>
    const newTask: TimingTask = {
      id: genId('tt'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      next_run: new Date(Date.now() + 86_400_000).toISOString(),
      ...body,
    } as TimingTask
    updateTimingTasks([...timingTasks, newTask])
    return HttpResponse.json({ task: newTask }, { status: 201 })
  }),

  // PUT /v1/reports/timing/:id
  http.put('/v1/reports/timing/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<TimingTask>
    const index = timingTasks.findIndex(t => t.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ error: '定时任务不存在' }, { status: 404 })
    }
    const updated = {
      ...timingTasks[index],
      ...body,
      updated_at: new Date().toISOString(),
    }
    updateTimingTasks([...timingTasks.slice(0, index), updated, ...timingTasks.slice(index + 1)])
    return HttpResponse.json({ task: updated })
  }),

  // DELETE /v1/reports/timing/:id
  http.delete('/v1/reports/timing/:id', ({ params }) => {
    const index = timingTasks.findIndex(t => t.id === params.id)
    if (index === -1) {
      return HttpResponse.json({ error: '定时任务不存在' }, { status: 404 })
    }
    updateTimingTasks([...timingTasks.slice(0, index), ...timingTasks.slice(index + 1)])
    return new HttpResponse(null, { status: 204 })
  }),

  // === §14.6 手动触发报表生成 ===

  // POST /v1/reports/generate_manual_report
  http.post('/v1/reports/generate_manual_report', async ({ request }) => {
    const body = (await request.json()) as GenerateManualReportRequest
    const report = customReports.find(r => r.id === body.report_id)
    if (!report) {
      return HttpResponse.json({ error: '报表模板不存在' }, { status: 404 })
    }
    const newGenerated = {
      id: genId('mg'),
      report_id: body.report_id,
      report_name: report.name,
      report_type: report.report_type,
      generated_at: new Date().toISOString(),
      file_path: `/reports/output/${report.report_type}_${Date.now()}.${body.format || 'pdf'}`,
      file_size: Math.floor(Math.random() * 3000000) + 500000,
      status: 'success' as const,
    }
    updateManualGeneratedReports([...manualGeneratedReports, newGenerated])
    return HttpResponse.json({ report: newGenerated }, { status: 201 })
  }),
]
