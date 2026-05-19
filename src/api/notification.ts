// 通知模块 API
import { requestV1 } from './request'
import type { Notification, UnreadCount } from './types/notification'

// GET /v1/notifications
export const listNotifications = () =>
  requestV1.get<never, { notifications: Notification[] }>('/notifications')

// GET /v1/notifications/unread_count
export const getUnreadCount = () =>
  requestV1.get<never, UnreadCount>('/notifications/unread_count')

// PUT /v1/notifications/{id}/read
export const markAsRead = (id: string) =>
  requestV1.put<never, { notification: Notification }>(`/notifications/${id}/read`)

// PUT /v1/notifications/read_all
export const markAllAsRead = () => requestV1.put<never, { message: string }>('/notifications/read_all')

// DELETE /v1/notifications/{id}
export const deleteNotification = (id: string) => requestV1.delete(`/notifications/${id}`)
