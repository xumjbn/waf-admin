import * as echarts from 'echarts'

const mapCache: Record<string, boolean> = {}

export async function registerMap(name: string): Promise<void> {
  if (mapCache[name]) return

  const resp = await fetch(`/maps/${name}.json`)
  const json = await resp.json()
  echarts.registerMap(name, json)
  mapCache[name] = true
}
