/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'
import { BasicLayout } from '@/layouts/BasicLayout'
import { RequireAuth } from '@/layouts/RequireAuth'
import { ComingSoon } from '@/components/ComingSoon'
import LoginPage from '@/pages/login'
import NotFound from '@/pages/NotFound'

const PageDashboard = lazy(() => import('@/pages/dashboard'))
const PageMonitor = lazy(() => import('@/pages/monitor'))

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <BasicLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/aggregation" replace /> },
      { path: 'aggregation', element: <PageDashboard /> },
      { path: 'aggregation/monitor', element: <PageMonitor /> },
      { path: 'aggregation/*', element: <Navigate to="/aggregation" replace /> },
      {
        path: 'site/*',
        element: <ComingSoon title="站点 / 拓扑" ico="sites" ord="NW · 03" />,
      },
      {
        path: 'policy/*',
        element: <ComingSoon title="防护配置" ico="shield" ord="NW · 04" />,
      },
      {
        path: 'instance/*',
        element: <ComingSoon title="防护实例" ico="server" ord="NW · 05" />,
      },
      {
        path: 'log/*',
        element: <ComingSoon title="攻击日志" ico="logs" ord="NW · 06" />,
      },
      {
        path: 'acl/*',
        element: <ComingSoon title="告警中心" ico="alert" ord="NW · 07" />,
      },
      {
        path: 'report/*',
        element: <ComingSoon title="报表中心" ico="reports" ord="NW · 08" />,
      },
      {
        path: 'user/*',
        element: <ComingSoon title="用户 / 权限" ico="users" ord="NW · 09" />,
      },
      {
        path: 'system/*',
        element: <ComingSoon title="系统管理" ico="settings" ord="NW · 10" />,
      },
      {
        path: 'setting/*',
        element: <ComingSoon title="个人设置" ico="sliders" ord="NW · 11" />,
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]
