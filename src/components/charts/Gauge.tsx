import { useEffect, useRef } from 'react'
import { cssVar, hexA, setupCanvas } from './canvasUtils'

export interface GaugeProps {
  value: number
  max?: number
  label?: string
  color?: string
  size?: number
}

export function Gauge({ value, max = 100, label, color = '#a855f7', size = 140 }: GaugeProps) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const cvs = ref.current
    if (!cvs) return
    const W = size
    const H = size * 0.68
    const c = setupCanvas(cvs, W, H)
    const cx = W / 2
    const cy = H * 0.9
    const r = W * 0.42

    c.beginPath()
    c.arc(cx, cy, r, Math.PI, 2 * Math.PI)
    c.strokeStyle = cssVar('--bg-3', '#1a1530')
    c.lineWidth = 10
    c.lineCap = 'round'
    c.stroke()

    const v = Math.min(1, value / max)
    c.beginPath()
    c.arc(cx, cy, r, Math.PI, Math.PI + Math.PI * v)
    c.strokeStyle = color
    c.lineWidth = 10
    c.lineCap = 'round'
    c.shadowColor = hexA(color, 0.8)
    c.shadowBlur = 14
    c.stroke()
    c.shadowBlur = 0

    c.fillStyle = cssVar('--text-0', '#f3eaff')
    c.font = 'bold 22px Space Grotesk'
    c.textAlign = 'center'
    c.fillText(`${value}%`, cx, cy - 8)
    if (label) {
      c.fillStyle = cssVar('--text-3', '#5d556e')
      c.font = '10.5px Space Grotesk'
      c.fillText(label, cx, cy + 8)
    }
  }, [value, max, label, color, size])

  return <canvas ref={ref} style={{ display: 'block' }} />
}
