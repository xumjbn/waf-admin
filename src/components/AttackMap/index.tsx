import { useState, useEffect, useMemo, useRef } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import { Button, Space } from 'antd'
import { GlobalOutlined } from '@ant-design/icons'
import { severityColors } from '@/theme'
import type { EChartsOption } from 'echarts'

interface AttackData {
  src_ip: string
  dst_ip: string
  src_geo_coord: [number, number]
  dst_geo_coord: [number, number]
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  datetime: string
  host: string
}

interface AttackMapProps {
  attacks: AttackData[]
  height?: number | string
}

type MapType = 'world' | 'china'

interface GeoFeature {
  type: string
  properties: { name: string; childNum?: number }
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][]
  }
}

interface GeoJson {
  type: string
  features: GeoFeature[]
}

const mapCache: Record<string, GeoJson> = {}

async function loadAndRegisterMap(name: string): Promise<void> {
  if (mapCache[name]) return
  const resp = await fetch(`/maps/${name}.json`)
  const json = await resp.json()
  if (json.type === 'FeatureCollection' && Array.isArray(json.features)) {
    json.features = json.features.map((f: GeoFeature) => ({ ...f, type: 'Feature' }))
  }
  delete (json as any).crs
  echarts.registerMap(name, json)
  mapCache[name] = json
}

// Ray casting algorithm: point-in-polygon test
function pointInPolygon(lng: number, lat: number, ring: number[][]): boolean {
  if (!ring || !Array.isArray(ring) || ring.length === 0) return false
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0],
      yi = ring[i][1]
    const xj = ring[j][0],
      yj = ring[j][1]
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function getCountryByCoord(latLng: [number, number], geoJson: GeoJson): string {
  const [lat, lng] = latLng
  for (const feature of geoJson.features) {
    const { geometry, properties } = feature
    if (!geometry || !properties?.name || !Array.isArray(geometry.coordinates)) continue
    try {
      if (geometry.type === 'Polygon') {
        const ring = geometry.coordinates?.[0]
        if (Array.isArray(ring) && pointInPolygon(lng, lat, ring)) return properties.name
      } else if (geometry.type === 'MultiPolygon') {
        for (const poly of geometry.coordinates as unknown as number[][][][]) {
          if (!Array.isArray(poly)) continue
          const ring = poly?.[0]
          if (Array.isArray(ring) && pointInPolygon(lng, lat, ring)) return properties.name
        }
      }
    } catch {
      continue
    }
  }
  return ''
}

