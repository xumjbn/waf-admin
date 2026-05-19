import { useId } from 'react'

export interface SparklineProps {
  data: number[]
  color?: string
  height?: number
  fill?: boolean
}

export function Sparkline({
  data,
  color = 'var(--brand-1)',
  height = 26,
  fill = true,
}: SparklineProps) {
  if (!data || data.length === 0) return null
  const reactId = useId().replace(/[:]/g, '')
  const gradId = `spark-${reactId}`
  const w = 100
  const h = height
  const max = Math.max(...data)
  const min = Math.min(...data)
  const span = max - min || 1
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - 4 - ((v - min) / span) * (h - 8)}`)
    .join(' ')
  const area = `0,${h} ${pts} ${w},${h}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="spark">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <polygon points={area} fill={`url(#${gradId})`} />}
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
