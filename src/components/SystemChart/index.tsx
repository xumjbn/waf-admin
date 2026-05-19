import { useMemo, memo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'

interface SystemChartProps {
  timestamps: string[]
  cpuData: number[]
  memoryData: number[]
  diskData: number[]
  height?: number
}

const COLORS = {
  cpu: '#0066ff',
  memory: '#00c853',
  disk: '#ff9800',
  warning: '#fdd835',
  critical: '#f44336',
} as const

function createGradient(color: string): {
  type: 'linear'
  x: number
  y: number
  x2: number
  y2: number
  colorStops: { offset: number; color: string }[]
} {
  return {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: color + '40' },
      { offset: 1, color: color + '05' },
    ],
  }
}

function SystemChart({
  timestamps,
  cpuData,
  memoryData,
  diskData,
  height = 400,
}: SystemChartProps) {
  const option: EChartsOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985',
          },
        },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return ''
          const time = params[0].axisValue
          let result = `<div style="font-weight: 600; margin-bottom: 8px;">${time}</div>`
          params.forEach((item: any) => {
            result += `
              <div style="display: flex; align-items: center; margin: 4px 0;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${item.color}; margin-right: 8px;"></span>
                <span style="flex: 1;">${item.seriesName}:</span>
                <span style="font-weight: 600; margin-left: 8px;">${item.value}%</span>
              </div>
            `
          })
          return result
        },
      },
      legend: {
        data: ['CPU', '内存', '磁盘'],
        top: 10,
        textStyle: {
          fontSize: 13,
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 60,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timestamps,
        axisLine: {
          lineStyle: {
            color: '#e0e0e0',
          },
        },
        axisLabel: {
          color: '#666',
          fontSize: 12,
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%',
          color: '#666',
          fontSize: 12,
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
          },
        },
      },
      series: [
        {
          name: 'CPU',
          type: 'line',
          smooth: true,
          data: cpuData,
          lineStyle: {
            width: 2,
            color: COLORS.cpu,
          },
          itemStyle: {
            color: COLORS.cpu,
          },
          areaStyle: {
            color: createGradient(COLORS.cpu),
          },
          emphasis: {
            focus: 'series',
          },
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              {
                yAxis: 75,
                lineStyle: {
                  color: COLORS.warning,
                  type: 'dashed',
                  width: 2,
                },
                label: {
                  formatter: '警告: 75%',
                  position: 'end',
                  color: COLORS.warning,
                },
              },
              {
                yAxis: 90,
                lineStyle: {
                  color: COLORS.critical,
                  type: 'dashed',
                  width: 2,
                },
                label: {
                  formatter: '严重: 90%',
                  position: 'end',
                  color: COLORS.critical,
                },
              },
            ],
          },
        },
        {
          name: '内存',
          type: 'line',
          smooth: true,
          data: memoryData,
          lineStyle: {
            width: 2,
            color: COLORS.memory,
          },
          itemStyle: {
            color: COLORS.memory,
          },
          areaStyle: {
            color: createGradient(COLORS.memory),
          },
          emphasis: {
            focus: 'series',
          },
        },
        {
          name: '磁盘',
          type: 'line',
          smooth: true,
          data: diskData,
          lineStyle: {
            width: 2,
            color: COLORS.disk,
          },
          itemStyle: {
            color: COLORS.disk,
          },
          areaStyle: {
            color: createGradient(COLORS.disk),
          },
          emphasis: {
            focus: 'series',
          },
        },
      ],
    }),
    [timestamps, cpuData, memoryData, diskData],
  )

  const latestCpu = cpuData[cpuData.length - 1] ?? 0
  const latestMemory = memoryData[memoryData.length - 1] ?? 0
  const latestDisk = diskData[diskData.length - 1] ?? 0

  return (
    <div
      role="img"
      aria-label={`系统资源监控图表。CPU: ${latestCpu.toFixed(1)}%, 内存: ${latestMemory.toFixed(1)}%, 磁盘: ${latestDisk.toFixed(1)}%`}
    >
      <ReactECharts option={option} style={{ height }} opts={{ renderer: 'canvas' }} />
      <div className="sr-only" aria-live="polite">
        CPU: {latestCpu.toFixed(1)}%, 内存: {latestMemory.toFixed(1)}%, 磁盘:{' '}
        {latestDisk.toFixed(1)}%
      </div>
    </div>
  )
}

export default memo(SystemChart)
