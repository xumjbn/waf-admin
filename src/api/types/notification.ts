// 通知模块类型定义

export interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  content: string
  read: boolean
  created_at: string
  link?: string
}

export interface UnreadCount {
  count: number
}
