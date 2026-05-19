import { Routes, Route, Navigate } from 'react-router-dom'
import AttackLog from './AttackLog'
import OperationLog from './OperationLog'
import WebAccess from './WebAccess'

const LogRoutes = () => (
  <Routes>
    <Route index element={<Navigate to="attack" replace />} />
    <Route path="attack" element={<AttackLog />} />
    <Route path="operation" element={<OperationLog />} />
    <Route path="web-access" element={<WebAccess />} />
  </Routes>
)

export default LogRoutes
