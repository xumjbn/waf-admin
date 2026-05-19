import { useEffect, useRef } from 'react'
import { cssVar, hexA, setupCanvas, drawSmoothPath } from './canvasUtils'

export interface AreaSeries {
  label: string
  data: number[]
  color: string
}

export interface AreaChartProps {
  series: AreaSeries[]
  height?: number
  gridY?: number
  labels?: string[]
  showLegend?: boolean
  smooth?: boolean
  areaOpacity?: number
}

export function AreaChart({
  series,
  height = 220,
  gridY = 4,
  labels,
  showLegend = true,
  smooth = true,
  areaOpacity = 0.16,
}: AreaChartProps) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const cvs = ref.current
    if (!cvs) return
    const wrap = cvs.parentElement
    if (!wrap) return

    const draw = () => {
      const W = wrap.clientWidth
      const H = height
      const padL = 36
      const padR = 12
      const padT = 14
      const padB = 22
      const c = setupCanvas(cvs, W, H)

      const allVals = series.flatMap(s => s.data)
      const max = Math.max(1, ...allVals) * 1.18
      const min = 0
      const xN = series[0]?.data.length ?? 0
      if (xN === 0) return
      const gx = (W - padL - padR) / (xN - 1 || 1)

      // grid
      c.strokeStyle = cssVar('--line', '#23192e')
      c.lineWidth = 1
      for (let i = 0; i <= gridY; i++) {
        const y = padT + ((H - padT - padB) * i) / gridY
        c.beginPath()
        c.setLineDash([2, 3])
        c.moveTo(padL, y)
        c.lineTo(W - padR, y)
        c.stroke()
        c.setLineDash([])
        c.fillStyle = cssVar('--text-3', '#5d556e')
        c.font = '10px JetBrains Mono'
        c.textAlign = 'right'
        c.fillText(String(Math.round(max - (max * i) / gridY)), padL - 6, y + 3)
      }

      if (labels) {
        c.fillStyle = cssVar('--text-3', '#5d556e')
        c.font = '10px JetBrains Mono'
        c.textAlign = 'center'
        const step = Math.ceil(labels.length / 8)
        labels.forEach((l, i) => {
          if (i % step !== 0 && i !== labels.length - 1) return
          c.fillText(l, padL + i * gx, H - padB + 14)
        })
      }

      series.forEach(s => {
        const pts = s.data.map((v, i) => ({
          x: padL + i * gx,
          y: padT + (H - padT - padB) * (1 - (v - min) / (max - min)),
        }))

        c.beginPath()
        c.moveTo(pts[0].x, H - padB)
        if (smooth) drawSmoothPath(c, pts)
        else pts.forEach(p => c.lineTo(p.x, p.y))
        c.lineTo(pts[pts.length - 1].x, H - padB)
        c.closePath()
        const grad = c.createLinearGradient(0, padT, 0, H - padB)
        grad.addColorStop(0, hexA(s.color, areaOpacity * 1.6))
        grad.addColorStop(1, hexA(s.color, 0))
        c.fillStyle = grad
        c.fill()

        c.beginPath()
        if (smooth) drawSmoothPath(c, pts, true)
        else pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)))
        c.strokeStyle = s.color
        c.lineWidth = 2
        c.lineJoin = 'round'
        c.shadowColor = hexA(s.color, 0.6)
        c.shadowBlur = 8
        c.stroke()
        c.shadowBlur = 0

        const lp = pts[pts.length - 1]
        c.fillStyle = s.color
        c.beginPath()
        c.arc(lp.x, lp.y, 3, 0, Math.PI * 2)
        c.fill()
        c.beginPath()
        c.arc(lp.x, lp.y, 6, 0, Math.PI * 2)
        c.strokeStyle = hexA(s.color, 0.35)
        c.lineWidth = 1
        c.stroke()
      })

      if (showLegend) {
        let lx = W - padR
        c.textAlign = 'right'
        c.font = '11px Space Grotesk'
        ;[...series].reverse().forEach(s => {
          const tw = c.measureText(s.label).width
          c.fillStyle = cssVar('--text-1', '#cdc2e0')
          c.fillText(s.label, lx, 6)
          c.fillStyle = s.color
          c.fillRect(lx - tw - 12, -1, 8, 8)
          lx -= tw + 28
        })
      }
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [series, height, gridY, labels, showLegend, smooth, areaOpacity])

  return <canvas ref={ref} style={{ display: 'block' }} />
}
