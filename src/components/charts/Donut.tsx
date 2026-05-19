import { useEffect, useRef } from 'react'
import { cssVar, hexA, roundRect, setupCanvas } from './canvasUtils'

export interface DonutDatum {
  label: string
  value: number
  color: string
}

export interface DonutProps {
  data: DonutDatum[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerValue?: string
}

export function Donut({ data, size = 180, thickness = 22, centerLabel, centerValue }: DonutProps) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const cvs = ref.current
    if (!cvs) return
    const wrap = cvs.parentElement
    if (!wrap) return

    const draw = () => {
      const W = wrap.clientWidth
      const H = Math.max(size + 20, 200)
      const c = setupCanvas(cvs, W, H)
      const cx = size / 2 + 12
      const cy = H / 2
      const r = size / 2 - 4
      const total = data.reduce((s, d) => s + d.value, 0) || 1
      let angle = -Math.PI / 2
      data.forEach(d => {
        const a = (d.value / total) * Math.PI * 2
        c.beginPath()
        c.arc(cx, cy, r, angle, angle + a)
        c.lineWidth = thickness
        c.strokeStyle = d.color
        c.lineCap = 'butt'
        c.stroke()
        angle += a
      })
      const g = c.createRadialGradient(cx, cy, r - thickness - 8, cx, cy, r - thickness)
      g.addColorStop(0, hexA('#a855f7', 0))
      g.addColorStop(1, hexA('#a855f7', 0.15))
      c.fillStyle = g
      c.beginPath()
      c.arc(cx, cy, r - thickness, 0, Math.PI * 2)
      c.fill()

      if (centerValue) {
        c.fillStyle = cssVar('--text-0', '#f3eaff')
        c.font = 'bold 22px Space Grotesk'
        c.textAlign = 'center'
        c.fillText(centerValue, cx, cy + 2)
      }
      if (centerLabel) {
        c.fillStyle = cssVar('--text-3', '#5d556e')
        c.font = '10.5px Space Grotesk'
        c.textAlign = 'center'
        c.fillText(centerLabel, cx, cy + 20)
      }

      const legendX = size + 36
      c.textAlign = 'left'
      data.forEach((d, i) => {
        const y = (H - data.length * 22) / 2 + i * 22
        c.fillStyle = d.color
        roundRect(c, legendX, y - 6, 8, 8, 2)
        c.fill()
        c.fillStyle = cssVar('--text-1', '#cdc2e0')
        c.font = '12px Space Grotesk'
        c.fillText(d.label, legendX + 14, y + 1)
        const pct = ((d.value / total) * 100).toFixed(1)
        c.fillStyle = cssVar('--text-3', '#5d556e')
        c.font = '11px JetBrains Mono'
        c.fillText(`${pct}%`, legendX + 14, y + 14)
      })
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [data, size, thickness, centerLabel, centerValue])

  return <canvas ref={ref} style={{ display: 'block' }} />
}
