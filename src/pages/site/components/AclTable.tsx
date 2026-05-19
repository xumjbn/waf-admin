import { useState, useRef } from 'react'
import { ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Modal, Form, Input, Select, Switch, Tag, Popconfirm, message } from 'antd'
import { PlusOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import {
  listAclProtect,
  createAclProtect,
  updateAclProtect,
  deleteAclProtect,
  updateAclPriority,
} from '@/api/site'
import type { AclProtect } from '@/api/types/site'

const ACTION_MAP: Record<string, { label: string; color: string }> = {
  deny: { label: '阻断', color: 'red' },
  pass: { label: '检测', color: 'blue' },
  allow: { label: '放行', color: 'green' },
  drop: { label: '丢弃', color: 'orange' },
  redirect: { label: '重定向', color: 'purple' },
}

const IP_SRC_OPTIONS = [
  { label: 'remote_addr', value: 'remote_addr' },
  { label: 'x-forwarded-for', value: 'x_forwarded_for' },
  { label: 'x-real-ip', value: 'x_real_ip' },
]

interface AclTableProps {
  siteId: string
}

const AclTable = ({ siteId }: AclTableProps) => {
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const watchType = Form.useWatch('type', form)

  const handleCreate = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: AclProtect) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAclProtect(siteId, id)
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
        await updateAclProtect(siteId, editingId, values)
        message.success('更新成功')
      } else {
        await createAclProtect(siteId, values)
        message.success('创建成功')
      }
      setModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handlePriorityChange = async (
    id: string,
    direction: 'up' | 'down',
    currentIndex: number,
  ) => {
    try {
      const newPriority = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      await updateAclPriority(siteId, id, newPriority)
      message.success('优先级调整成功')
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ProColumns<AclProtect>[] = [
    { title: '名称', dataIndex: 'name', width: 150 },
    {
      title: '动作',
      dataIndex: 'type',
      width: 100,
      render: (_, record) => {
        const config = ACTION_MAP[record.type]
        return <Tag color={config?.color}>{config?.label || record.type}</Tag>
      },
    },
    { title: 'IP来源', dataIndex: 'ip_src', width: 140 },
    { title: 'IP地址', dataIndex: 'ip_match', width: 160, ellipsis: true },
    { title: 'URL', dataIndex: 'url', width: 200, ellipsis: true },
    {
      title: '日志',
      dataIndex: 'log',
      width: 80,
      render: (_, record) => (
        <Tag color={record.log ? 'blue' : 'default'}>{record.log ? '开启' : '关闭'}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'state',
      width: 80,
      render: (_, record) => (
        <Tag color={record.state ? 'green' : 'default'}>{record.state ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      render: (_, record, index, _action) => [
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <a key="up" onClick={() => handlePriorityChange(record.id, 'up', index)}>
          <ArrowUpOutlined /> 上移
        </a>,
        <a key="down" onClick={() => handlePriorityChange(record.id, 'down', index)}>
          <ArrowDownOutlined /> 下移
        </a>,
        <Popconfirm
          key="delete"
          title="确定删除该ACL规则？"
          onConfirm={() => handleDelete(record.id)}
        >
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <>
      <ProTable<AclProtect>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        request={async () => {
          try {
            const res = await listAclProtect(siteId)
            return { data: res.acl_protect, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建ACL规则
          </Button>,
        ]}
      />

      <Modal
        title={editingId ? '编辑ACL规则' : '创建ACL规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ log: true, state: true }}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item name="type" label="动作" rules={[{ required: true, message: '请选择动作' }]}>
            <Select
              placeholder="请选择动作"
              options={[
                { label: '阻断', value: 'deny' },
                { label: '检测', value: 'pass' },
                { label: '放行', value: 'allow' },
                { label: '丢弃', value: 'drop' },
                { label: '重定向', value: 'redirect' },
              ]}
            />
          </Form.Item>
          {watchType === 'redirect' && (
            <Form.Item
              name="redirect_url"
              label="重定向URL"
              rules={[{ required: true, message: '请输入重定向URL' }]}
            >
              <Input placeholder="请输入重定向URL" />
            </Form.Item>
          )}
          <Form.Item name="ip_src" label="IP来源">
            <Select allowClear placeholder="请选择IP来源" options={IP_SRC_OPTIONS} />
          </Form.Item>
          <Form.Item name="ip_match" label="IP地址">
            <Input placeholder="支持掩码，如 192.168.1.0/24" />
          </Form.Item>
          <Form.Item name="url" label="URL">
            <Input placeholder="请输入URL" />
          </Form.Item>
          <Form.Item name="log" label="日志记录" valuePropName="checked">
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
          <Form.Item name="state" label="启用" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default AclTable
