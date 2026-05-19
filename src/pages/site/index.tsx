import { Routes, Route, Navigate } from 'react-router-dom'
import SiteList from './SiteList'
import SiteDetail from './SiteDetail'

const SiteRoutes = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<SiteList />} />
    <Route path=":id" element={<SiteDetail />} />
  </Routes>
)

export default SiteRoutes
