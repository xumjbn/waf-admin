import { Routes, Route, Navigate } from 'react-router-dom'
import CustomReport from './CustomReport'
import CombinedReport from './CombinedReport'
import ManualGenerated from './ManualGenerated'
import TimingGenerated from './TimingGenerated'
import TimingTask from './TimingTask'

const ReportRoutes = () => (
  <Routes>
    <Route index element={<Navigate to="custom" replace />} />
    <Route path="custom" element={<CustomReport />} />
    <Route path="combined" element={<CombinedReport />} />
    <Route path="manual-generated" element={<ManualGenerated />} />
    <Route path="timing-generated" element={<TimingGenerated />} />
    <Route path="timing-task" element={<TimingTask />} />
  </Routes>
)

export default ReportRoutes
