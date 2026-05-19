import { useState, useEffect, useCallback } from 'react'
import { Badge, Dropdown, Button, List, Typography, Space, Empty } from 'antd'
import {
  BellOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listNotifications, getUnreadCount, markAllAsRead } from '@/api/notification'
import type { Notification } from '@/api/types/notification'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)

const { Text } = Typography

const NotificationBell = () => {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount()
      setUnreadCount(res.count)
    } catch {
      /* 已由拦截器提示 */
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    try {
      const res = await listNotifications()
      setNotifications(res.notifications.slice(0, 5))
    } catch {
      /* 已由拦截器提示 */
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [loadUnreadCount])

  const handleDropdownOpenChange = useCallback(
    (open: boolean) => {
      setDropdownOpen(open)
      if (open) {
        loadNotifications()
      }
    },
    [loadNotifications],
  )

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead()
      setUnreadCount(0)
      loadNotifications()
    } catch {
      /* 已由拦截器提示 */
    }
  }, [loadNotifications])

  const handleViewAll = useCallback(() => {
    setDropdownOpen(false)
    navigate('/setting/notifications')
  }, [navigate])

  const handleOpenNotification = useCallback(
    (item: Notification) => {
      if (!item.link) {
        return
      }
      setDropdownOpen(false)
      navigate(item.link)
    },
    [navigate],
  )

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      default:
        return <InfoCircleOutlined />
    }
  }

  const formatTime = (time: string) => {
    const locale = i18n.language === 'zh-CN' ? 'zh-cn' : 'en'
    return dayjs(time).locale(locale).fromNow()
  }

  const dropdownContent = (
    <div style={{ width: 360, maxHeight: 480, overflow: 'auto' }}>
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text strong>{t('notification.title')}</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllAsRead}>
            {t('notification.markAllAsRead')}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('notification.noNotifications')}
          style={{ padding: '40px 0' }}
        />
      ) : (
        <List
          dataSource={notifications}
          renderItem={item => (
            <List.Item
              style={{
                padding: '12px 16px',
                cursor: item.link ? 'pointer' : 'default',
                backgroundColor: item.read ? 'transparent' : '#f0f7ff',
              }}
              role={item.link ? 'button' : undefined}
              tabIndex={item.link ? 0 : undefined}
              onClick={() => handleOpenNotification(item)}
              onKeyDown={event => {
                if (!item.link) {
                  return
                }
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handleOpenNotification(item)
                }
              }}
            >
              <Space align="start" style={{ width: '100%' }}>
                {getTypeIcon(item.type)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong style={{ display: 'block' }}>
                    {item.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    {item.content}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatTime(item.created_at)}
                  </Text>
                </div>
              </Space>
            </List.Item>
          )}
        />
      )}

      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #f0f0f0',
          textAlign: 'center',
        }}
      >
        <Button type="link" onClick={handleViewAll}>
          {t('notification.viewAll')}
        </Button>
      </div>
    </div>
  )

  return (
    <Dropdown
      open={dropdownOpen}
      onOpenChange={handleDropdownOpenChange}
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      placement="bottomRight"
    >
      <Badge count={unreadCount} offset={[-5, 5]}>
        <Button
          type="text"
          icon={<BellOutlined />}
          aria-label={t('notification.title')}
        />
      </Badge>
    </Dropdown>
  )
}

export default NotificationBell
