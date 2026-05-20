// 全球攻击轨迹（dashboard 首页 /aggregation 用）
//
// 实现：echarts + echarts-gl 的 globe 系列（3D 地球）。
// 渲染失败时显示降级的 2D 占位条，不会让整页崩。
//
// 数据流：dashboard 拉真 attack_logs → 传 attacks prop（含 lat/lng/country/typeColor）。
// 三层数据：
//   1) bar3D    国家级聚合，柱高 = 攻击次数
//   2) scatter3D 单 IP 真实经纬度散点
//   3) lines3D   src(lat,lng) → HQ 弧线 + 粒子动画

import { Component, useEffect, useMemo, useState } from 'react'
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

export interface AttackGlobeProps {
  attacks: AttackEvent[]
  height?: number
  autoRotate?: boolean
  autoRotateSpeed?: number
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

export function AttackGlobe(props: AttackGlobeProps) {
  return (
    <GlobeErrorBoundary fallback={<GlobeFallback height={props.height ?? 460} />}>
      <GlobeInner {...props} />
    </GlobeErrorBoundary>
  )
}

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
        lineHeight: 1.6,
        padding: 16,
        textAlign: 'center',
      }}
    >
      <div>
        <div className="fw-700 mb-2">3D 地球渲染失败</div>
        <div className="muted fs-12">
          浏览器可能未启用 WebGL，或 echarts-gl 与当前 echarts 版本不兼容。
          <br />
          实例与攻击日志数据不受影响 —— 可继续使用其他面板。
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
}: AttackGlobeProps) {
  const [mapReady, setMapReady] = useState(false)
  useEffect(() => {
    ensureWorldMap().then(setMapReady)
  }, [])

  // 聚合 + 散点 + 弧线
  const { ipPoints, countryAgg, arcs } = useMemo(() => {
    const ipPoints: Array<{ name: string; value: [number, number, number]; color: string }> = []
    const byCountry = new Map<string, { count: number; sumLat: number; sumLng: number }>()
    const arcs: Array<{ coords: [[number, number], [number, number]]; color: string }> = []

    for (const a of attacks) {
      if (!a || typeof a.lat !== 'number' || typeof a.lng !== 'number') continue
      if (a.lat === 0 && a.lng === 0) continue
      const color = a.typeColor || '#ec4899'
      ipPoints.push({
        name: `${a.country || '未知'} · ${a.ip}`,
        value: [a.lng, a.lat, 1],
        color,
      })
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
        color,
      })
    }

    const countryAgg: Array<{ name: string; value: [number, number, number] }> = []
    byCountry.forEach((v, k) => {
      countryAgg.push({
        name: `${k} · ${v.count} 次`,
        value: [v.sumLng / v.count, v.sumLat / v.count, v.count],
      })
    })

    return { ipPoints, countryAgg, arcs: arcs.slice(0, 200) }
  }, [attacks])

  const option = useMemo<EChartsOption>(
    () =>
      ({
        backgroundColor: 'transparent',
        tooltip: {
          show: true,
          backgroundColor: 'rgba(13,10,24,.92)',
          borderColor: 'rgba(168,85,247,.4)',
          textStyle: { color: '#f3eaff', fontSize: 12 },
        },
        // echarts-gl globe
        globe: {
          environment: '#0a0518',
          baseColor: '#1a0b2e',
          shading: 'color',
          atmosphere: {
            show: true,
            offset: 4,
            color: '#a855f7',
            glowPower: 4,
            innerGlowPower: 2,
          },
          light: {
            main: { color: '#ffffff', intensity: 1.2, alpha: 40, beta: 30 },
            ambient: { color: '#a855f7', intensity: 0.4 },
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
          ...(mapReady ? { map: 'world' } : {}),
          regionHeight: 1,
        },
        series: [
          {
            name: '国家攻击聚合',
            type: 'bar3D',
            coordinateSystem: 'globe',
            data: countryAgg,
            barSize: 0.6,
            minHeight: 0.8,
            itemStyle: { color: '#f59e0b', opacity: 0.85 },
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
            itemStyle: {
              opacity: 0.85,
              borderWidth: 0,
            },
            // scatter3D 不支持按数据项 color 回调；统一颜色 + 单独再加一层 IP 散点彩色版会太重
            // 这里用粉紫做整体色，让数量感知更强；分类色靠 lines3D 表达
            color: '#ec4899',
            data: ipPoints,
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
            lineStyle: { width: 1, opacity: 0.55, color: '#a855f7' },
            data: arcs,
          },
          {
            name: '防护中心',
            type: 'scatter3D',
            coordinateSystem: 'globe',
            symbolSize: 14,
            color: '#22d3ee',
            label: {
              show: true,
              formatter: HQ.name,
              textStyle: {
                color: '#22d3ee',
                fontSize: 11,
                backgroundColor: 'rgba(13,10,24,.7)',
                padding: [3, 6],
                borderRadius: 4,
              },
            },
            data: [{ name: HQ.name, value: [HQ.lng, HQ.lat, 1] }],
          },
        ],
      }) as unknown as EChartsOption,
    [ipPoints, countryAgg, arcs, autoRotate, autoRotateSpeed, mapReady],
  )

  return (
    <div style={{ position: 'relative', height }}>
      <ReactECharts
        option={option}
        style={{ width: '100%', height: '100%' }}
        notMerge
        lazyUpdate
        opts={{ renderer: 'canvas' }}
      />
      {/* HUD */}
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
          color: 'var(--text-3)',
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
          color: 'var(--text-3)',
          fontFamily: 'JetBrains Mono',
          letterSpacing: 1,
          pointerEvents: 'none',
        }}
      >
        AUTO-ROT · DRAG TO ROTATE · WHEEL TO ZOOM
      </div>
    </div>
  )
}
