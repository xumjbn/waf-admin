// 全球攻击轨迹（dashboard 首页 /aggregation）
//
// 实现：globe.gl（three.js 封装）—— 参考 https://globe.gl/example/random-arcs/
//
// 三层数据：
//   · polygonsData ：public/maps/world.json 国家轮廓，作为大陆显示（不用图片纹理）
//   · arcsData     ：攻击源 → HQ 弧线，颜色取自 attack.typeColor
//   · pointsData   ：单 IP 散点（小亮点）
//   · labelsData   ：Top 30 高频 IP 文本标签
//
// 交互：autoRotate 默认开 / 鼠标拖拽旋转 / 滚轮缩放（globe.gl 内置）
// 主题：按 body[data-theme] 切两套调色板，MutationObserver 监听运行时切换。
// 异常：ErrorBoundary + 降级占位条。
// 全屏：forwardRef 暴露 toggleFullscreen() 给父组件。

import {
  Component,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import Globe from 'globe.gl'
import type { GlobeInstance } from 'globe.gl'
import type { AttackEvent } from '@/mocks/nebula'

const HQ = { lat: 32.0, lng: 116.0, name: '防护中心' }

interface Palette {
  background: string         // 容器 + globe 背景
  globeColor: string         // 球底（海洋）
  polygonCap: string         // 大陆色
  polygonSide: string        // 大陆侧面
  polygonStroke: string      // 国界线
  atmosphere: string
  arcDefault: string
  pointColor: string
  hqColor: string
  labelColor: string
  labelBg: string
  textHud: string
}
function getPalette(): Palette {
  const theme =
    typeof document !== 'undefined' ? document.body.dataset.theme || 'dark' : 'dark'
  if (theme === 'light') {
    return {
      background: '#eef2f8',
      globeColor: '#bcd0e6',
      polygonCap: '#7a8db3',
      polygonSide: 'rgba(91, 33, 182, 0.15)',
      polygonStroke: '#5b6b8d',
      atmosphere: '#a855f7',
      arcDefault: '#a855f7',
      pointColor: '#ec4899',
      hqColor: '#0ea5e9',
      labelColor: '#1a0b2e',
      labelBg: 'rgba(255,255,255,.88)',
      textHud: '#3b3052',
    }
  }
  return {
    background: '#0a0518',
    globeColor: '#0f1626',
    polygonCap: '#2a1f4a',
    polygonSide: 'rgba(168, 85, 247, 0.15)',
    polygonStroke: '#5b3fa3',
    atmosphere: '#a855f7',
    arcDefault: '#a855f7',
    pointColor: '#ec4899',
    hqColor: '#22d3ee',
    labelColor: '#fef3c7',
    labelBg: 'rgba(13,10,24,.78)',
    textHud: '#cdc2e0',
  }
}

export interface AttackGlobeProps {
  attacks: AttackEvent[]
  height?: number
  autoRotate?: boolean
  autoRotateSpeed?: number       // 度/秒，对应 controls.autoRotateSpeed（globe.gl 默认 2）
}

export interface AttackGlobeHandle {
  toggleFullscreen: () => void
}

class GlobeErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean; msg: string }
> {
  state = { hasError: false, msg: '' }
  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, msg: err instanceof Error ? err.message : String(err) }
  }
  componentDidCatch(err: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[AttackGlobe] crashed:', err, info)
  }
  render() {
    if (this.state.hasError) return <>{this.props.fallback}</>
    return this.props.children
  }
}

export const AttackGlobe = forwardRef<AttackGlobeHandle, AttackGlobeProps>(
  function AttackGlobe(props, ref) {
    return (
      <GlobeErrorBoundary fallback={<GlobeFallback height={props.height ?? 460} />}>
        <GlobeInner {...props} fwdRef={ref} />
      </GlobeErrorBoundary>
    )
  },
)

function GlobeFallback({ height }: { height: number }) {
  return (
    <div
      style={{
        height,
        display: 'grid',
        placeItems: 'center',
        background: 'var(--bg-2)',
        border: '1px dashed var(--line-strong)',
        borderRadius: 8,
        color: 'var(--text-2)',
        fontSize: 13,
        textAlign: 'center',
        padding: 16,
      }}
    >
      <div>
        <div className="fw-700 mb-2">3D 地球渲染失败</div>
        <div className="muted fs-12">
          浏览器可能未启用 WebGL；数据其他面板不受影响。
        </div>
      </div>
    </div>
  )
}

// 缓存 world geojson —— 整个 SPA 内存里只读一次
let worldGeoCache: { features: unknown[] } | null = null
async function loadWorld(): Promise<{ features: unknown[] }> {
  if (worldGeoCache) return worldGeoCache
  const res = await fetch('/maps/world.json')
  const json = await res.json()
  worldGeoCache = { features: Array.isArray(json.features) ? json.features : [] }
  return worldGeoCache
}

