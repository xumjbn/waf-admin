import { useRef } from 'react'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Tag, Progress, Drawer, Descriptions, Badge } from 'antd'
import { useState } from 'react'
import { listAgents } from '@/api/instance'
import type { AgentInstance } from '@/api/types/instance'

const STATUS_MAP: Record<string, { color: string; text: string }> = {
  HEALTHY: { color: 'green', text: '健康' },
  DEGRADED: { color: 'orange', text: '降级' },
  ERROR: { color: 'red', text: '故障' },
  UNKNOWN: { color: 'default', text: '未知' },
}

const AgentList = () => {
  const actionRef = useRef<ActionType>()
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentInstance, setCurrentInstance] = useState<AgentInstance | null>(null)

  const showDetail = (record: AgentInstance) => {
    setCurrentInstance(record)
    setDetailVisible(true)
  }

  const columns: ProColumns<AgentInstance>[] = [
    {
      title: '主机名',
      dataIndex: 'hostname',
      fixed: 'left',
      width: 150,
      render: (_, record) => (
        <a
          onClick={() => showDetail(record)}
          role="link"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter') showDetail(record)
          }}
        >
          {record.hostname}
        </a>
      ),
    },
    { title: 'IP 地址', dataIndex: 'ip', width: 140 },
    { title: '版本', dataIndex: 'version', width: 100 },
    {
      title: '健康状态',
      dataIndex: 'status',
      width: 100,
      render: (_, record) => {
        const s = STATUS_MAP[record.status] || { color: 'default', text: record.status }
        return (
          <Badge status={s.color as 'success' | 'warning' | 'error' | 'default'} text={s.text} />
        )
      },
    },
    {
      title: 'CPU',
      dataIndex: 'cpu_percent',
      width: 120,
      render: (_, record) => <Progress percent={Math.round(record.cpu_percent)} size="small" />,
    },
    {
      title: '内存',
      dataIndex: 'memory_percent',
      width: 120,
      render: (_, record) => <Progress percent={Math.round(record.memory_percent)} size="small" />,
    },
    {
      title: '磁盘',
      dataIndex: 'disk_percent',
      width: 120,
      render: (_, record) => <Progress percent={Math.round(record.disk_percent)} size="small" />,
    },
    {
      title: '最后心跳',
      dataIndex: 'last_seen',
      valueType: 'dateTime',
      width: 180,
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="detail"
          onClick={() => showDetail(record)}
          role="button"
          tabIndex={0}
          aria-label={`查看实例 ${record.hostname} 详情`}
        >
          详情
        </a>,
      ],
    },
  ]

  return (
    <PageContainer title="在线实例">
      <ProTable<AgentInstance>
        columns={columns}
        actionRef={actionRef}
        rowKey="node_id"
        search={false}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 'max-content' }}
        request={async () => {
          try {
            const res = await listAgents()
            return { data: res.instances, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
        toolBarRender={() => [
          <span key="hint" style={{ color: '#888', fontSize: 13 }}>
            显示所有已连接 waf-agent 实例
          </span>,
        ]}
      />

      <Drawer
        title="实例详情"
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        width={480}
      >
        {currentInstance && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="主机名">{currentInstance.hostname}</Descriptions.Item>
            <Descriptions.Item label="Node ID">{currentInstance.node_id}</Descriptions.Item>
            <Descriptions.Item label="IP 地址">{currentInstance.ip}</Descriptions.Item>
            <Descriptions.Item label="版本">{currentInstance.version}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={STATUS_MAP[currentInstance.status]?.color || 'default'}>
                {STATUS_MAP[currentInstance.status]?.text || currentInstance.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="CPU 使用率">
              {currentInstance.cpu_percent.toFixed(1)}%
            </Descriptions.Item>
            <Descriptions.Item label="内存使用率">
              {currentInstance.memory_percent.toFixed(1)}%
            </Descriptions.Item>
            <Descriptions.Item label="磁盘使用率">
              {currentInstance.disk_percent.toFixed(1)}%
            </Descriptions.Item>
            <Descriptions.Item label="最后心跳">{currentInstance.last_seen}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </PageContainer>
  )
}

export default AgentList
