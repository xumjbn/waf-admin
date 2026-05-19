import { useState, useRef } from 'react'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Modal, Form, Input, Select, Popconfirm, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import {
  listCombinedReports,
  createCombinedReport,
  updateCombinedReport,
  deleteCombinedReport,
  listCustomReports,
} from '@/api/report'
import type { CombinedReport, CustomReport } from '@/api/types/report'

const { TextArea } = Input

const CombinedReportPage = () => {
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

  const handleEdit = async (record: CombinedReport) => {
    setEditingId(record.id)
    await loadCustomReports()
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCombinedReport(id)
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
        await updateCombinedReport(editingId, values)
        message.success('更新成功')
      } else {
        await createCombinedReport(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const LAYOUT_MAP: Record<string, string> = {
    vertical: '垂直排列',
    horizontal: '水平排列',
    grid: '网格排列',
  }

  const columns: ProColumns<CombinedReport>[] = [
    { title: '报表名称', dataIndex: 'name', ellipsis: true },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    {
      title: '包含报表数',
      dataIndex: 'report_ids',
      render: (_, record) => record.report_ids.length,
    },
    {
      title: '布局',
      dataIndex: 'layout',
      render: (_, record) => LAYOUT_MAP[record.layout] ?? record.layout,
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
        <Popconfirm
          key="delete"
          title="确定删除该合并报表？"
          onConfirm={() => handleDelete(record.id)}
        >
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <PageContainer title="合并报表">
      <ProTable<CombinedReport>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        request={async () => {
          try {
            const res = await listCombinedReports()
            return { data: res.reports, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建合并报表
          </Button>,
        ]}
      />

      <Modal
        title={editingId ? '编辑合并报表' : '创建合并报表'}
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
            <Input placeholder="请输入合并报表名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入报表描述" />
          </Form.Item>
          <Form.Item
            name="report_ids"
            label="选择报表"
            rules={[{ required: true, message: '请选择要合并的报表' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择要合并的报表"
              options={customReports.map(r => ({ label: r.name, value: r.id }))}
            />
          </Form.Item>
          <Form.Item
            name="layout"
            label="布局方式"
            rules={[{ required: true, message: '请选择布局方式' }]}
          >
            <Select
              placeholder="请选择布局方式"
              options={[
                { label: '垂直排列', value: 'vertical' },
                { label: '水平排列', value: 'horizontal' },
                { label: '网格排列', value: 'grid' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default CombinedReportPage
