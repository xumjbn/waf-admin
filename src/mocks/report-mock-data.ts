// 报表模块 mock 数据
// 供 report-handlers.ts 使用
import type {
  CustomReport,
  CombinedReport,
  ManualGeneratedReport,
  TimingGeneratedReport,
  TimingTask,
} from '../api/types/report'

export const genId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

const ts = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString()

// === 自定义报表 ===
export let customReports: CustomReport[] = [
  {
    id: 'cr-001',
    name: '每日攻击汇总报表',
    description: '统计每日攻击事件的类型、来源和趋势',
    report_type: 'attack',
    time_range: 'day',
    filters: { severity: 'high' },
    chart_types: ['bar', 'pie'],
    created_at: ts(30),
    updated_at: ts(2),
  },
  {
    id: 'cr-002',
    name: '周流量分析报表',
    description: '分析一周内的流量变化趋势和异常',
    report_type: 'flow',
    time_range: 'week',
    chart_types: ['line', 'area'],
    created_at: ts(20),
    updated_at: ts(5),
  },
  {
    id: 'cr-003',
    name: '病毒检测月报',
    description: '汇总月度病毒检测和处置情况',
    report_type: 'virus',
    time_range: 'month',
    chart_types: ['bar', 'table'],
    created_at: ts(15),
    updated_at: ts(1),
  },
]

// === 合并报表 ===
export let combinedReports: CombinedReport[] = [
  {
    id: 'cb-001',
    name: '安全态势综合报表',
    description: '合并攻击和病毒检测报表，全面展示安全态势',
    report_ids: ['cr-001', 'cr-003'],
    layout: 'vertical',
    created_at: ts(10),
    updated_at: ts(3),
  },
  {
    id: 'cb-002',
    name: '运维周报',
    description: '合并流量分析和攻击汇总，用于运维周会汇报',
    report_ids: ['cr-001', 'cr-002'],
    layout: 'grid',
    created_at: ts(8),
    updated_at: ts(1),
  },
]

// === 手动生成的报表 ===
export let manualGeneratedReports: ManualGeneratedReport[] = [
  {
    id: 'mg-001',
    report_id: 'cr-001',
    report_name: '每日攻击汇总报表',
    report_type: 'attack',
    generated_at: ts(1),
    file_path: '/reports/output/attack_daily_20260423.pdf',
    file_size: 2048576,
    status: 'success',
  },
  {
    id: 'mg-002',
    report_id: 'cr-002',
    report_name: '周流量分析报表',
    report_type: 'flow',
    generated_at: ts(2),
    file_path: '/reports/output/flow_weekly_20260422.pdf',
    file_size: 1536000,
    status: 'success',
  },
  {
    id: 'mg-003',
    report_id: 'cr-003',
    report_name: '病毒检测月报',
    report_type: 'virus',
    generated_at: ts(0),
    file_path: '',
    file_size: 0,
    status: 'processing',
  },
]

// === 定时生成的报表 ===
export let timingGeneratedReports: TimingGeneratedReport[] = [
  {
    id: 'tg-001',
    timing_id: 'tt-001',
    timing_name: '每日攻击报表定时任务',
    report_id: 'cr-001',
    report_name: '每日攻击汇总报表',
    generated_at: ts(1),
    file_path: '/reports/timing/attack_daily_20260423.pdf',
    file_size: 2150400,
    status: 'success',
  },
  {
    id: 'tg-002',
    timing_id: 'tt-001',
    timing_name: '每日攻击报表定时任务',
    report_id: 'cr-001',
    report_name: '每日攻击汇总报表',
    generated_at: ts(2),
    file_path: '/reports/timing/attack_daily_20260422.pdf',
    file_size: 1987654,
    status: 'success',
  },
  {
    id: 'tg-003',
    timing_id: 'tt-002',
    timing_name: '周流量报表定时任务',
    report_id: 'cr-002',
    report_name: '周流量分析报表',
    generated_at: ts(3),
    file_path: '',
    file_size: 0,
    status: 'failed',
    error_message: '数据源连接超时',
  },
]

// === 定时任务 ===
export let timingTasks: TimingTask[] = [
  {
    id: 'tt-001',
    name: '每日攻击报表定时任务',
    report_id: 'cr-001',
    report_name: '每日攻击汇总报表',
    schedule: '0 8 * * *',
    enabled: true,
    last_run: ts(1),
    next_run: new Date(Date.now() + 86_400_000).toISOString(),
    created_at: ts(30),
    updated_at: ts(1),
  },
  {
    id: 'tt-002',
    name: '周流量报表定时任务',
    report_id: 'cr-002',
    report_name: '周流量分析报表',
    schedule: '0 9 * * 1',
    enabled: true,
    last_run: ts(3),
    next_run: new Date(Date.now() + 4 * 86_400_000).toISOString(),
    created_at: ts(20),
    updated_at: ts(3),
  },
  {
    id: 'tt-003',
    name: '月度安全报表定时任务',
    report_id: 'cb-001',
    report_name: '安全态势综合报表',
    schedule: '0 10 1 * *',
    enabled: false,
    last_run: ts(35),
    created_at: ts(60),
    updated_at: ts(10),
  },
]

// === 更新函数 (不可变) ===
export const updateCustomReports = (data: CustomReport[]) => {
  customReports = data
}
export const updateCombinedReports = (data: CombinedReport[]) => {
  combinedReports = data
}
export const updateManualGeneratedReports = (data: ManualGeneratedReport[]) => {
  manualGeneratedReports = data
}
export const updateTimingGeneratedReports = (data: TimingGeneratedReport[]) => {
  timingGeneratedReports = data
}
export const updateTimingTasks = (data: TimingTask[]) => {
  timingTasks = data
}
