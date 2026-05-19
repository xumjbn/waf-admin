import { Routes, Route, Navigate } from 'react-router-dom'
import BasePolicy from './BasePolicy'
import BasePolicyDetail from './BasePolicyDetail'
import CustomRulePage from './CustomRulePage'
import CustomRuleDetail from './CustomRuleDetail'

const PolicyRoutes = () => (
  <Routes>
    <Route index element={<Navigate to="base" replace />} />
    <Route path="base" element={<BasePolicy />} />
    <Route path="base/:id" element={<BasePolicyDetail />} />
    <Route path="custom-rule" element={<CustomRulePage />} />
    <Route path="custom-rule/:id" element={<CustomRuleDetail />} />
  </Routes>
)

export default PolicyRoutes
