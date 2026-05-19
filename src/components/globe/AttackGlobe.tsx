import { useEffect, useRef, useState } from 'react'
import { ATTACK_TYPES, REGIONS, pick, type AttackType, type Region } from '@/mocks/nebula'

type ProjectFn = (
  lat: number,
  lng: number,
  rotY: number,
  R: number,
  cx: number,
  cy: number,
) => { x: number; y: number; z: number }

interface Arc {
  src: Region
  dst: { lat: number; lng: number }
  at: AttackType
  blocked: boolean
  start: number
  dur: number
}

interface GlobeState {
  rot: number
  arcs: Arc[]
  lastSpawn: number
  paused: boolean
  raf: number
  last: number
  w: number
  h: number
}

declare global {
  interface Window {
    __nwContinentPts?: Array<[number, number]>
  }
}

export interface AttackGlobeProps {
  height?: number
  autoSpawn?: boolean
}

export function AttackGlobe({ height = 460, autoSpawn = true }: AttackGlobeProps) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const stateRef = useRef<GlobeState>({
    rot: 0,
    arcs: [],
    lastSpawn: 0,
    paused: false,
    raf: 0,
    last: 0,
    w: 0,
    h: 0,
  })
  const [stats, setStats] = useState({ total: 0, blocked: 0 })

  useEffect(() => {
    const cvs = ref.current
    if (!cvs) return
    const wrap = cvs.parentElement
    if (!wrap) return

    const project: ProjectFn = (lat, lng, rotY, R, cx, cy) => {
      const phi = (lat * Math.PI) / 180
      const theta = (lng * Math.PI) / 180 + rotY
      const x3 = Math.cos(phi) * Math.cos(theta)
      const y3 = Math.sin(phi)
      const z3 = Math.cos(phi) * Math.sin(theta)
      return { x: cx + x3 * R, y: cy - y3 * R, z: z3 }
    }

    const onResize = () => {
      const W = wrap.clientWidth
      const H = height
      stateRef.current.w = W
      stateRef.current.h = H
      const dpr = window.devicePixelRatio || 1
      cvs.width = W * dpr
      cvs.height = H * dpr
      cvs.style.width = `${W}px`
      cvs.style.height = `${H}px`
      const c = cvs.getContext('2d')
      if (c) c.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    onResize()
    const ro = new ResizeObserver(onResize)
    ro.observe(wrap)

    const HQ = { lat: 32, lng: 116 }
    const c = cvs.getContext('2d')
    if (!c) return

    const drawMeridians = (rot: number, R: number, cx: number, cy: number, front: boolean) => {
      const N = 18
      for (let i = 0; i < N; i++) {
        const lng = (i / N) * 360 - 180
        c.beginPath()
        let started = false
        for (let lat = -90; lat <= 90; lat += 4) {
          const p = project(lat, lng, rot, R, cx, cy)
          if (front ? p.z >= -0.02 : p.z < -0.02) {
            if (!started) {
              c.moveTo(p.x, p.y)
              started = true
            } else c.lineTo(p.x, p.y)
          } else {
            started = false
          }
        }
        c.strokeStyle = front ? 'rgba(168,85,247,0.18)' : 'rgba(168,85,247,0.06)'
        c.lineWidth = 1
        c.stroke()
      }
    }

    const drawParallels = (rot: number, R: number, cx: number, cy: number, front: boolean) => {
      for (let lat = -75; lat <= 75; lat += 15) {
        c.beginPath()
        let started = false
        for (let lng = -180; lng <= 180; lng += 4) {
          const p = project(lat, lng, rot, R, cx, cy)
          if (front ? p.z >= -0.02 : p.z < -0.02) {
            if (!started) {
              c.moveTo(p.x, p.y)
              started = true
            } else c.lineTo(p.x, p.y)
          } else {
            started = false
          }
        }
        c.strokeStyle = front ? 'rgba(168,85,247,0.14)' : 'rgba(168,85,247,0.05)'
        c.lineWidth = 1
        c.stroke()
      }
    }

    const drawContinents = (rot: number, R: number, cx: number, cy: number) => {
      if (!window.__nwContinentPts) {
        const zones: Array<[number, number, number, number]> = [
          [-30, 35, -10, 70],
          [40, 80, 30, 70],
          [60, 145, 5, 50],
          [110, 155, -40, 5],
          [-130, -60, 15, 60],
          [-80, -35, -55, 10],
        ]
        const pts: Array<[number, number]> = []
        zones.forEach(z => {
          for (let i = 0; i < 110; i++) {
            const lng = z[0] + Math.random() * (z[1] - z[0])
            const lat = z[2] + Math.random() * (z[3] - z[2])
            pts.push([lat, lng])
          }
        })
        window.__nwContinentPts = pts
      }
      window.__nwContinentPts.forEach(([lat, lng]) => {
        const p = project(lat, lng, rot, R, cx, cy)
        if (p.z < -0.02) return
        const op = 0.3 + p.z * 0.7
        c.fillStyle = `rgba(207,178,247,${op * 0.6})`
        c.fillRect(p.x, p.y, 1.4, 1.4)
      })
    }

    const drawArc = (
      src: { lat: number; lng: number },
      dst: { lat: number; lng: number },
      prog: number,
      fade: number,
      color: string,
      rotY: number,
      R: number,
      cx: number,
      cy: number,
    ) => {
      const STEPS = 40
      const start = project(src.lat, src.lng, rotY, R, cx, cy)
      const end = project(dst.lat, dst.lng, rotY, R, cx, cy)
      if (start.z < -0.4 && end.z < -0.4) return
      const phi1 = (src.lat * Math.PI) / 180
      const lam1 = (src.lng * Math.PI) / 180 + rotY
      const phi2 = (dst.lat * Math.PI) / 180
      const lam2 = (dst.lng * Math.PI) / 180 + rotY
      const ax = Math.cos(phi1) * Math.cos(lam1)
      const ay = Math.sin(phi1)
      const az = Math.cos(phi1) * Math.sin(lam1)
      const bx = Math.cos(phi2) * Math.cos(lam2)
      const by = Math.sin(phi2)
      const bz = Math.cos(phi2) * Math.sin(lam2)
      const dot = Math.max(-1, Math.min(1, ax * bx + ay * by + az * bz))
      const omega = Math.acos(dot)
      const sino = Math.sin(omega) || 0.0001
      const maxLift = 0.45 + Math.min(0.45, omega)

      const pts: Array<{ x: number; y: number; z: number }> = []
      for (let i = 0; i <= STEPS; i++) {
        const t = i / STEPS
        const ka = Math.sin((1 - t) * omega) / sino
        const kb = Math.sin(t * omega) / sino
        const x = ka * ax + kb * bx
        const y = ka * ay + kb * by
        const z = ka * az + kb * bz
        const lift = 1 + maxLift * Math.sin(t * Math.PI)
        pts.push({ x: cx + x * R * lift, y: cy - y * R * lift, z })
      }

      const visIdx = Math.floor(prog * STEPS)
      const tailLen = Math.max(8, STEPS * 0.35)
      const startIdx = Math.max(0, visIdx - tailLen)

      c.lineWidth = 2
      c.lineCap = 'round'
      c.shadowColor = color
      c.shadowBlur = 8
      c.beginPath()
      for (let i = startIdx; i <= visIdx && i < pts.length; i++) {
        const p = pts[i]
        if (p.z < -0.4) continue
        const alpha = ((i - startIdx) / tailLen) * fade
        c.globalAlpha = alpha
        if (i === startIdx) c.moveTo(p.x, p.y)
        else c.lineTo(p.x, p.y)
      }
      c.strokeStyle = color
      c.stroke()
      c.shadowBlur = 0
      c.globalAlpha = 1

      if (visIdx < pts.length) {
        const head = pts[visIdx]
        if (head.z > -0.4) {
          c.beginPath()
          c.arc(head.x, head.y, 2.5, 0, Math.PI * 2)
          c.fillStyle = color
          c.shadowColor = color
          c.shadowBlur = 8
          c.fill()
          c.shadowBlur = 0
        }
      }
    }

    const drawHud = (t: number, cx: number, cy: number, R: number) => {
      c.beginPath()
      c.arc(cx, cy, R + 14, 0, Math.PI * 2)
      c.strokeStyle = 'rgba(168,85,247,.25)'
      c.lineWidth = 1
      c.stroke()
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        const x1 = cx + Math.cos(a) * (R + 10)
        const y1 = cy + Math.sin(a) * (R + 10)
        const x2 = cx + Math.cos(a) * (R + 18)
        const y2 = cy + Math.sin(a) * (R + 18)
        c.beginPath()
        c.moveTo(x1, y1)
        c.lineTo(x2, y2)
        c.strokeStyle = 'rgba(168,85,247,.45)'
        c.lineWidth = 1
        c.stroke()
      }
      const a0 = (t / 2000) * Math.PI * 2
      c.beginPath()
      c.arc(cx, cy, R + 22, a0, a0 + Math.PI * 0.35)
      c.strokeStyle = '#ec4899'
      c.lineWidth = 2
      c.lineCap = 'round'
      c.stroke()
      c.beginPath()
      c.arc(cx, cy, R + 22, a0 + Math.PI, a0 + Math.PI + Math.PI * 0.2)
      c.strokeStyle = '#22d3ee'
      c.lineWidth = 2
      c.stroke()
    }

    const tick = (t: number) => {
      const s = stateRef.current
      if (!s.last) s.last = t
      const dt = Math.min(50, t - s.last)
      s.last = t
      if (!s.paused) s.rot += (dt / 1000) * 0.12
      const W = s.w
      const H = s.h
      c.clearRect(0, 0, W, H)

      const cx = W / 2
      const cy = H / 2
      const R = Math.min(W, H) * 0.36

      const grad = c.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.8)
      grad.addColorStop(0, 'rgba(168,85,247,0.12)')
      grad.addColorStop(1, 'rgba(168,85,247,0)')
      c.fillStyle = grad
      c.fillRect(0, 0, W, H)

      drawMeridians(s.rot, R, cx, cy, false)
      drawParallels(s.rot, R, cx, cy, false)

      const sphereGrad = c.createRadialGradient(
        cx - R * 0.3,
        cy - R * 0.3,
        R * 0.3,
        cx,
        cy,
        R * 1.1,
      )
      sphereGrad.addColorStop(0, 'rgba(168,85,247,0.10)')
      sphereGrad.addColorStop(0.55, 'rgba(40,15,80,0.18)')
      sphereGrad.addColorStop(1, 'rgba(10,5,20,0.32)')
      c.beginPath()
      c.arc(cx, cy, R, 0, Math.PI * 2)
      c.fillStyle = sphereGrad
      c.fill()

      drawContinents(s.rot, R, cx, cy)
      drawMeridians(s.rot, R, cx, cy, true)
      drawParallels(s.rot, R, cx, cy, true)

      REGIONS.forEach(rg => {
        const p = project(rg.lat, rg.lng, s.rot, R, cx, cy)
        if (p.z > -0.15) {
          const op = p.z < 0 ? 0.35 : 1
          c.fillStyle = `rgba(34,211,238,${0.6 * op})`
          c.beginPath()
          c.arc(p.x, p.y, 1.6, 0, Math.PI * 2)
          c.fill()
        }
      })

      const hq = project(HQ.lat, HQ.lng, s.rot, R, cx, cy)
      if (hq.z > -0.05) {
        const pulse = (Math.sin(t / 400) + 1) / 2
        c.beginPath()
        c.arc(hq.x, hq.y, 5 + pulse * 8, 0, Math.PI * 2)
        c.strokeStyle = `rgba(245,158,11,${0.4 - pulse * 0.3})`
        c.lineWidth = 1.5
        c.stroke()
        c.beginPath()
        c.arc(hq.x, hq.y, 4, 0, Math.PI * 2)
        c.fillStyle = '#f59e0b'
        c.shadowColor = '#f59e0b'
        c.shadowBlur = 14
        c.fill()
        c.shadowBlur = 0
      }

      if (autoSpawn && !s.paused && t - s.lastSpawn > 350) {
        s.lastSpawn = t
        const src = pick(REGIONS)
        const at = pick(ATTACK_TYPES)
        const blocked = Math.random() > 0.12
        s.arcs.push({
          src,
          dst: HQ,
          at,
          blocked,
          start: t,
          dur: 1400 + Math.random() * 600,
        })
        setStats(prev => ({
          total: prev.total + 1,
          blocked: prev.blocked + (blocked ? 1 : 0),
        }))
      }

      s.arcs = s.arcs.filter(a => t - a.start < a.dur + 1000)
      s.arcs.forEach(a => {
        const prog = Math.min(1, (t - a.start) / a.dur)
        const fade = prog > 1 ? 1 - (prog - 1) : 1
        drawArc(a.src, a.dst, prog, fade, a.at.color, s.rot, R, cx, cy)
        if (prog >= 1 && prog < 1.35) {
          const dp = project(a.dst.lat, a.dst.lng, s.rot, R, cx, cy)
          if (dp.z > -0.1) {
            const ep = (prog - 1) * 3
            c.beginPath()
            c.arc(dp.x, dp.y, 4 + ep * 16, 0, Math.PI * 2)
            c.strokeStyle = `rgba(${a.blocked ? '16,185,129' : '239,68,68'},${0.7 - ep * 0.7})`
            c.lineWidth = 2
            c.stroke()
          }
        }
      })

      drawHud(t, cx, cy, R)
      s.raf = requestAnimationFrame(tick)
    }

    stateRef.current.raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(stateRef.current.raf)
      ro.disconnect()
    }
  }, [height, autoSpawn])

  return (
    <div style={{ position: 'relative' }}>
      <canvas ref={ref} style={{ display: 'block' }} />
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          fontSize: 11,
          color: 'var(--text-3)',
          fontFamily: 'JetBrains Mono',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}
      >
        <div className="t-brand fw-700" style={{ fontSize: 12, marginBottom: 2 }}>
          ● THREAT MAP / GEO
        </div>
        <div>SRC : Worldwide</div>
        <div>DST : 32.0N 116.0E · APAC</div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          textAlign: 'right',
          fontSize: 11,
          color: 'var(--text-3)',
          fontFamily: 'JetBrains Mono',
        }}
      >
        <div className="t-pink" style={{ fontWeight: 700, marginBottom: 2 }}>
          ● LIVE
        </div>
        <div>TRAJ {String(stats.total).padStart(4, '0')}</div>
        <div>BLOCK {Math.round((stats.blocked / Math.max(1, stats.total)) * 100)}%</div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          display: 'flex',
          gap: 14,
          fontSize: 11,
          color: 'var(--text-2)',
          fontFamily: 'JetBrains Mono',
        }}
      >
        <LegendDot color="#ef4444" label="SQLi" />
        <LegendDot color="#f59e0b" label="XSS" />
        <LegendDot color="#a855f7" label="CMDi" />
        <LegendDot color="#22d3ee" label="SCAN" />
        <LegendDot color="#ec4899" label="LFI" />
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          right: 14,
          fontSize: 10,
          color: 'var(--text-3)',
          fontFamily: 'JetBrains Mono',
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        AUTO-ROT · {Math.round(stats.total * 0.83)} RPS · GMT+8
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      {label}
    </span>
  )
}
