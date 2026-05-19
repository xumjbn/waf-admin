import { useState, useRef } from 'react'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Modal, Form, Input, Switch, Popconfirm, message } from 'antd'
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import {
  listBypassConfigs,
  createBypassConfig,
  updateBypassConfig,
  deleteBypassConfig,
} from '@/api/instance'
import type { BypassConfig as BypassConfigType } from '@/api/types/instance'

const BypassConfigPage = () => {
  const { instanceId } = useParams<{ instanceId: string }>()
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

  const handleEdit = (record: BypassConfigType) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteBypassConfig(instanceId!, id)
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
        await updateBypassConfig(instanceId!, editingId, values)
        message.success('更新成功')
      } else {
        await createBypassConfig(instanceId!, values)
        message.success('创建成功')
      }
      setModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleToggle = async (record: BypassConfigType, checked: boolean) => {
    try {
      await updateBypassConfig(instanceId!, record.id, { enabled: checked })
      message.success('更新成功')
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ProColumns<BypassConfigType>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '接口', dataIndex: 'interface' },
    {
      title: '启用状态',
      dataIndex: 'enabled',
      render: (_, record) => (
        <Switch checked={record.enabled} onChange={c => handleToggle(record, c)} />
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <Popconfirm key="delete" title="确定删除该配置？" onConfirm={() => handleDelete(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <PageContainer
      title="旁路配置"
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/instance')}>
          返回
        </Button>
      }
    >
      <ProTable<BypassConfigType>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        request={async () => {
          try {
            const res = await listBypassConfigs(instanceId!)
            return { data: res.bypass_cfg, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建配置
          </Button>,
        ]}
      />

      <Modal
        title={editingId ? '编辑旁路配置' : '创建旁路配置'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ enabled: true }}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item
            name="interface"
            label="接口"
            rules={[{ required: true, message: '请输入接口' }]}
          >
            <Input placeholder="请输入接口" />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default BypassConfigPage
