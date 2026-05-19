import { Routes, Route, Navigate } from 'react-router-dom'
import PolicyList from './PolicyList'
import PolicyDetail from './PolicyDetail'

const AclRoutes = () => (
  <Routes>
    <Route index element={<Navigate to="policies" replace />} />
    <Route path="policies" element={<PolicyList />} />
    <Route path="policies/:id" element={<PolicyDetail />} />
  </Routes>
)

export default AclRoutes
