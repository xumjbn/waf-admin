import { useState, useRef } from 'react'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Modal, Form, Input, Switch, Popconfirm, message, Space } from 'antd'
import { PlusOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
  listAclPolicies,
  createAclPolicy,
  updateAclPolicy,
  deleteAclPolicy,
  updateAclPolicyPriority,
} from '@/api/acl'
import type { AclPolicy } from '@/api/types/acl'

const { TextArea } = Input

const PolicyList = () => {
  const navigate = useNavigate()
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleCreate = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: AclPolicy) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAclPolicy(id)
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
        await updateAclPolicy(editingId, values)
        message.success('更新成功')
      } else {
        await createAclPolicy(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handlePriority = async (id: string, direction: 'up' | 'down') => {
    try {
      await updateAclPolicyPriority(id, direction)
      message.success('优先级调整成功')
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleToggleEnabled = async (record: AclPolicy) => {
    try {
      await updateAclPolicy(record.id, { enabled: !record.enabled })
      message.success(record.enabled ? '已禁用' : '已启用')
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ProColumns<AclPolicy>[] = [
    {
      title: '策略名称',
      dataIndex: 'name',
      render: (_, record) => (
        <a onClick={() => navigate(`/acl/policies/${record.id}`)}>{record.name}</a>
      ),
    },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    {
      title: '启用状态',
      dataIndex: 'enabled',
      render: (_, record) => (
        <Switch
          checked={record.enabled}
          onChange={() => handleToggleEnabled(record)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    { title: '优先级', dataIndex: 'priority', sorter: (a, b) => a.priority - b.priority },
    { title: '规则数', dataIndex: 'rule_count' },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<ArrowUpOutlined />}
            onClick={() => handlePriority(record.id, 'up')}
          >
            上移
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ArrowDownOutlined />}
            onClick={() => handlePriority(record.id, 'down')}
          >
            下移
          </Button>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该策略?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <PageContainer title="访问控制策略">
      <ProTable<AclPolicy>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        request={async () => {
          const res = await listAclPolicies()
          const sorted = [...res.policies].sort((a, b) => a.priority - b.priority)
          return { data: sorted, success: true }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建策略
          </Button>,
        ]}
      />
      <Modal
        title={editingId ? '编辑策略' : '新建策略'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="策略名称"
            rules={[{ required: true, message: '请输入策略名称' }]}
          >
            <Input placeholder="请输入策略名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入策略描述" />
          </Form.Item>
          <Form.Item name="enabled" label="启用状态" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default PolicyList
