import { useRef, useState } from 'react'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Tag, Popconfirm, Upload, message } from 'antd'
import {
  ExportOutlined,
  DeleteOutlined,
  CloudDownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {
  listOperationLogs,
  exportOperationLogs,
  backupOperationLogs,
  importOperationLogsBackup,
  clearOperationLogs,
} from '@/api/log'
import type { OperationLog as OperationLogType } from '@/api/types/log'
import { downloadBlob } from '@/utils/download'

const resultMap: Record<string, { text: string; color: string }> = {
  success: { text: '成功', color: 'green' },
  failure: { text: '失败', color: 'red' },
}

const OperationLog = () => {
  const actionRef = useRef<ActionType>()
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await exportOperationLogs()
      downloadBlob(blob, `operation_logs_${Date.now()}.csv`)
      message.success('导出成功')
    } catch {
      /* 已由拦截器提示 */
    } finally {
      setExporting(false)
    }
  }

  const handleBackup = async () => {
    try {
      const blob = await backupOperationLogs()
      downloadBlob(blob, `operation_logs_backup_${Date.now()}.bak`)
      message.success('备份成功')
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleImportBackup = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      await importOperationLogsBackup(formData)
      message.success('导入备份成功')
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleClear = async () => {
    try {
      await clearOperationLogs()
      message.success('清空成功')
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ProColumns<OperationLogType>[] = [
    { title: '时间', dataIndex: 'datetime', width: 180 },
    { title: '用户', dataIndex: 'user_name', width: 120 },
    { title: '操作', dataIndex: 'operation', width: 140 },
    { title: '资源', dataIndex: 'resource', ellipsis: true },
    {
      title: '结果',
      dataIndex: 'result',
      width: 80,
      render: (_, record) => {
        const config = resultMap[record.result] ?? { text: record.result, color: 'default' }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    { title: '详情', dataIndex: 'detail', ellipsis: true },
  ]

  return (
    <PageContainer>
      <ProTable<OperationLogType>
        columns={columns}
        actionRef={actionRef}
        request={async params => {
          const res = await listOperationLogs(params)
          return { data: res.operation_logs ?? [], success: true }
        }}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        toolBarRender={() => [
          <Button key="export" icon={<ExportOutlined />} loading={exporting} onClick={handleExport}>
            导出
          </Button>,
          <Button key="backup" icon={<CloudDownloadOutlined />} onClick={handleBackup}>
            备份
          </Button>,
          <Upload
            key="import"
            showUploadList={false}
            beforeUpload={file => {
              const isValidType =
                file.name.endsWith('.bak') || file.type === 'application/octet-stream'
              const isValidSize = file.size / 1024 / 1024 < 100
              if (!isValidType) {
                message.error('只支持 .bak 格式的备份文件')
                return Upload.LIST_IGNORE
              }
              if (!isValidSize) {
                message.error('文件大小不能超过 100MB')
                return Upload.LIST_IGNORE
              }
              handleImportBackup(file)
              return false
            }}
          >
            <Button icon={<UploadOutlined />}>导入备份</Button>
          </Upload>,
          <Popconfirm key="clear" title="确定清空所有操作日志吗？" onConfirm={handleClear}>
            <Button icon={<DeleteOutlined />} danger>
              清空
            </Button>
          </Popconfirm>,
        ]}
      />
    </PageContainer>
  )
}

export default OperationLog