interface Arc {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  color: string
}
interface Point {
  lat: number
  lng: number
  size: number
  color: string
  label: string
}
interface Label {
  lat: number
  lng: number
  text: string
  size: number
}

function GlobeInner({
  attacks,
  height = 460,
  autoRotate = true,
  autoRotateSpeed = 0.5,
  fwdRef,
}: AttackGlobeProps & { fwdRef: React.Ref<AttackGlobeHandle> }) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const globeRef = useRef<GlobeInstance | null>(null)
  const [paletteKey, setPaletteKey] = useState<'light' | 'dark'>(() =>
    typeof document !== 'undefined' && document.body.dataset.theme === 'light'
      ? 'light'
      : 'dark',
  )

  // 监听 body[data-theme] 切换
  useEffect(() => {
    const obs = new MutationObserver(() => {
      const t = document.body.dataset.theme === 'light' ? 'light' : 'dark'
      setPaletteKey(prev => (prev === t ? prev : t))
    })
    obs.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  const palette = useMemo(() => getPalette(), [paletteKey])

  // 把 attacks → arcs / points / labels
  const { arcs, points, labels } = useMemo(() => {
    const arcs: Arc[] = []
    const points: Point[] = []
    const byIp = new Map<
      string,
      { ip: string; country: string; lat: number; lng: number; count: number }
    >()

    for (const a of attacks) {
      if (!a || typeof a.lat !== 'number' || typeof a.lng !== 'number') continue
      if (a.lat === 0 && a.lng === 0) continue
      const color = a.typeColor || palette.arcDefault
      arcs.push({
        startLat: a.lat,
        startLng: a.lng,
        endLat: HQ.lat,
        endLng: HQ.lng,
        color,
      })
      const ip = a.ip || '—'
      const existing = byIp.get(ip)
      if (existing) {
        existing.count++
      } else {
        byIp.set(ip, {
          ip,
          country: a.country || '未知',
          lat: a.lat,
          lng: a.lng,
          count: 1,
        })
      }
    }

    byIp.forEach(v => {
      points.push({
        lat: v.lat,
        lng: v.lng,
        size: Math.min(0.35, 0.06 + Math.log2(v.count + 1) * 0.05),
        color: palette.pointColor,
        label: `${v.country} · ${v.ip}${v.count > 1 ? `  ×${v.count}` : ''}`,
      })
    })

    // Top 30 IP 永久显示标签
    const labels: Label[] = Array.from(byIp.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 30)
      .map(v => ({
        lat: v.lat,
        lng: v.lng,
        text: `${v.ip}${v.count > 1 ? ` ×${v.count}` : ''}`,
        size: 0.4,
      }))

    return { arcs: arcs.slice(0, 500), points, labels }
  }, [attacks, palette.arcDefault, palette.pointColor])

  // 暴露 toggleFullscreen
  useImperativeHandle(
    fwdRef,
    () => ({
      toggleFullscreen() {
        const el = wrapRef.current
        if (!el) return
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {})
        } else {
          el.requestFullscreen().catch(err => {
            // eslint-disable-next-line no-console
            console.warn('[AttackGlobe] fullscreen failed', err)
          })
        }
      },
    }),
    [],
  )

  // 初始化 globe（一次）
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    let cancelled = false
    // globe.gl 在 TS 下用 new Globe(el)；旧 JS 文档里的 Globe()(el) 等价但 d.ts 不支持
    const inst = new Globe(el)
      .width(el.clientWidth)
      .height(el.clientHeight)
      .backgroundColor(palette.background)
      .showAtmosphere(true)
      .atmosphereColor(palette.atmosphere)
      .atmosphereAltitude(0.18)
      .showGlobe(true)
      .showGraticules(false)
    // globe.gl 球面默认材质：globeMaterial().color
    const mat = inst.globeMaterial() as { color: { set: (c: string) => void } }
    if (mat && mat.color && typeof mat.color.set === 'function') {
      mat.color.set(palette.globeColor)
    }

    globeRef.current = inst

    // 装大陆轮廓 polygons
    loadWorld().then(world => {
      if (cancelled || !globeRef.current) return
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const g = globeRef.current as any
      g.polygonsData(world.features)
        .polygonAltitude(0.006)
        .polygonCapColor(() => palette.polygonCap)
        .polygonSideColor(() => palette.polygonSide)
        .polygonStrokeColor(() => palette.polygonStroke)
        .polygonsTransitionDuration(0)
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })

    // 控制器：自动旋转 + 缩放
    const controls = inst.controls() as unknown as {
      autoRotate: boolean
      autoRotateSpeed: number
      enableZoom: boolean
      enablePan: boolean
    }
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = autoRotateSpeed
    controls.enableZoom = true
    controls.enablePan = false

    // 初始视角对准 HQ
    inst.pointOfView({ lat: HQ.lat, lng: HQ.lng, altitude: 2.3 }, 0)

    // resize 观察器
    const ro = new ResizeObserver(() => {
      if (!globeRef.current) return
      globeRef.current.width(el.clientWidth).height(el.clientHeight)
    })
    ro.observe(el)

    return () => {
      cancelled = true
      ro.disconnect()
      // globe.gl 没有显式 dispose，但置空 ref 让下一次 init 重建
      try {
        const renderer = (inst as unknown as { renderer?: () => { dispose?: () => void } })
          .renderer?.()
        renderer?.dispose?.()
      } catch {
        /* ignore */
      }
      globeRef.current = null
      // 清掉残留 canvas，下次 mount 不会叠
      while (el.firstChild) el.removeChild(el.firstChild)
    }
    // 主题切换、自动旋转开关会触发整体重建（这两个变化少见，重建可接受）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletteKey, autoRotate, autoRotateSpeed])

  // 数据更新 —— 不重建实例。globe.gl accessor 签名是 (obj: object) => T，
  // 这里把 obj 当 Arc/Point/Label 用，强制 cast。
  useEffect(() => {
    const inst = globeRef.current
    if (!inst) return
    // 用 any 链式避免 globe.gl 的 ObjAccessor 与 Arc/Point/Label 类型不直接匹配
    // 的麻烦；类型安全已经在 useMemo 数据构造侧保证。
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = inst as any

    g.arcsData(arcs)
      .arcStartLat((d: any) => (d as Arc).startLat)
      .arcStartLng((d: any) => (d as Arc).startLng)
      .arcEndLat((d: any) => (d as Arc).endLat)
      .arcEndLng((d: any) => (d as Arc).endLng)
      .arcColor((d: any) => [(d as Arc).color, palette.hqColor])
      .arcStroke(0.45)
      .arcAltitudeAutoScale(0.55)
      .arcDashLength(0.5)
      .arcDashGap(1.2)
      .arcDashAnimateTime(2200)

    g.pointsData(points)
      .pointLat((d: any) => (d as Point).lat)
      .pointLng((d: any) => (d as Point).lng)
      .pointAltitude((d: any) => (d as Point).size)
      .pointColor((d: any) => (d as Point).color)
      .pointRadius(0.25)
      .pointLabel((d: any) => (d as Point).label)
      .pointsMerge(false)

    g.labelsData(labels)
      .labelLat((d: any) => (d as Label).lat)
      .labelLng((d: any) => (d as Label).lng)
      .labelText((d: any) => (d as Label).text)
      .labelSize(() => 0.45)
      .labelDotRadius(0.25)
      .labelColor(() => palette.labelColor)
      .labelResolution(2)

    // HQ 单独画一个 HTML 角标
    g.htmlElementsData([{ lat: HQ.lat, lng: HQ.lng, label: HQ.name }])
      .htmlLat((d: any) => d.lat)
      .htmlLng((d: any) => d.lng)
      .htmlAltitude(0.02)
      .htmlElement(() => {
        const tpl = document.createElement('template')
        tpl.innerHTML = `<div style="
          display:inline-flex;align-items:center;gap:6px;
          padding:4px 10px;border-radius:999px;
          background:${palette.labelBg};
          border:1px solid ${palette.hqColor};
          color:${palette.hqColor};
          font:600 11px/1 'JetBrains Mono', monospace;
          white-space:nowrap;pointer-events:none;
          box-shadow:0 0 12px ${palette.hqColor}88;
        ">
          <span style="width:6px;height:6px;border-radius:50%;background:${palette.hqColor}"></span>
          ${HQ.name}
        </div>`
        return tpl.content.firstElementChild as HTMLElement
      })
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }, [arcs, points, labels, palette])

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'relative',
        width: '100%',
        height,
        background: palette.background,
      }}
    >
      {/* HUD */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          fontSize: 11,
          color: palette.textHud,
          opacity: 0.9,
          fontFamily: 'JetBrains Mono',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        <div className="t-brand fw-700" style={{ fontSize: 12, marginBottom: 2 }}>
          ● GLOBAL THREAT MAP
        </div>
        <div>SRC : Worldwide IPs</div>
        <div>
          DST : {HQ.lat.toFixed(1)}N {HQ.lng.toFixed(1)}E · {HQ.name}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          textAlign: 'right',
          fontSize: 11,
          color: palette.textHud,
          opacity: 0.9,
          fontFamily: 'JetBrains Mono',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        <div className="t-pink" style={{ fontWeight: 700, marginBottom: 2 }}>
          ● LIVE
        </div>
        <div>ARCS {String(arcs.length).padStart(4, '0')}</div>
        <div>POINTS {points.length}</div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          right: 14,
          fontSize: 10,
          color: palette.textHud,
          opacity: 0.75,
          fontFamily: 'JetBrains Mono',
          letterSpacing: 1,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        AUTO-ROT · DRAG · WHEEL ZOOM
      </div>
    </div>
  )
}

