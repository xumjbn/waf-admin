import { useEffect, useRef } from 'react'
import { cssVar, hexA, roundRect, setupCanvas } from './canvasUtils'

export interface BarsVerticalDatum {
  label: string
  value: number
  color?: string
}

export interface BarsVerticalProps {
  data: BarsVerticalDatum[]
  height?: number
  color?: string
}

export function BarsVertical({ data, height = 200, color = '#a855f7' }: BarsVerticalProps) {
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
      const padL = 32
      const padR = 12
      const padT = 14
      const padB = 26
      const max = Math.max(...data.map(d => d.value), 1) * 1.2
      const bw = (W - padL - padR) / Math.max(1, data.length)
      c.strokeStyle = cssVar('--line', '#23192e')
      for (let i = 0; i <= 4; i++) {
        const y = padT + ((H - padT - padB) * i) / 4
        c.beginPath()
        c.setLineDash([2, 3])
        c.moveTo(padL, y)
        c.lineTo(W - padR, y)
        c.stroke()
        c.setLineDash([])
        c.fillStyle = cssVar('--text-3', '#5d556e')
        c.font = '10px JetBrains Mono'
        c.textAlign = 'right'
        c.fillText(String(Math.round(max - (max * i) / 4)), padL - 6, y + 3)
      }
      data.forEach((d, i) => {
        const x = padL + i * bw + bw * 0.2
        const bw2 = bw * 0.6
        const bh = (d.value / max) * (H - padT - padB)
        const grad = c.createLinearGradient(0, padT, 0, H - padB)
        grad.addColorStop(0, d.color || color)
        grad.addColorStop(1, hexA(d.color || color, 0.25))
        c.fillStyle = grad
        roundRect(c, x, H - padB - bh, bw2, bh, 3)
        c.fill()
        c.fillStyle = cssVar('--text-2', '#8e84a3')
        c.font = '10.5px Space Grotesk'
        c.textAlign = 'center'
        c.fillText(d.label, x + bw2 / 2, H - padB + 14)
        c.fillStyle = cssVar('--text-0', '#f3eaff')
        c.font = '11px JetBrains Mono'
        c.fillText(d.value.toLocaleString(), x + bw2 / 2, H - padB - bh - 4)
      })
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [data, height, color])

  return <canvas ref={ref} style={{ display: 'block' }} />
}
