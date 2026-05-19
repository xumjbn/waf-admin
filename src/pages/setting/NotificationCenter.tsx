import { useRef, useCallback, useState } from 'react'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Popconfirm, message, Tag, Space, Radio } from 'antd'
import {
  InfoCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { listNotifications, markAsRead, markAllAsRead, deleteNotification } from '@/api/notification'
import type { Notification } from '@/api/types/notification'
import dayjs from 'dayjs'

const NotificationCenter = () => {
  const actionRef = useRef<ActionType>()
  const { t } = useTranslation()
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  const handleMarkAsRead = useCallback(
    async (id: string) => {
      try {
        await markAsRead(id)
        message.success(t('message.operationSuccess'))
        actionRef.current?.reload()
      } catch {
        /* 已由拦截器提示 */
      }
    },
    [t],
  )

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead()
      message.success(t('message.operationSuccess'))
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }, [t])

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteNotification(id)
        message.success(t('message.deleteSuccess'))
        actionRef.current?.reload()
      } catch {
        /* 已由拦截器提示 */
      }
    },
    [t],
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

  const columns: ProColumns<Notification>[] = [
    {
      title: t('common.status'),
      dataIndex: 'type',
      width: 60,
      render: (_, record) => getTypeIcon(record.type),
      search: false,
    },
    {
      title: t('common.name'),
      dataIndex: 'title',
      ellipsis: true,
      render: (text, record) => (
        <Space>
          {text}
          {!record.read && <Tag color="blue">{t('notification.unreadCount', { count: 1 })}</Tag>}
        </Space>
      ),
    },
    {
      title: t('common.description'),
      dataIndex: 'content',
      ellipsis: true,
      search: false,
    },
    {
      title: t('common.createdAt'),
      dataIndex: 'created_at',
      width: 180,
      render: (_, record) => dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss'),
      search: false,
    },
    {
      title: t('common.action'),
      valueType: 'option',
      width: 150,
      render: (_, record) => [
        !record.read && (
          <a key="read" onClick={() => handleMarkAsRead(record.id)}>
            {t('notification.markAsRead')}
          </a>
        ),
        <Popconfirm
          key="delete"
          title={t('notification.deleteConfirm')}
          onConfirm={() => handleDelete(record.id)}
        >
          <a style={{ color: '#ff4d4f' }}>{t('common.delete')}</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <PageContainer title={t('menu.notifications')}>
      <ProTable<Notification>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        request={async () => {
          try {
            const res = await listNotifications()
            let data = res.notifications
            if (filter === 'unread') {
              data = data.filter(n => !n.read)
            } else if (filter === 'read') {
              data = data.filter(n => n.read)
            }
            return { data, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
        toolBarRender={() => [
          <Radio.Group
            key="filter"
            value={filter}
            onChange={e => {
              setFilter(e.target.value)
              actionRef.current?.reload()
            }}
          >
            <Radio.Button value="all">{t('notification.filterAll')}</Radio.Button>
            <Radio.Button value="unread">{t('notification.filterUnread')}</Radio.Button>
            <Radio.Button value="read">{t('notification.filterRead')}</Radio.Button>
          </Radio.Group>,
          <Button key="markAll" type="primary" onClick={handleMarkAllAsRead}>
            {t('notification.markAllAsRead')}
          </Button>,
        ]}
      />
    </PageContainer>
  )
}

export default NotificationCenter
