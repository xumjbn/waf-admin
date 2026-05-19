import { useState, useRef } from 'react'
import { ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Tag,
  Popconfirm,
  message,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { listCcProtect, createCcProtect, updateCcProtect, deleteCcProtect } from '@/api/site'
import type { CcProtect } from '@/api/types/site'

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

interface CcProtectTableProps {
  siteId: string
}

const CcProtectTable = ({ siteId }: CcProtectTableProps) => {
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const watchAction = Form.useWatch('action', form)

  const handleCreate = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: CcProtect) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCcProtect(siteId, id)
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
        await updateCcProtect(siteId, editingId, values)
        message.success('更新成功')
      } else {
        await createCcProtect(siteId, values)
        message.success('创建成功')
      }
      setModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ProColumns<CcProtect>[] = [
    { title: '名称', dataIndex: 'name', width: 150 },
    { title: 'URL', dataIndex: 'url', width: 200, ellipsis: true },
    {
      title: '频率',
      dataIndex: 'rate',
      width: 120,
      render: (_, record) => `${record.rate} 请求/分钟`,
    },
    {
      title: '解禁时间',
      dataIndex: 'time',
      width: 110,
      render: (_, record) => `${record.time} 分钟`,
    },
    {
      title: '动作',
      dataIndex: 'action',
      width: 100,
      render: (_, record) => {
        const config = ACTION_MAP[record.action]
        return <Tag color={config?.color}>{config?.label || record.action}</Tag>
      },
    },
    { title: 'IP来源', dataIndex: 'ip_src', width: 140 },
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
      width: 120,
      render: (_, record) => [
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确定删除该CC规则？"
          onConfirm={() => handleDelete(record.id)}
        >
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <>
      <ProTable<CcProtect>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        request={async () => {
          try {
            const res = await listCcProtect(siteId)
            return { data: res.cc_protect, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建CC规则
          </Button>,
        ]}
      />

      <Modal
        title={editingId ? '编辑CC规则' : '创建CC规则'}
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
          <Form.Item name="url" label="URL" rules={[{ required: true, message: '请输入URL' }]}>
            <Input placeholder="请输入URL" />
          </Form.Item>
          <Form.Item
            name="rate"
            label="频率（请求/分钟）"
            rules={[{ required: true, message: '请输入频率' }]}
          >
            <InputNumber min={1} max={6000000} style={{ width: '100%' }} placeholder="请输入频率" />
          </Form.Item>
          <Form.Item
            name="time"
            label="解禁时间（分钟）"
            rules={[{ required: true, message: '请输入解禁时间' }]}
          >
            <InputNumber
              min={1}
              max={525600}
              style={{ width: '100%' }}
              placeholder="请输入解禁时间"
            />
          </Form.Item>
          <Form.Item name="action" label="动作" rules={[{ required: true, message: '请选择动作' }]}>
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
          {watchAction === 'redirect' && (
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

export default CcProtectTable
