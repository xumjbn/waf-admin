// 全球攻击轨迹（dashboard 首页 /aggregation 用）
//
// 实现：echarts + echarts-gl 的 globe 系列 —— 真 3D 地球。
//   · world.json (public/maps) 作为地表纹理 + 国家边界
//   · 攻击源用真实 IP 经纬度（attack_logs.lat / .lng）打散点（scatter3D）
//   · 攻击弧线 src → HQ 用 lines3D 动画粒子
//   · 国家级聚合作为额外柱状层（series.bar3D 或 scatter3D，按 count 调大小）
//   · 自动旋转 + 鼠标拖拽旋转 + 滚轮缩放（globe.viewControl 开关 + autoRotate）
//
// 数据流：dashboard 拉真 attack_logs → 传 attacks prop（含 lat/lng/country/typeColor）。
// 这里负责把它们映射成 echarts series。不再有内部 mock 数据。

import { useEffect, useMemo, useRef, useState } from 'react'
// echarts 6 已经默认带 CanvasRenderer + 全部组件；只要导一次 echarts-gl 注册 globe 系列即可
import * as echarts from 'echarts'
import 'echarts-gl'
import type { AttackEvent } from '@/mocks/nebula'

let worldRegistered = false
async function ensureWorldMap() {
  if (worldRegistered) return
  try {
    const res = await fetch('/maps/world.json')
    const json = await res.json()
    if (json?.type === 'FeatureCollection' && Array.isArray(json.features)) {
      json.features = json.features.map((f: { type?: string }) => ({ ...f, type: 'Feature' }))
    }
    if (json?.crs) delete json.crs
    echarts.registerMap('world', json)
    worldRegistered = true
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[AttackGlobe] world.json load failed', e)
  }
}

const HQ = { lat: 32.0, lng: 116.0, name: '防护中心' } // 北京附近，作为攻击弧线目的地

export interface AttackGlobeProps {
  /** 真实攻击事件列表；含 lat/lng/country/typeColor */
  attacks: AttackEvent[]
  /** 高度（px）；宽度自适应父容器 */
  height?: number
  /** 自动旋转。默认 true */
  autoRotate?: boolean
  /** 自动旋转速度（°/s）。默认 6 */
  autoRotateSpeed?: number
}

