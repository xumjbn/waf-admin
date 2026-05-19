import { useEffect, useRef } from 'react'
import { cssVar, hexA, roundRect, setupCanvas } from './canvasUtils'

export interface BarChartHDatum {
  label: string
  value: number
  color?: string
}

export interface BarChartHProps {
  data: BarChartHDatum[]
  height?: number
  color?: string
  valueFormat?: (v: number) => string
}

export function BarChartH({ data, height = 220, color = '#a855f7', valueFormat }: BarChartHProps) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const cvs = ref.current
    if (!cvs) return
    const wrap = cvs.parentElement
    if (!wrap) return

    const draw = () => {
      const W = wrap.clientWidth
      const H = height
      const c = setupCanvas(cvs, W, H)
      const padL = 100
      const padR = 60
      const padT = 6
      const padB = 6
      const rowH = Math.min(26, (H - padT - padB) / Math.max(1, data.length))
      const innerH = rowH * data.length
      const startY = padT + (H - padT - padB - innerH) / 2
      const max = Math.max(...data.map(d => d.value), 1) * 1.15

      data.forEach((d, i) => {
        const y = startY + i * rowH + 4
        const h = rowH - 8
        const bw = (d.value / max) * (W - padL - padR)
        c.fillStyle = cssVar('--text-1', '#cdc2e0')
        c.font = '12px Space Grotesk'
        c.textAlign = 'right'
        c.fillText(d.label, padL - 10, y + h / 2 + 4)
        c.fillStyle = cssVar('--bg-3', '#1a1530')
        roundRect(c, padL, y, W - padL - padR, h, h / 2)
        c.fill()
        const grad = c.createLinearGradient(padL, 0, padL + bw, 0)
        grad.addColorStop(0, hexA(d.color || color, 0.55))
        grad.addColorStop(1, d.color || color)
        c.fillStyle = grad
        roundRect(c, padL, y, Math.max(2, bw), h, h / 2)
        c.fill()
        c.fillStyle = cssVar('--text-0', '#f3eaff')
        c.font = '11px JetBrains Mono'
        c.textAlign = 'left'
        c.fillText(
          valueFormat ? valueFormat(d.value) : d.value.toLocaleString(),
          padL + bw + 8,
          y + h / 2 + 4,
        )
      })
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [data, height, color, valueFormat])

  return <canvas ref={ref} style={{ display: 'block' }} />
}
