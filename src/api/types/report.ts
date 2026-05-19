// 报表模块类型定义
// 对应 API_REFERENCE.md §14

// §14.1 自定义报表
export interface CustomReport {
  id: string
  name: string
  description?: string
  report_type: 'attack' | 'flow' | 'virus' | 'tamper' | 'operation'
  time_range: 'hour' | 'day' | 'week' | 'month' | 'custom'
  start_time?: string
  end_time?: string
  filters?: Record<string, unknown>
  chart_types?: string[]
  created_at?: string
  updated_at?: string
}

// §14.2 合并报表
export interface CombinedReport {
  id: string
  name: string
  description?: string
  report_ids: string[]
  layout: 'vertical' | 'horizontal' | 'grid'
  created_at?: string
  updated_at?: string
}

// §14.3 手动生成的报表
export interface ManualGeneratedReport {
  id: string
  report_id: string
  report_name: string
  report_type: string
  generated_at: string
  file_path: string
  file_size: number
  status: 'success' | 'failed' | 'processing'
  error_message?: string
}

// §14.4 定时生成的报表
export interface TimingGeneratedReport {
  id: string
  timing_id: string
  timing_name: string
  report_id: string
  report_name: string
  generated_at: string
  file_path: string
  file_size: number
  status: 'success' | 'failed'
  error_message?: string
}

// §14.5 定时任务
export interface TimingTask {
  id: string
  name: string
  report_id: string
  report_name?: string
  schedule: string
  enabled: boolean
  last_run?: string
  next_run?: string
  created_at?: string
  updated_at?: string
}

// §14.6 手动触发报表生成请求
export interface GenerateManualReportRequest {
  report_id: string
  format?: 'pdf' | 'html' | 'excel'
}
