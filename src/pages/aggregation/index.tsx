import { Routes, Route, Navigate } from 'react-router-dom'
import AttacksMonitor from './attacks-monitor'
import SystemMonitor from './system-monitor'

const AggregationRoutes = () => (
  <Routes>
    <Route index element={<Navigate to="attacks-monitor" replace />} />
    <Route path="attacks-monitor" element={<AttacksMonitor />} />
    <Route path="system-monitor" element={<SystemMonitor />} />
  </Routes>
)

export default AggregationRoutes
