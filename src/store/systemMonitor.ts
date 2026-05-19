import { create } from 'zustand'

const MAX_POINTS = 60

interface NodeHistory {
  timestamps: string[]
  cpu: number[]
  memory: number[]
  disk: number[]
}

interface SystemMonitorState {
  nodes: Record<string, NodeHistory>
  push: (nodeId: string, cpu: number, memory: number, disk: number) => void
}

const emptyHistory = (): NodeHistory => ({
  timestamps: [],
  cpu: [],
  memory: [],
  disk: [],
})

export const useSystemMonitorStore = create<SystemMonitorState>(set => ({
  nodes: {},
  push: (nodeId, cpu, memory, disk) =>
    set(state => {
      const prev = state.nodes[nodeId] ?? emptyHistory()
      const ts = new Date().toLocaleTimeString('zh-CN', { hour12: false })
      const slice = (arr: number[], v: number) => [...arr, v].slice(-MAX_POINTS)
      return {
        nodes: {
          ...state.nodes,
          [nodeId]: {
            timestamps: [...prev.timestamps, ts].slice(-MAX_POINTS),
            cpu: slice(prev.cpu, cpu),
            memory: slice(prev.memory, memory),
            disk: slice(prev.disk, disk),
          },
        },
      }
    }),
}))
