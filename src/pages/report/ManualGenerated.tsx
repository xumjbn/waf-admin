import { useRef } from 'react'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Popconfirm, message, Tag } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { listManualGeneratedReports, deleteManualGeneratedReport } from '@/api/report'
import type { ManualGeneratedReport } from '@/api/types/report'

const ManualGeneratedPage = () => {
  const actionRef = useRef<ActionType>()

  const handleDelete = async (id: string) => {
    try {
      await deleteManualGeneratedReport(id)
      message.success('删除成功')
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleDownload = (record: ManualGeneratedReport) => {
    if (record.status !== 'success') {
      message.warning('报表未生成成功，无法下载')
      return
    }
    message.info(`下载报表: ${record.file_path}`)
  }

  const STATUS_MAP: Record<string, { text: string; color: string }> = {
    success: { text: '成功', color: 'green' },
    failed: { text: '失败', color: 'red' },
    processing: { text: '生成中', color: 'blue' },
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const columns: ProColumns<ManualGeneratedReport>[] = [
    { title: '报表名称', dataIndex: 'report_name', ellipsis: true },
    { title: '报表类型', dataIndex: 'report_type' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (_, record) => {
        const status = STATUS_MAP[record.status] ?? { text: record.status, color: 'default' }
        return <Tag color={status.color}>{status.text}</Tag>
      },
    },
    {
      title: '文件大小',
      dataIndex: 'file_size',
      render: (_, record) => formatFileSize(record.file_size),
    },
    { title: '生成时间', dataIndex: 'generated_at', valueType: 'dateTime' },
    {
      title: '错误信息',
      dataIndex: 'error_message',
      ellipsis: true,
      render: (_, record) => record.error_message || '-',
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <Button
          key="download"
          type="link"
          size="small"
          icon={<DownloadOutlined />}
          disabled={record.status !== 'success'}
          onClick={() => handleDownload(record)}
        >
          下载
        </Button>,
        <Popconfirm key="delete" title="确定删除该报表？" onConfirm={() => handleDelete(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <PageContainer title="手动生成的报表">
      <ProTable<ManualGeneratedReport>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        request={async () => {
          try {
            const res = await listManualGeneratedReports()
            return { data: res.reports, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
      />
    </PageContainer>
  )
}

export default ManualGeneratedPage
