// MSW handlers — 通知模块
import { http, HttpResponse } from 'msw'
import type { Notification } from '../api/types/notification'

const now = Date.now()
const minutesAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString()
const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString()
const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString()

let notifications: Notification[] = [
  {
    id: 'notif-001',
    type: 'error',
    title: '系统检测到攻击',
    content: '来自 203.0.113.45 的 SQL 注入攻击已被拦截',
    read: false,
    created_at: minutesAgo(5),
    link: '/log/attack',
  },
  {
    id: 'notif-002',
    type: 'warning',
    title: 'CPU 使用率告警',
    content: '管理节点 节点 CPU 使用率超过 80%',
    read: false,
    created_at: minutesAgo(30),
    link: '/aggregation/system-monitor',
  },
  {
    id: 'notif-003',
    type: 'info',
    title: '策略已更新',
    content: '基础防护策略 base-policy-01 已更新',
    read: false,
    created_at: hoursAgo(1),
    link: '/policy/base',
  },
  {
    id: 'notif-004',
    type: 'success',
    title: '配置备份完成',
    content: '系统配置已成功备份',
    read: true,
    created_at: hoursAgo(3),
  },
  {
    id: 'notif-005',
    type: 'warning',
    title: '许可证即将到期',
    content: '高级防护许可证将于 30 天后到期',
    read: false,
    created_at: hoursAgo(6),
    link: '/system/license',
  },
  {
    id: 'notif-006',
    type: 'info',
    title: '新站点已添加',
    content: '站点 www.example.com 已添加至防护列表',
    read: true,
    created_at: daysAgo(1),
    link: '/site/list',
  },
  {
    id: 'notif-007',
    type: 'error',
    title: '节点离线',
    content: '实例 节点 inst-002 已离线',
    read: false,
    created_at: daysAgo(2),
    link: '/instance/list',
  },
  {
    id: 'notif-008',
    type: 'success',
    title: '升级完成',
    content: '系统已成功升级至 v2.1.0',
    read: true,
    created_at: daysAgo(5),
  },
]

export const notificationHandlers = [
  // GET /v1/notifications
  http.get('/v1/notifications', () => HttpResponse.json({ notifications })),

  // GET /v1/notifications/unread_count
  http.get('/v1/notifications/unread_count', () =>
    HttpResponse.json({ count: notifications.filter(n => !n.read).length }),
  ),

  // PUT /v1/notifications/:id/read
  http.put('/v1/notifications/:id/read', ({ params }) => {
    const idx = notifications.findIndex(n => n.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '通知不存在' }, { status: 404 })
    const updated = { ...notifications[idx], read: true }
    notifications = [...notifications.slice(0, idx), updated, ...notifications.slice(idx + 1)]
    return HttpResponse.json({ notification: updated })
  }),

  // PUT /v1/notifications/read_all
  http.put('/v1/notifications/read_all', () => {
    notifications = notifications.map(n => ({ ...n, read: true }))
    return HttpResponse.json({ message: 'ok' })
  }),

  // DELETE /v1/notifications/:id
  http.delete('/v1/notifications/:id', ({ params }) => {
    const idx = notifications.findIndex(n => n.id === params.id)
    if (idx === -1) return HttpResponse.json({ error: '通知不存在' }, { status: 404 })
    notifications = [...notifications.slice(0, idx), ...notifications.slice(idx + 1)]
    return new HttpResponse(null, { status: 204 })
  }),
]
