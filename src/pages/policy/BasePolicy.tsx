import { useEffect, useState } from 'react'
import { Button, Modal, Form, Input, Select, Tag, Popconfirm, message, Grid } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { useNavigate } from 'react-router-dom'
import { listPolicies, createPolicy, updatePolicy, deletePolicy } from '@/api/policy'
import type { Policy } from '@/api/types/policy'

const policyLevelMap = {
  high: { text: '高', color: 'red' },
  medium: { text: '中', color: 'orange' },
  low: { text: '低', color: 'blue' },
}

const engineModeMap = {
  block: { text: '启用', color: 'green' },
  warning: { text: '告警', color: 'orange' },
  disable: { text: '禁用', color: 'default' },
}

const { useBreakpoint } = Grid

const BasePolicy = () => {
  const navigate = useNavigate()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)
  const [form] = Form.useForm()
  const screens = useBreakpoint()
  const isMobile = screens.xs || screens.sm

  const loadPolicies = async () => {
    setLoading(true)
    try {
      const res = await listPolicies()
      setPolicies(res.policies ?? [])
    } catch {
      /* 已由拦截器提示 */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPolicies()
  }, [])

  const handleCreate = () => {
    setEditingPolicy(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Policy) => {
    setEditingPolicy(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deletePolicy(id)
      message.success('删除成功')
      loadPolicies()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingPolicy) {
        await updatePolicy(editingPolicy.id, values)
        message.success('更新成功')
      } else {
        await createPolicy(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadPolicies()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ProColumns<Policy>[] = [
    {
      title: '策略名称',
      dataIndex: 'name',
      render: (_, record) => (
        <a onClick={() => navigate(`/policy/base/${record.id}`)}>{record.name}</a>
      ),
    },
    {
      title: '防护等级',
      dataIndex: 'policy_level',
      render: (_, record) => (
        <Tag color={policyLevelMap[record.policy_level].color}>
          {policyLevelMap[record.policy_level].text}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'engine_mode',
      render: (_, record) => (
        <Tag color={engineModeMap[record.engine_mode].color}>
          {engineModeMap[record.engine_mode].text}
        </Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <a key="history" onClick={() => navigate(`/policy/base/${record.id}/history`)}>
          变更历史
        </a>,
        <Popconfirm key="delete" title="确认删除此策略?" onConfirm={() => handleDelete(record.id)}>
          <a>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <PageContainer title="基础策略">
      <ProTable<Policy>
        columns={columns}
        dataSource={policies}
        loading={loading}
        rowKey="id"
        pagination={{ defaultPageSize: isMobile ? 10 : 20 }}
        search={false}
        scroll={{ x: 'max-content' }}
        toolBarRender={() => [
          <Button key="create" type="primary" onClick={handleCreate}>
            创建策略
          </Button>,
        ]}
      />

      <Modal
        title={editingPolicy ? '编辑策略' : '创建策略'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={isMobile ? '100%' : undefined}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="策略名称"
            rules={[{ required: true, message: '请输入策略名称' }]}
          >
            <Input placeholder="请输入策略名称" />
          </Form.Item>
          <Form.Item
            name="policy_level"
            label="防护等级"
            rules={[{ required: true, message: '请选择防护等级' }]}
          >
            <Select placeholder="请选择防护等级">
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="low">低</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="engine_mode"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Select.Option value="block">启用</Select.Option>
              <Select.Option value="warning">告警</Select.Option>
              <Select.Option value="disable">禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default BasePolicy
