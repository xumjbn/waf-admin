// 全球攻击轨迹（dashboard 首页 /aggregation 用）
//
// 渲染：echarts + echarts-gl 的 globe 系列（3D 地球）。
// - 按 body[data-theme='light'|'dark'] 切换调色板，浅色模式背景为浅
// - shading='lambert' + regionHeight=3，让国家相对海洋"凸起"可见
// - 自动旋转 / 鼠标拖拽 / 滚轮缩放（min 120 max 320）
// - 全屏由父组件通过 ref 控制；自身组件保留 prop fullscreen 用于自适应高度
// - 渲染失败用 ErrorBoundary 兜底
//
// 数据：dashboard 拉真 attack_logs → 传 attacks prop（含 lat/lng/country/typeColor）。

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
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import 'echarts-gl'
import type { EChartsOption } from 'echarts'
import type { AttackEvent } from '@/mocks/nebula'

let worldRegistered = false
async function ensureWorldMap(): Promise<boolean> {
  if (worldRegistered) return true
  try {
    const res = await fetch('/maps/world.json')
    const json = await res.json()
    if (json?.type === 'FeatureCollection' && Array.isArray(json.features)) {
      json.features = json.features.map((f: { type?: string }) => ({ ...f, type: 'Feature' }))
    }
    if (json?.crs) delete json.crs
    echarts.registerMap('world', json)
    worldRegistered = true
    return true
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[AttackGlobe] world.json load failed', e)
    return false
  }
}

const HQ = { lat: 32.0, lng: 116.0, name: '防护中心' }

// 浅/深主题对应的两套调色板
interface Palette {
  environment: string // 球外的星空/背景纯色
  baseColor: string   // 海洋（基础球面）
  regionColor: string // 大陆（凸起部分）默认颜色
  atmosphere: string
  ambient: string
  arc: string         // lines3D 弧线
  ipPoint: string     // scatter3D 单 IP
  hqPoint: string     // 防护中心
  textHud: string
}
function getPalette(): Palette {
  const theme =
    typeof document !== 'undefined' ? document.body.dataset.theme || 'dark' : 'dark'
  if (theme === 'light') {
    return {
      environment: '#eef2f8',
      baseColor: '#bcd0e6',   // 浅蓝海洋
      regionColor: '#7a8db3', // 深一档的大陆
      atmosphere: '#a855f7',
      ambient: '#c4b5fd',
      arc: '#a855f7',
      ipPoint: '#ec4899',
      hqPoint: '#0ea5e9',
      textHud: '#3b3052',
    }
  }
  return {
    environment: '#0a0518',
    baseColor: '#0f1626',
    regionColor: '#2a1f4a',
    atmosphere: '#a855f7',
    ambient: '#a855f7',
    arc: '#a855f7',
    ipPoint: '#ec4899',
    hqPoint: '#22d3ee',
    textHud: '#cdc2e0',
  }
}

export interface AttackGlobeProps {
  attacks: AttackEvent[]
  height?: number
  autoRotate?: boolean
  autoRotateSpeed?: number
}

export interface AttackGlobeHandle {
  /** 切到/退出浏览器全屏（绑容器 div） */
  toggleFullscreen: () => void
}

interface GlobeBoundaryState {
  hasError: boolean
  msg: string
}
class GlobeErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  GlobeBoundaryState
> {
  state: GlobeBoundaryState = { hasError: false, msg: '' }
  static getDerivedStateFromError(err: unknown): GlobeBoundaryState {
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
          浏览器可能未启用 WebGL，或 echarts-gl 与当前 echarts 版本不兼容。
          <br />
          实例与攻击日志数据不受影响。
        </div>
      </div>
    </div>
  )
}

