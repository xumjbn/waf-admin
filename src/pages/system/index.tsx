import { Routes, Route, Navigate } from 'react-router-dom'
import SystemSettings from './SystemSettings'
import DataMaintenance from './DataMaintenance'
import SecurityManagement from './SecurityManagement'
import LicenseManagement from './LicenseManagement'
import SystemUpgrade from './SystemUpgrade'
import PolicyUpgrade from './PolicyUpgrade'
import MonitorWarning from './MonitorWarning'
import InstancePools from './InstancePools'
import ServiceWarning from './ServiceWarning'

const SystemRoutes = () => (
  <Routes>
    <Route index element={<Navigate to="settings" replace />} />
    <Route path="settings" element={<SystemSettings />} />
    <Route path="data" element={<DataMaintenance />} />
    <Route path="security" element={<SecurityManagement />} />
    <Route path="license" element={<LicenseManagement />} />
    <Route path="upgrade" element={<SystemUpgrade />} />
    <Route path="policy-upgrade" element={<PolicyUpgrade />} />
    <Route path="monitor-warning" element={<MonitorWarning />} />
    <Route path="instance-pools" element={<InstancePools />} />
    <Route path="service-warning" element={<ServiceWarning />} />
  </Routes>
)

export default SystemRoutes
