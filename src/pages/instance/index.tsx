import { Routes, Route, Navigate } from 'react-router-dom'
import InstanceList from './InstanceList'
import InstanceNetwork from './InstanceNetwork'
import BypassConfig from './BypassConfig'
import ClusterProtect from './ClusterProtect'
import HaProtect from './HaProtect'
import AgentList from './AgentList'

const InstanceRoutes = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<InstanceList />} />
    <Route path="agents" element={<AgentList />} />
    <Route path=":id/network" element={<InstanceNetwork />} />
    <Route path=":id/bypass" element={<BypassConfig />} />
    <Route path="cluster" element={<ClusterProtect />} />
    <Route path="ha" element={<HaProtect />} />
  </Routes>
)

export default InstanceRoutes
