import { useEffect, useRef } from 'react'
import { cssVar, hexA, setupCanvas } from './canvasUtils'

export interface HeatmapProps {
  matrix: number[][]
  rowLabels: string[]
  colLabels: string[]
  color?: string
  height?: number
}

export function Heatmap({
  matrix,
  rowLabels,
  colLabels,
  color = '#a855f7',
  height = 160,
}: HeatmapProps) {
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
      const padL = 28
      const padR = 8
      const padT = 6
      const padB = 18
      const rows = matrix.length
      const cols = matrix[0]?.length ?? 0
      if (!rows || !cols) return
      const cw = (W - padL - padR) / cols
      const ch = (H - padT - padB) / rows
      const max = Math.max(...matrix.flat(), 1)

      matrix.forEach((row, y) => {
        row.forEach((v, x) => {
          const o = v / max
          c.fillStyle = hexA(color, 0.12 + 0.85 * o)
          c.fillRect(padL + x * cw + 1, padT + y * ch + 1, cw - 2, ch - 2)
        })
      })

      c.fillStyle = cssVar('--text-3', '#5d556e')
      c.font = '10px JetBrains Mono'
      c.textAlign = 'right'
      rowLabels.forEach((l, i) => c.fillText(l, padL - 4, padT + i * ch + ch / 2 + 3))
      c.textAlign = 'center'
      colLabels.forEach((l, i) => {
        if (i % 3 === 0) c.fillText(l, padL + i * cw + cw / 2, H - 4)
      })
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [matrix, rowLabels, colLabels, color, height])

  return <canvas ref={ref} style={{ display: 'block' }} />
}