function GlobeInner({
  attacks,
  height = 460,
  autoRotate = true,
  autoRotateSpeed = 6,
  fwdRef,
}: AttackGlobeProps & { fwdRef: React.Ref<AttackGlobeHandle> }) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [paletteKey, setPaletteKey] = useState<'light' | 'dark'>(() =>
    typeof document !== 'undefined' && document.body.dataset.theme === 'light'
      ? 'light'
      : 'dark',
  )

  // 监听 body[data-theme] 变化（用户切换主题时立即重绘）
  useEffect(() => {
    const obs = new MutationObserver(() => {
      const t = document.body.dataset.theme === 'light' ? 'light' : 'dark'
      setPaletteKey(prev => (prev === t ? prev : t))
    })
    obs.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    ensureWorldMap().then(setMapReady)
  }, [])

  // 暴露 toggleFullscreen 给父组件（dashboard 上 Card 的『全屏』按钮）
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

  const palette = useMemo(() => getPalette(), [paletteKey])

  const { ipPoints, topIpLabels, countryAgg, arcs } = useMemo(() => {
    const ipPoints: Array<{ name: string; value: [number, number, number] }> = []
    const byCountry = new Map<string, { count: number; sumLat: number; sumLng: number }>()
    const byIp = new Map<
      string,
      { ip: string; country: string; lat: number; lng: number; count: number }
    >()
    const arcs: Array<{ coords: [[number, number], [number, number]] }> = []

    for (const a of attacks) {
      if (!a || typeof a.lat !== 'number' || typeof a.lng !== 'number') continue
      if (a.lat === 0 && a.lng === 0) continue
      const ip = a.ip || '—'
      ipPoints.push({
        name: `${a.country || '未知'} · ${ip}`,
        value: [a.lng, a.lat, 1],
      })

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

      const k = a.country || '未知'
      const cur = byCountry.get(k) ?? { count: 0, sumLat: 0, sumLng: 0 }
      cur.count++
      cur.sumLat += a.lat
      cur.sumLng += a.lng
      byCountry.set(k, cur)

      arcs.push({
        coords: [
          [a.lng, a.lat],
          [HQ.lng, HQ.lat],
        ],
      })
    }

    const countryAgg: Array<{ name: string; value: [number, number, number] }> = []
    byCountry.forEach((v, k) => {
      countryAgg.push({
        name: `${k} · ${v.count} 次`,
        value: [v.sumLng / v.count, v.sumLat / v.count, v.count],
      })
    })

    // Top N 攻击源 IP，永远显示标签（不限于悬停）。
    // 取前 30 个 IP（按命中次数降序），避免几百个 label 互相重叠不可读。
    const topIpLabels = Array.from(byIp.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 30)
      .map(v => ({
        name: `${v.ip}${v.count > 1 ? `  ×${v.count}` : ''}`,
        value: [v.lng, v.lat, 1],
      }))

    return { ipPoints, topIpLabels, countryAgg, arcs: arcs.slice(0, 200) }
  }, [attacks])

  const option = useMemo<EChartsOption>(
    () =>
      ({
        backgroundColor: palette.environment,
        tooltip: {
          show: true,
          backgroundColor:
            paletteKey === 'light' ? 'rgba(255,255,255,.95)' : 'rgba(13,10,24,.92)',
          borderColor: 'rgba(168,85,247,.4)',
          textStyle: { color: palette.textHud, fontSize: 12 },
        },
        globe: {
          environment: palette.environment,
          baseColor: palette.baseColor,
          // lambert shading：海洋(baseColor) 与 陆地(regionHeight 抬起的高度) 通过
          // 光照差异显形。'color' 模式所有区域全是 baseColor，看不到大陆轮廓。
          shading: 'lambert',
          atmosphere: {
            show: true,
            offset: 4,
            color: palette.atmosphere,
            glowPower: 4,
            innerGlowPower: 2,
          },
          light: {
            main: {
              color: '#ffffff',
              intensity: paletteKey === 'light' ? 1.4 : 1.1,
              alpha: 40,
              beta: 30,
              shadow: false,
            },
            ambient: { color: palette.ambient, intensity: 0.4 },
          },
          viewControl: {
            autoRotate,
            autoRotateSpeed,
            autoRotateAfterStill: 4,
            distance: 200,
            minDistance: 120,
            maxDistance: 320,
            alpha: 15,
            beta: 30,
            damping: 0.85,
            rotateSensitivity: 1,
            zoomSensitivity: 1.4,
            targetCoord: [HQ.lng, HQ.lat],
          },
          ...(mapReady
            ? {
                map: 'world',
                // 关键：抬高大陆，配合 lambert 让国家可见
                regionHeight: 3,
                itemStyle: {
                  color: palette.regionColor,
                  borderWidth: 0.5,
                  borderColor: paletteKey === 'light' ? '#5b6b8d' : '#5b3fa3',
                },
                emphasis: {
                  itemStyle: {
                    color: '#f59e0b',
                  },
                },
              }
            : {}),
        },
        series: [
          {
            name: '国家攻击聚合',
            type: 'bar3D',
            coordinateSystem: 'globe',
            data: countryAgg,
            barSize: 0.6,
            minHeight: 0.8,
            itemStyle: { color: '#f59e0b', opacity: 0.9 },
            shading: 'color',
            emphasis: {
              itemStyle: { color: '#fbbf24' },
              label: { show: true, textStyle: { color: '#fff', fontSize: 12 } },
            },
          },
          {
            name: '攻击源 IP',
            type: 'scatter3D',
            coordinateSystem: 'globe',
            blendMode: 'lighter',
            symbolSize: 6,
            itemStyle: { opacity: 0.85, borderWidth: 0 },
            color: palette.ipPoint,
            data: ipPoints,
            // 悬停时高亮 + 展示完整 country · IP
            emphasis: {
              label: {
                show: true,
                formatter: '{b}',
                textStyle: {
                  color: '#fff',
                  fontSize: 11,
                  backgroundColor: 'rgba(13,10,24,.85)',
                  padding: [3, 6],
                  borderRadius: 4,
                },
              },
            },
          },
          // 永远显示标签的 Top 30 攻击源 IP（按命中次数）
          {
            name: '高频 IP 标签',
            type: 'scatter3D',
            coordinateSystem: 'globe',
            blendMode: 'lighter',
            symbolSize: 8,
            itemStyle: { color: '#fbbf24', opacity: 1, borderColor: '#fff', borderWidth: 1 },
            data: topIpLabels,
            label: {
              show: true,
              position: 'right',
              formatter: '{b}',
              distance: 6,
              textStyle: {
                color: paletteKey === 'light' ? '#1a0b2e' : '#fef3c7',
                fontSize: 10,
                fontFamily: 'JetBrains Mono',
                fontWeight: 600,
                backgroundColor:
                  paletteKey === 'light' ? 'rgba(255,255,255,.88)' : 'rgba(13,10,24,.78)',
                padding: [2, 5],
                borderRadius: 3,
                borderWidth: 1,
                borderColor:
                  paletteKey === 'light' ? 'rgba(91,33,182,.18)' : 'rgba(168,85,247,.35)',
              },
            },
          },
          {
            name: '攻击轨迹',
            type: 'lines3D',
            coordinateSystem: 'globe',
            blendMode: 'lighter',
            effect: {
              show: true,
              period: 2,
              trailLength: 0.18,
              trailWidth: 4,
              trailOpacity: 0.9,
              constantSpeed: 28,
            },
            lineStyle: { width: 1, opacity: 0.55, color: palette.arc },
            data: arcs,
          },
          {
            name: '防护中心',
            type: 'scatter3D',
            coordinateSystem: 'globe',
            symbolSize: 14,
            color: palette.hqPoint,
            label: {
              show: true,
              formatter: HQ.name,
              textStyle: {
                color: palette.hqPoint,
                fontSize: 11,
                backgroundColor:
                  paletteKey === 'light' ? 'rgba(255,255,255,.85)' : 'rgba(13,10,24,.7)',
                padding: [3, 6],
                borderRadius: 4,
              },
            },
            data: [{ name: HQ.name, value: [HQ.lng, HQ.lat, 1] }],
          },
        ],
      }) as unknown as EChartsOption,
    [ipPoints, countryAgg, arcs, autoRotate, autoRotateSpeed, mapReady, palette, paletteKey],
  )

  // 全屏态下铺满整个视口
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    height,
    background: palette.environment,
    width: '100%',
  }

  return (
    <div ref={wrapRef} style={containerStyle}>
      <ReactECharts
        option={option}
        notMerge
        lazyUpdate
        style={{ width: '100%', height: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
      {/* HUD */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          fontSize: 11,
          color: palette.textHud,
          opacity: 0.85,
          fontFamily: 'JetBrains Mono',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          pointerEvents: 'none',
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
          opacity: 0.85,
          fontFamily: 'JetBrains Mono',
          pointerEvents: 'none',
        }}
      >
        <div className="t-pink" style={{ fontWeight: 700, marginBottom: 2 }}>
          ● LIVE
        </div>
        <div>POINTS {String(ipPoints.length).padStart(4, '0')}</div>
        <div>COUNTRIES {countryAgg.length}</div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          right: 14,
          fontSize: 10,
          color: palette.textHud,
          opacity: 0.7,
          fontFamily: 'JetBrains Mono',
          letterSpacing: 1,
          pointerEvents: 'none',
        }}
      >
        AUTO-ROT · DRAG TO ROTATE · WHEEL TO ZOOM · F / 全屏按钮
      </div>
    </div>
  )
}