const AttackMap = ({ attacks, height = 600 }: AttackMapProps) => {
  const [mapType, setMapType] = useState<MapType>('world')
  const [mapReady, setMapReady] = useState(false)
  const chartRef = useRef<ReactECharts>(null)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMapReady(false)
    loadAndRegisterMap(mapType)
      .then(() => {
        if (!cancelled) setMapReady(true)
      })
      .catch(err => console.error('Failed to load map:', err))
    return () => {
      cancelled = true
    }
  }, [mapType])

  const chartOption = useMemo<EChartsOption>(() => {
    if (!mapReady) return {}

    // src_geo_coord is [lat, lng]; ECharts geo expects [lng, lat]
    const flip = (coord: [number, number]): [number, number] => [coord[1], coord[0]]

    // Aggregate attack counts per country
    const countryCount: Record<string, number> = {}
    const geoJson = mapCache[mapType]
    if (geoJson) {
      attacks.forEach(attack => {
        const country = getCountryByCoord(attack.src_geo_coord, geoJson)
        if (country) countryCount[country] = (countryCount[country] || 0) + 1
      })
    }

    const mapSeriesData = Object.entries(countryCount).map(([name, value]) => ({ name, value }))
    const maxCount = Math.max(...Object.values(countryCount), 1)

    const scatterData = attacks.flatMap(attack => [
      {
        name: attack.src_ip,
        value: [...flip(attack.src_geo_coord)],
        itemStyle: { color: severityColors[attack.severity] },
        attack,
      },
      {
        name: attack.dst_ip,
        value: [...flip(attack.dst_geo_coord)],
        itemStyle: { color: severityColors[attack.severity] },
        attack,
      },
    ])

    const linesData = attacks.map(attack => ({
      coords: [flip(attack.src_geo_coord), flip(attack.dst_geo_coord)],
      lineStyle: {
        color: severityColors[attack.severity],
        width: 1.5,
        opacity: 0.75,
        shadowBlur: 8,
        shadowColor: severityColors[attack.severity],
      },
      attack,
    }))

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(5, 15, 35, 0.95)',
        borderColor: 'rgba(0, 102, 255, 0.4)',
        borderWidth: 1,
        textStyle: { color: '#e0e6f0', fontSize: 12 },
        formatter: (params: any) => {
          if (params.componentSubType === 'scatter') {
            const a = params.data.attack as AttackData
            const sColor = severityColors[a.severity]
            return `<div style="padding:10px 12px;min-width:200px">
              <div style="font-weight:600;margin-bottom:8px;color:#4d94ff;font-size:13px">攻击详情</div>
              <div style="margin:4px 0;color:#8c8ca1">源IP: <span style="color:#e0e6f0">${a.src_ip}</span></div>
              <div style="margin:4px 0;color:#8c8ca1">目标IP: <span style="color:#e0e6f0">${a.dst_ip}</span></div>
              <div style="margin:4px 0;color:#8c8ca1">主机: <span style="color:#e0e6f0">${a.host}</span></div>
              <div style="margin:4px 0;color:#8c8ca1">威胁等级: <span style="color:${sColor};font-weight:700">${a.severity.toUpperCase()}</span></div>
              <div style="margin:4px 0;color:#555770;font-size:11px">${a.datetime}</div>
            </div>`
          }
          if (params.componentSubType === 'map' && params.value != null) {
            return `<div style="padding:8px 12px">
              <div style="font-weight:600;color:#4d94ff">${params.name}</div>
              <div style="margin-top:4px;color:#8c8ca1">攻击次数: <span style="color:#ff6b35;font-weight:700">${params.value}</span></div>
            </div>`
          }
          return ''
        },
      },
      visualMap: {
        min: 0,
        max: maxCount,
        text: ['高危', '低危'],
        realtime: false,
        calculable: true,
        inRange: {
          color: ['#0d1f3c', '#0a3d6b', '#1565c0', '#ff9800', '#ff6b35', '#f44336'],
        },
        textStyle: { color: '#555770', fontSize: 11 },
        left: 16,
        bottom: 24,
        itemWidth: 14,
        itemHeight: 80,
      },
      geo: {
        map: mapType,
        roam: true,
        zoom: mapType === 'china' ? 1.2 : 1.2,
        itemStyle: {
          areaColor: '#0d1f3c',
          borderColor: '#1e3a5f',
          borderWidth: 0.8,
        },
        emphasis: {
          itemStyle: {
            areaColor: '#1e4080',
            borderColor: '#4d94ff',
            borderWidth: 1.5,
          },
          label: { show: true, color: '#e0e6f0', fontSize: 11 },
        },
        label: { show: false },
      },
      series: [
        {
          type: 'map',
          map: mapType,
          geoIndex: 0,
          data: mapSeriesData,
          emphasis: {
            label: { show: true, color: '#fff' },
          },
        },
        {
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: scatterData,
          symbolSize: 9,
          rippleEffect: {
            brushType: 'stroke',
            scale: 4,
            period: 2.5,
          },
          itemStyle: {
            shadowBlur: 12,
            shadowColor: 'rgba(255,255,255,0.6)',
          },
          zlevel: 2,
        },
        {
          type: 'lines',
          coordinateSystem: 'geo',
          data: linesData,
          effect: {
            show: true,
            period: 3.5,
            trailLength: 0.45,
            symbol: 'arrow',
            symbolSize: 5,
            color: 'rgba(255,255,255,0.9)',
          },
          lineStyle: { curveness: 0.3 },
          zlevel: 1,
        },
      ],
    } as EChartsOption
  }, [attacks, mapType, mapReady])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Space style={{ position: 'absolute', top: 14, right: 14, zIndex: 10 }}>
        <Button
          size="small"
          icon={<GlobalOutlined />}
          onClick={() => setMapType('world')}
          style={{
            backgroundColor: mapType === 'world' ? '#0066ff' : 'rgba(255,255,255,0.08)',
            borderColor: mapType === 'world' ? '#0066ff' : 'rgba(255,255,255,0.15)',
            color: '#fff',
            fontSize: 12,
          }}
        >
          世界
        </Button>
        <Button
          size="small"
          onClick={() => setMapType('china')}
          style={{
            backgroundColor: mapType === 'china' ? '#0066ff' : 'rgba(255,255,255,0.08)',
            borderColor: mapType === 'china' ? '#0066ff' : 'rgba(255,255,255,0.15)',
            color: '#fff',
            fontSize: 12,
          }}
        >
          中国
        </Button>
      </Space>
      {mapReady ? (
        <ReactECharts
          ref={chartRef}
          echarts={echarts}
          option={chartOption}
          style={{ height, width: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge
        />
      ) : (
        <div
          style={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #050f23 0%, #0a1929 100%)',
            color: '#555770',
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          地图加载中...
        </div>
      )}
    </div>
  )
}

export default AttackMap
