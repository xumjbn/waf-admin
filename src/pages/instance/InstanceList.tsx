import { useState, useRef } from 'react'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Modal, Form, Input, Select, Tag, Popconfirm, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { listInstances, createInstance, updateInstance, deleteInstance } from '@/api/instance'
import type { Instance } from '@/api/types/instance'

const MODE_MAP: Record<string, { label: string; color: string }> = {
  transparent: { label: '透明模式', color: 'blue' },
  reverse_proxy: { label: '反向代理', color: 'green' },
  offline: { label: '离线模式', color: 'orange' },
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: '运行中', color: 'green' },
  inactive: { label: '未激活', color: 'default' },
  error: { label: '异常', color: 'red' },
}

const InstanceList = () => {
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

  const handleEdit = (record: Instance) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteInstance(id)
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
        await updateInstance(editingId, values)
        message.success('更新成功')
      } else {
        await createInstance(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ProColumns<Instance>[] = [
    {
      title: '实例名称',
      dataIndex: 'name',
      render: (_, record) => (
        <a onClick={() => navigate(`/instance/${record.id}/network`)}>{record.name}</a>
      ),
    },
    {
      title: '模式',
      dataIndex: 'mode',
      render: (_, record) => {
        const m = MODE_MAP[record.mode]
        return <Tag color={m?.color ?? 'default'}>{m?.label ?? record.mode}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (_, record) => {
        const s = STATUS_MAP[record.status]
        return <Tag color={s?.color ?? 'default'}>{s?.label ?? record.status}</Tag>
      },
    },
    { title: 'IP 地址', dataIndex: 'ip' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="network" onClick={() => navigate(`/instance/${record.id}/network`)}>
          网络配置
        </a>,
        <a key="bypass" onClick={() => navigate(`/instance/${record.id}/bypass`)}>
          旁路配置
        </a>,
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <Popconfirm key="delete" title="确定删除该实例？" onConfirm={() => handleDelete(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <PageContainer title="防护实例">
      <ProTable<Instance>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        request={async () => {
          try {
            const res = await listInstances()
            return { data: res.instances, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建实例
          </Button>,
        ]}
      />

      <Modal
        title={editingId ? '编辑实例' : '创建实例'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="实例名称"
            rules={[{ required: true, message: '请输入实例名称' }]}
          >
            <Input placeholder="请输入实例名称" />
          </Form.Item>
          <Form.Item
            name="mode"
            label="工作模式"
            rules={[{ required: true, message: '请选择工作模式' }]}
          >
            <Select
              placeholder="请选择工作模式"
              options={[
                { label: '透明模式', value: 'transparent' },
                { label: '反向代理', value: 'reverse_proxy' },
                { label: '离线模式', value: 'offline' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="ip"
            label="IP 地址"
            rules={[{ required: true, message: '请输入 IP 地址' }]}
          >
            <Input placeholder="请输入 IP 地址" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default InstanceList
