import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../request', () => ({
  requestV1: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}))

import * as api from '../notification'
import { requestV1 } from '../request'

const mockGet = requestV1.get as ReturnType<typeof vi.fn>
const mockPut = requestV1.put as ReturnType<typeof vi.fn>
const mockDelete = requestV1.delete as ReturnType<typeof vi.fn>

describe('notification API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('listNotifications → GET /notifications', async () => {
    await api.listNotifications()
    expect(mockGet).toHaveBeenCalledWith('/notifications')
  })

  it('getUnreadCount → GET /notifications/unread_count', async () => {
    await api.getUnreadCount()
    expect(mockGet).toHaveBeenCalledWith('/notifications/unread_count')
  })

  it('markAsRead → PUT /notifications/{id}/read', async () => {
    await api.markAsRead('notification-1')
    expect(mockPut).toHaveBeenCalledWith('/notifications/notification-1/read')
  })

  it('markAllAsRead → PUT /notifications/read_all', async () => {
    await api.markAllAsRead()
    expect(mockPut).toHaveBeenCalledWith('/notifications/read_all')
  })

  it('deleteNotification → DELETE /notifications/{id}', async () => {
    await api.deleteNotification('notification-1')
    expect(mockDelete).toHaveBeenCalledWith('/notifications/notification-1')
  })
})
