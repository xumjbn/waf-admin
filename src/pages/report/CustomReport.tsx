import { useState, useRef } from 'react'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Modal, Form, Input, Select, Popconfirm, message, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import {
  listCustomReports,
  createCustomReport,
  updateCustomReport,
  deleteCustomReport,
} from '@/api/report'
import type { CustomReport } from '@/api/types/report'

const { TextArea } = Input

const CustomReportPage = () => {
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleCreate = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: CustomReport) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomReport(id)
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
        await updateCustomReport(editingId, values)
        message.success('更新成功')
      } else {
        await createCustomReport(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const REPORT_TYPE_MAP: Record<string, string> = {
    attack: '攻击报表',
    flow: '流量报表',
    virus: '病毒报表',
    tamper: '篡改报表',
    operation: '操作报表',
  }

  const TIME_RANGE_MAP: Record<string, string> = {
    hour: '小时',
    day: '天',
    week: '周',
    month: '月',
    custom: '自定义',
  }

  const columns: ProColumns<CustomReport>[] = [
    { title: '报表名称', dataIndex: 'name', ellipsis: true },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    {
      title: '报表类型',
      dataIndex: 'report_type',
      render: (_, record) => (
        <Tag color="blue">{REPORT_TYPE_MAP[record.report_type] ?? record.report_type}</Tag>
      ),
    },
    {
      title: '时间范围',
      dataIndex: 'time_range',
      render: (_, record) => TIME_RANGE_MAP[record.time_range] ?? record.time_range,
    },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime' },
    { title: '更新时间', dataIndex: 'updated_at', valueType: 'dateTime' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <Popconfirm key="delete" title="确定删除该报表？" onConfirm={() => handleDelete(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <PageContainer title="自定义报表">
      <ProTable<CustomReport>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        request={async () => {
          try {
            const res = await listCustomReports()
            return { data: res.reports, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建报表
          </Button>,
        ]}
      />

      <Modal
        title={editingId ? '编辑报表' : '创建报表'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="报表名称"
            rules={[{ required: true, message: '请输入报表名称' }]}
          >
            <Input placeholder="请输入报表名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入报表描述" />
          </Form.Item>
          <Form.Item
            name="report_type"
            label="报表类型"
            rules={[{ required: true, message: '请选择报表类型' }]}
          >
            <Select
              placeholder="请选择报表类型"
              options={[
                { label: '攻击报表', value: 'attack' },
                { label: '流量报表', value: 'flow' },
                { label: '病毒报表', value: 'virus' },
                { label: '篡改报表', value: 'tamper' },
                { label: '操作报表', value: 'operation' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="time_range"
            label="时间范围"
            rules={[{ required: true, message: '请选择时间范围' }]}
          >
            <Select
              placeholder="请选择时间范围"
              options={[
                { label: '小时', value: 'hour' },
                { label: '天', value: 'day' },
                { label: '周', value: 'week' },
                { label: '月', value: 'month' },
                { label: '自定义', value: 'custom' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default CustomReportPage
