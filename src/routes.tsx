/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'
import { BasicLayout } from '@/layouts/BasicLayout'
import { RequireAuth } from '@/layouts/RequireAuth'
import LoginPage from '@/pages/login'
import NotFound from '@/pages/NotFound'

const PageDashboard = lazy(() => import('@/pages/dashboard'))
const PageMonitor = lazy(() => import('@/pages/monitor'))
const PageSite = lazy(() => import('@/pages/site'))
const PagePolicy = lazy(() => import('@/pages/policy'))
const PageInstance = lazy(() => import('@/pages/instance'))
const PageLog = lazy(() => import('@/pages/log'))
const PageAcl = lazy(() => import('@/pages/acl'))
const PageReport = lazy(() => import('@/pages/report'))
const PageUser = lazy(() => import('@/pages/user'))
const PageSystem = lazy(() => import('@/pages/system'))
const PageSetting = lazy(() => import('@/pages/setting'))

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
      { path: 'site/*', element: <PageSite /> },
      { path: 'policy/*', element: <PagePolicy /> },
      { path: 'instance/*', element: <PageInstance /> },
      { path: 'log/*', element: <PageLog /> },
      { path: 'acl/*', element: <PageAcl /> },
      { path: 'report/*', element: <PageReport /> },
      { path: 'user/*', element: <PageUser /> },
      { path: 'system/*', element: <PageSystem /> },
      { path: 'setting/*', element: <PageSetting /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]
