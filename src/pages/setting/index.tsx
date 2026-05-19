import { Routes, Route, Navigate } from 'react-router-dom'
import ChangePassword from './ChangePassword'
import UserPreference from './UserPreference'
import NotificationCenter from './NotificationCenter'

const SettingRoutes = () => (
  <Routes>
    <Route index element={<Navigate to="password" replace />} />
    <Route path="password" element={<ChangePassword />} />
    <Route path="preference" element={<UserPreference />} />
    <Route path="notifications" element={<NotificationCenter />} />
  </Routes>
)

export default SettingRoutes
