import { useState, useRef } from 'react'
import { ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Modal, Form, Input, Select, Switch, Tag, Popconfirm, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import {
  listCsrfProtect,
  createCsrfProtect,
  updateCsrfProtect,
  deleteCsrfProtect,
} from '@/api/site'
import type { CsrfProtect } from '@/api/types/site'

interface CsrfProtectProps {
  siteId: string
}

const CsrfProtectPanel = ({ siteId }: CsrfProtectProps) => {
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const action = Form.useWatch('action', form)

  const handleCreate = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: CsrfProtect) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCsrfProtect(siteId, id)
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
        await updateCsrfProtect(siteId, editingId, values)
        message.success('更新成功')
      } else {
        await createCsrfProtect(siteId, values)
        message.success('创建成功')
      }
      setModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const ACTION_MAP: Record<string, { label: string; color: string }> = {
    deny: { label: '阻断', color: 'red' },
    pass: { label: '放行', color: 'green' },
    allow: { label: '允许', color: 'blue' },
    drop: { label: '丢弃', color: 'orange' },
    redirect: { label: '重定向', color: 'purple' },
  }

  const columns: ProColumns<CsrfProtect>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: 'URL', dataIndex: 'url', ellipsis: true },
    {
      title: '动作',
      dataIndex: 'action',
      render: (_, record) => {
        const item = ACTION_MAP[record.action]
        return <Tag color={item?.color}>{item?.label ?? record.action}</Tag>
      },
    },
    {
      title: '日志',
      dataIndex: 'log',
      render: (_, record) => (
        <Tag color={record.log ? 'blue' : 'default'}>{record.log ? '开启' : '关闭'}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'state',
      render: (_, record) => (
        <Tag color={record.state ? 'green' : 'default'}>{record.state ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <Popconfirm key="delete" title="确定删除该规则？" onConfirm={() => handleDelete(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <>
      <ProTable<CsrfProtect>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        request={async () => {
          try {
            const res = await listCsrfProtect(siteId)
            return { data: res.csrf_protect, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增规则
          </Button>,
        ]}
      />

      <Modal
        title={editingId ? '编辑CSRF防护规则' : '新增CSRF防护规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={560}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ log: true, state: true, action: 'deny' }}
        >
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item name="url" label="URL" rules={[{ required: true, message: '请输入URL' }]}>
            <Input placeholder="请输入URL" />
          </Form.Item>
          <Form.Item name="action" label="动作">
            <Select
              options={[
                { label: '阻断', value: 'deny' },
                { label: '放行', value: 'pass' },
                { label: '允许', value: 'allow' },
                { label: '丢弃', value: 'drop' },
                { label: '重定向', value: 'redirect' },
              ]}
            />
          </Form.Item>
          {action === 'redirect' && (
            <Form.Item name="redirect_url" label="重定向URL">
              <Input placeholder="请输入重定向URL" />
            </Form.Item>
          )}
          <Form.Item name="log" label="日志" valuePropName="checked">
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
          <Form.Item name="state" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default CsrfProtectPanel
