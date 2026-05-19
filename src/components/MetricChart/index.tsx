import { memo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'

interface MetricChartProps {
  title: string
  data: number[]
  timestamps: string[]
  color: string
  unit?: string
  height?: number
}

const MetricChart = ({
  title,
  data,
  timestamps,
  color,
  unit = '%',
  height = 180,
}: MetricChartProps) => {
  const option: EChartsOption = {
    backgroundColor: 'transparent',
    grid: {
      left: 50,
      right: 20,
      top: 50,
      bottom: 30,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#2a2f3a',
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: any) => {
        const p = params[0]
        return `${p.axisValue}<br/>${title}: <b>${p.value}${unit}</b>`
      },
    },
    xAxis: {
      type: 'category',
      data: timestamps,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#e0e0e6' } },
      axisLabel: {
        color: '#8c8ca1',
        fontSize: 11,
        formatter: (v: string) => v.split(' ')[1] || v,
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { show: false },
      axisLabel: {
        color: '#8c8ca1',
        fontSize: 11,
        formatter: `{value}${unit}`,
      },
      splitLine: {
        lineStyle: { color: '#f0f0f5', type: 'dashed' },
      },
    },
    series: [
      {
        type: 'line',
        data,
        smooth: true,
        symbol: 'none',
        lineStyle: { color, width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${color}40` },
              { offset: 1, color: `${color}08` },
            ],
          },
        },
      },
    ],
  }

  const currentValue = data[data.length - 1] ?? 0

  return (
    <div
      style={{ position: 'relative' }}
      role="img"
      aria-label={`${title}趋势图，当前值 ${currentValue.toFixed(1)}${unit}`}
    >
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 16,
          zIndex: 10,
        }}
        aria-hidden="true"
      >
        <div style={{ fontSize: 12, color: '#8c8ca1' }}>{title}</div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 16,
          zIndex: 10,
          textAlign: 'right',
        }}
        aria-hidden="true"
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: '#1a1a2e',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.2,
          }}
        >
          {currentValue.toFixed(1)}
          <span style={{ fontSize: 13, color: '#8c8ca1', marginLeft: 2 }}>{unit}</span>
        </div>
      </div>
      <ReactECharts
        option={option}
        style={{ height, width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
      <div className="sr-only" aria-live="polite">
        {title}: {currentValue.toFixed(1)}
        {unit}
      </div>
    </div>
  )
}

export default memo(MetricChart)
