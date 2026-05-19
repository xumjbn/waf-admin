import { useState, useRef } from 'react'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Modal, Form, Input, Select, Switch, Popconfirm, message, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import {
  listTimingTasks,
  createTimingTask,
  updateTimingTask,
  deleteTimingTask,
  listCustomReports,
} from '@/api/report'
import type { TimingTask, CustomReport } from '@/api/types/report'

const TimingTaskPage = () => {
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [customReports, setCustomReports] = useState<CustomReport[]>([])

  const loadCustomReports = async () => {
    try {
      const res = await listCustomReports()
      setCustomReports(res.reports)
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleCreate = async () => {
    setEditingId(null)
    form.resetFields()
    await loadCustomReports()
    setModalVisible(true)
  }

  const handleEdit = async (record: TimingTask) => {
    setEditingId(record.id)
    await loadCustomReports()
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTimingTask(id)
      message.success('删除成功')
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingId) {
        await updateTimingTask(editingId, values)
        message.success('更新成功')
      } else {
        await createTimingTask(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ProColumns<TimingTask>[] = [
    { title: '任务名称', dataIndex: 'name', ellipsis: true },
    { title: '报表名称', dataIndex: 'report_name', ellipsis: true },
    { title: 'Cron 表达式', dataIndex: 'schedule', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'enabled',
      render: (_, record) => (
        <Tag color={record.enabled ? 'green' : 'default'}>{record.enabled ? '启用' : '禁用'}</Tag>
      ),
    },
    { title: '上次运行', dataIndex: 'last_run', valueType: 'dateTime' },
    { title: '下次运行', dataIndex: 'next_run', valueType: 'dateTime' },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确定删除该定时任务？"
          onConfirm={() => handleDelete(record.id)}
        >
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <PageContainer title="定时任务">
      <ProTable<TimingTask>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        request={async () => {
          try {
            const res = await listTimingTasks()
            return { data: res.tasks, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建定时任务
          </Button>,
        ]}
      />

      <Modal
        title={editingId ? '编辑定时任务' : '创建定时任务'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ enabled: true }}>
          <Form.Item
            name="name"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="请输入定时任务名称" />
          </Form.Item>
          <Form.Item
            name="report_id"
            label="关联报表"
            rules={[{ required: true, message: '请选择关联报表' }]}
          >
            <Select
              placeholder="请选择要定时生成的报表"
              options={customReports.map(r => ({ label: r.name, value: r.id }))}
            />
          </Form.Item>
          <Form.Item
            name="schedule"
            label="Cron 表达式"
            rules={[{ required: true, message: '请输入 Cron 表达式' }]}
            extra="例如: 0 8 * * * (每天早上8点)"
          >
            <Input placeholder="请输入 Cron 表达式" />
          </Form.Item>
          <Form.Item name="enabled" label="启用任务" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default TimingTaskPage
