import { Routes, Route, Navigate } from 'react-router-dom'
import UserList from './UserList'
import RoleList from './RoleList'
import ProjectList from './ProjectList'

const UserRoutes = () => (
  <Routes>
    <Route index element={<Navigate to="users" replace />} />
    <Route path="users" element={<UserList />} />
    <Route path="roles" element={<RoleList />} />
    <Route path="projects" element={<ProjectList />} />
  </Routes>
)

export default UserRoutes
