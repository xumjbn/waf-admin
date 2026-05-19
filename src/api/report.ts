// 报表模块 API
// 对应 API_REFERENCE.md §14
import { requestV1 } from './request'
import type {
  CustomReport,
  CombinedReport,
  ManualGeneratedReport,
  TimingGeneratedReport,
  TimingTask,
  GenerateManualReportRequest,
} from './types/report'

// === §14.1 自定义报表 CRUD ===

// GET /reports/custom
export const listCustomReports = () =>
  requestV1.get<never, { reports: CustomReport[] }>('/reports/custom')

// GET /reports/custom/{id}
export const getCustomReport = (id: string) =>
  requestV1.get<never, { report: CustomReport }>(`/reports/custom/${id}`)

// POST /reports/custom
export const createCustomReport = (data: Omit<CustomReport, 'id' | 'created_at' | 'updated_at'>) =>
  requestV1.post<never, { report: CustomReport }>('/reports/custom', data)

// PUT /reports/custom/{id}
export const updateCustomReport = (id: string, data: Partial<CustomReport>) =>
  requestV1.put<never, { report: CustomReport }>(`/reports/custom/${id}`, data)

// DELETE /reports/custom/{id}
export const deleteCustomReport = (id: string) => requestV1.delete(`/reports/custom/${id}`)

// === §14.2 合并报表 CRUD ===

// GET /reports/combined
export const listCombinedReports = () =>
  requestV1.get<never, { reports: CombinedReport[] }>('/reports/combined')

// GET /reports/combined/{id}
export const getCombinedReport = (id: string) =>
  requestV1.get<never, { report: CombinedReport }>(`/reports/combined/${id}`)

// POST /reports/combined
export const createCombinedReport = (
  data: Omit<CombinedReport, 'id' | 'created_at' | 'updated_at'>,
) => requestV1.post<never, { report: CombinedReport }>('/reports/combined', data)

// PUT /reports/combined/{id}
export const updateCombinedReport = (id: string, data: Partial<CombinedReport>) =>
  requestV1.put<never, { report: CombinedReport }>(`/reports/combined/${id}`, data)

// DELETE /reports/combined/{id}
export const deleteCombinedReport = (id: string) => requestV1.delete(`/reports/combined/${id}`)

// === §14.3 手动生成的报表 ===

// GET /reports/manual_generated
export const listManualGeneratedReports = () =>
  requestV1.get<never, { reports: ManualGeneratedReport[] }>('/reports/manual_generated')

// GET /reports/manual_generated/{id}
export const getManualGeneratedReport = (id: string) =>
  requestV1.get<never, { report: ManualGeneratedReport }>(`/reports/manual_generated/${id}`)

// DELETE /reports/manual_generated/{id}
export const deleteManualGeneratedReport = (id: string) =>
  requestV1.delete(`/reports/manual_generated/${id}`)

// === §14.4 定时生成的报表 ===

// GET /reports/timing_generated
export const listTimingGeneratedReports = () =>
  requestV1.get<never, { reports: TimingGeneratedReport[] }>('/reports/timing_generated')

// GET /reports/timing_generated/{id}
export const getTimingGeneratedReport = (id: string) =>
  requestV1.get<never, { report: TimingGeneratedReport }>(`/reports/timing_generated/${id}`)

// DELETE /reports/timing_generated/{id}
export const deleteTimingGeneratedReport = (id: string) =>
  requestV1.delete(`/reports/timing_generated/${id}`)

// === §14.5 定时任务 CRUD ===

// GET /reports/timing
export const listTimingTasks = () =>
  requestV1.get<never, { tasks: TimingTask[] }>('/reports/timing')

// GET /reports/timing/{id}
export const getTimingTask = (id: string) =>
  requestV1.get<never, { task: TimingTask }>(`/reports/timing/${id}`)

// POST /reports/timing
export const createTimingTask = (
  data: Omit<TimingTask, 'id' | 'created_at' | 'updated_at' | 'last_run' | 'next_run'>,
) => requestV1.post<never, { task: TimingTask }>('/reports/timing', data)

// PUT /reports/timing/{id}
export const updateTimingTask = (id: string, data: Partial<TimingTask>) =>
  requestV1.put<never, { task: TimingTask }>(`/reports/timing/${id}`, data)

// DELETE /reports/timing/{id}
export const deleteTimingTask = (id: string) => requestV1.delete(`/reports/timing/${id}`)

// === §14.6 手动触发报表生成 ===

// POST /reports/generate_manual_report
export const generateManualReport = (data: GenerateManualReportRequest) =>
  requestV1.post<never, { report: ManualGeneratedReport }>('/reports/generate_manual_report', data)