export function AttackGlobe({
  attacks,
  height = 460,
  autoRotate = true,
  autoRotateSpeed = 6,
}: AttackGlobeProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const [ready, setReady] = useState(false)

  // 聚合：按 country 汇总点数、累计经纬度（用平均值作为国家中心点的近似）。
  // 对每个国家保留实际 IP 的明细数组用于精确散点。
  const { ipPoints, countryAgg, arcs } = useMemo(() => {
    const ipPoints: Array<{ name: string; value: [number, number, number]; color: string }> = []
    const byCountry = new Map<
      string,
      { count: number; sumLat: number; sumLng: number }
    >()
    const arcs: Array<{ coords: [[number, number], [number, number]]; color: string }> = []

    for (const a of attacks) {
      if (!a.lat || !a.lng || (a.lat === 0 && a.lng === 0)) continue
      ipPoints.push({
        name: `${a.country} · ${a.ip}`,
        value: [a.lng, a.lat, 1],
        color: a.typeColor || '#ec4899',
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
        color: a.typeColor || '#ec4899',
      })
    }

    const countryAgg: Array<{
      name: string
      value: [number, number, number]
    }> = []
    byCountry.forEach((v, k) => {
      countryAgg.push({
        name: `${k} · ${v.count} 次`,
        // bar3D / scatter3D 的 value: [lng, lat, magnitude]
        value: [v.sumLng / v.count, v.sumLat / v.count, v.count],
      })
    })

    return { ipPoints, countryAgg, arcs }
  }, [attacks])

  // 初始化：注册地图 → 构造 chart 实例
  useEffect(() => {
    ensureWorldMap().then(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready || !wrapRef.current) return
    const inst = echarts.init(wrapRef.current)
    chartRef.current = inst
    const onResize = () => inst.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      inst.dispose()
      chartRef.current = null
    }
  }, [ready])

  // 更新 option（数据变化时只 setOption，无需重建）
  useEffect(() => {
    const inst = chartRef.current
    if (!inst) return
    inst.setOption(
      {
        backgroundColor: 'transparent',
        tooltip: {
          formatter: (params: { name: string; value: unknown }) => params.name,
          backgroundColor: 'rgba(13,10,24,.92)',
          borderColor: 'rgba(168,85,247,.4)',
          textStyle: { color: '#f3eaff', fontSize: 12 },
        },
        globe: {
          // 地表色：深紫黑底
          environment: '#0a0518',
          baseColor: '#1a0b2e',
          // 地图作为 surface texture（无外部纹理依赖；颜色由 regions 渲染）
          // 直接用矢量 world.json
          shading: 'color',
          atmosphere: {
            show: true,
            offset: 4,
            color: '#a855f7',
            glowPower: 4,
            innerGlowPower: 2,
          },
          light: {
            main: { color: '#fff', intensity: 1.1, shadow: false, alpha: 40, beta: 30 },
            ambient: { color: '#a855f7', intensity: 0.35 },
          },
          viewControl: {
            autoRotate,
            autoRotateSpeed,
            autoRotateAfterStill: 4,        // 用户停手后 4s 恢复自动旋转
            distance: 200,                   // 初始距离（越小越大）
            minDistance: 120,                // 缩放上限（最近）
            maxDistance: 320,                // 缩放下限（最远）
            alpha: 15,                       // 初始视角 alpha (pitch)
            beta: 30,                        // 初始视角 beta (yaw)
            damping: 0.85,
            rotateSensitivity: 1,
            zoomSensitivity: 1.4,
            targetCoord: [HQ.lng, HQ.lat],   // 视点初始对准防护中心
          },
          layers: [
            {
              type: 'overlay',
              show: true,
              shading: 'color',
            },
          ],
          regionHeight: 1,
          displacementScale: 0,
        },
        // 用世界地图做地表色块（series.map3D 内嵌在 globe 里，但 globe series 自身
        // 支持 geo3D-style regions —— 这里通过 regions 数组渲染国家轮廓）
        geo3D: {
          show: false, // 不画独立 geo3D，统一在 globe 上
        },
        series: [
          // 1) 国家级聚合 —— bar3D，柱高 = 当国攻击次数
          {
            name: '国家攻击聚合',
            type: 'bar3D',
            coordinateSystem: 'globe',
            data: countryAgg,
            barSize: 0.6,
            minHeight: 0.8,
            silent: false,
            itemStyle: {
              color: '#f59e0b',
              opacity: 0.85,
            },
            shading: 'color',
            emphasis: {
              itemStyle: {
                color: '#fbbf24',
              },
              label: {
                show: true,
                textStyle: { color: '#fff', fontSize: 12 },
              },
            },
          },
          // 2) 单 IP 精确散点 —— scatter3D
          {
            name: '攻击源 IP',
            type: 'scatter3D',
            coordinateSystem: 'globe',
            blendMode: 'lighter',
            symbolSize: 6,
            itemStyle: {
              color: (p: { data: { color?: string } }) => p.data?.color || '#ec4899',
              opacity: 0.85,
              borderWidth: 0,
            },
            data: ipPoints,
          },
          // 3) 攻击弧线 —— lines3D，从 src 到 HQ
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
            lineStyle: {
              width: 1,
              opacity: 0.55,
              color: (p: { data: { color?: string } }) => p.data?.color || '#a855f7',
            },
            data: arcs.slice(0, 200), // 太多弧线会卡，截到 200
          },
          // 4) HQ 标记 —— 一个加粗散点
          {
            name: '防护中心',
            type: 'scatter3D',
            coordinateSystem: 'globe',
            symbolSize: 14,
            itemStyle: { color: '#22d3ee', opacity: 1 },
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
            data: [
              {
                name: HQ.name,
                value: [HQ.lng, HQ.lat, 1],
              },
            ],
          },
        ],
      },
      true,
    )
  }, [ready, ipPoints, countryAgg, arcs, autoRotate, autoRotateSpeed])

  return (
    <div style={{ position: 'relative', height }}>
      <div ref={wrapRef} style={{ width: '100%', height: '100%' }} />

      {/* 角标 HUD */}
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
        }}
      >
        AUTO-ROT · DRAG TO ROTATE · WHEEL TO ZOOM
      </div>
    </div>
  )
}
