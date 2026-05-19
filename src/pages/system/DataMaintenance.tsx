import { useState, useEffect, useRef, useCallback } from 'react'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import {
  Button,
  Form,
  InputNumber,
  Switch,
  Card,
  Modal,
  DatePicker,
  Popconfirm,
  Space,
  message,
} from 'antd'
import { DownloadOutlined, DeleteOutlined } from '@ant-design/icons'
import { getAttackLogBackupTiming, updateAttackLogBackupTiming } from '@/api/system'
import type { AttackLogBackupTiming } from '@/api/types/system'

interface BackupFile {
  filename: string
  size: number
  created_at: string
}

const DataMaintenance = () => {
  const actionRef = useRef<ActionType>()
  const [timingForm] = Form.useForm()
  const [timingLoading, setTimingLoading] = useState(false)
  const [backupModalVisible, setBackupModalVisible] = useState(false)

  const loadTiming = useCallback(async () => {
    setTimingLoading(true)
    try {
      const data = await getAttackLogBackupTiming()
      timingForm.setFieldsValue(data)
    } catch {
      /* 已由拦截器提示 */
    } finally {
      setTimingLoading(false)
    }
  }, [timingForm])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTiming()
  }, [loadTiming])

  const handleSaveTiming = async () => {
    try {
      const values = await timingForm.validateFields()
      await updateAttackLogBackupTiming(values as AttackLogBackupTiming)
      message.success('保存成功')
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleManualBackup = async () => {
    // TODO: 实现实际的手动备份 API 调用
    message.success('备份任务已提交')
    setBackupModalVisible(false)
    actionRef.current?.reload()
  }

  const handleDownload = (record: BackupFile) => {
    window.open(`/api/v1/data_maintenance/backup/${record.filename}`)
  }

  const handleDelete = async (record: BackupFile) => {
    try {
      // TODO: 实现实际的删除备份文件 API 调用
      message.success(`已删除 ${record.filename}`)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }
  const columns: ProColumns<BackupFile>[] = [
    { title: '文件名', dataIndex: 'filename', ellipsis: true },
    {
      title: '大小',
      dataIndex: 'size',
      render: (_, r) => `${(r.size / 1024 / 1024).toFixed(2)} MB`,
    },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="download" onClick={() => handleDownload(record)}>
          <DownloadOutlined /> 下载
        </a>,
        <Popconfirm key="delete" title="确定删除该备份？" onConfirm={() => handleDelete(record)}>
          <a style={{ color: '#ff4d4f' }}>
            <DeleteOutlined /> 删除
          </a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <PageContainer title="数据维护">
      <Card title="攻击日志备份定时器" loading={timingLoading} style={{ marginBottom: 16 }}>
        <Form form={timingForm} layout="inline">
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="schedule" label="调度规则">
            <InputNumber placeholder="cron 表达式" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="retention_days" label="保留天数">
            <InputNumber min={1} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSaveTiming}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <ProTable<BackupFile>
        columns={columns}
        actionRef={actionRef}
        rowKey="filename"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        request={async () => ({ data: [], success: true })}
        toolBarRender={() => [
          <Button key="backup" type="primary" onClick={() => setBackupModalVisible(true)}>
            手动备份
          </Button>,
        ]}
      />

      <Modal
        title="手动备份"
        open={backupModalVisible}
        onOk={handleManualBackup}
        onCancel={() => setBackupModalVisible(false)}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            placeholder={['开始时间', '结束时间']}
          />
        </Space>
      </Modal>
    </PageContainer>
  )
}

export default DataMaintenance
