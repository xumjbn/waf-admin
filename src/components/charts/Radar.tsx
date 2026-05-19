import { useEffect, useRef } from 'react'
import { cssVar, hexA, setupCanvas } from './canvasUtils'

export interface RadarSeries {
  label: string
  data: number[]
  color: string
}

export interface RadarProps {
  axes: string[]
  series: RadarSeries[]
  size?: number
}

export function Radar({ axes, series, size = 240 }: RadarProps) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const cvs = ref.current
    if (!cvs) return
    const wrap = cvs.parentElement
    if (!wrap) return

    const draw = () => {
      const W = wrap.clientWidth
      const H = size
      const c = setupCanvas(cvs, W, H)
      const cx = W / 2
      const cy = H / 2
      const R = Math.min(W, H) / 2 - 36
      const N = axes.length

      for (let r = 1; r <= 4; r++) {
        c.beginPath()
        for (let i = 0; i < N; i++) {
          const a = -Math.PI / 2 + (i * Math.PI * 2) / N
          const x = cx + (Math.cos(a) * R * r) / 4
          const y = cy + (Math.sin(a) * R * r) / 4
          if (i) c.lineTo(x, y)
          else c.moveTo(x, y)
        }
        c.closePath()
        c.strokeStyle = cssVar('--line', '#23192e')
        c.lineWidth = 0.8
        c.stroke()
      }

      axes.forEach((ax, i) => {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / N
        const x = cx + Math.cos(a) * R
        const y = cy + Math.sin(a) * R
        c.beginPath()
        c.moveTo(cx, cy)
        c.lineTo(x, y)
        c.strokeStyle = cssVar('--line-2', '#1a1530')
        c.lineWidth = 0.6
        c.stroke()
        c.fillStyle = cssVar('--text-2', '#8e84a3')
        c.font = '11px Space Grotesk'
        c.textAlign = Math.cos(a) > 0.1 ? 'left' : Math.cos(a) < -0.1 ? 'right' : 'center'
        c.textBaseline = 'middle'
        c.fillText(ax, x + Math.cos(a) * 10, y + Math.sin(a) * 10)
      })

      series.forEach(s => {
        c.beginPath()
        s.data.forEach((v, i) => {
          const a = -Math.PI / 2 + (i * Math.PI * 2) / N
          const r = (v / 100) * R
          const x = cx + Math.cos(a) * r
          const y = cy + Math.sin(a) * r
          if (i) c.lineTo(x, y)
          else c.moveTo(x, y)
        })
        c.closePath()
        c.fillStyle = hexA(s.color, 0.22)
        c.fill()
        c.strokeStyle = s.color
        c.lineWidth = 1.6
        c.stroke()
        s.data.forEach((v, i) => {
          const a = -Math.PI / 2 + (i * Math.PI * 2) / N
          const r = (v / 100) * R
          const x = cx + Math.cos(a) * r
          const y = cy + Math.sin(a) * r
          c.fillStyle = s.color
          c.beginPath()
          c.arc(x, y, 3, 0, Math.PI * 2)
          c.fill()
        })
      })
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [axes, series, size])

  return <canvas ref={ref} style={{ display: 'block' }} />
}
