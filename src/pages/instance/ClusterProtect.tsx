import { useState, useRef } from 'react'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Modal, Form, Input, Select, Tabs, Popconfirm, message, InputNumber } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import {
  listLbVips,
  createLbVip,
  updateLbVip,
  deleteLbVip,
  listLbPools,
  createLbPool,
  updateLbPool,
  deleteLbPool,
  listLbMembers,
  createLbMember,
  updateLbMember,
  deleteLbMember,
  listLbHealthMonitors,
  createLbHealthMonitor,
  updateLbHealthMonitor,
  deleteLbHealthMonitor,
} from '@/api/instance'
import type { LbVip, LbPool, LbMemberEntry, LbHealthMonitor } from '@/api/types/instance'

const ClusterProtect = () => {
  const [activeTab, setActiveTab] = useState('vip')
  const vipActionRef = useRef<ActionType>()
  const poolActionRef = useRef<ActionType>()
  const memberActionRef = useRef<ActionType>()
  const monitorActionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleCreate = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: LbVip | LbPool | LbMemberEntry | LbHealthMonitor) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      if (activeTab === 'vip') {
        await deleteLbVip(id)
      } else if (activeTab === 'pool') {
        await deleteLbPool(id)
      } else if (activeTab === 'member') {
        await deleteLbMember(id)
      } else {
        await deleteLbHealthMonitor(id)
      }
      message.success('删除成功')
      getActionRef()?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (activeTab === 'vip') {
        if (editingId) await updateLbVip(editingId, values)
        else await createLbVip(values)
      } else if (activeTab === 'pool') {
        if (editingId) await updateLbPool(editingId, values)
        else await createLbPool(values)
      } else if (activeTab === 'member') {
        if (editingId) await updateLbMember(editingId, values)
        else await createLbMember(values)
      } else {
        if (editingId) await updateLbHealthMonitor(editingId, values)
        else await createLbHealthMonitor(values)
      }
      message.success(editingId ? '更新成功' : '创建成功')
      setModalVisible(false)
      getActionRef()?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const getActionRef = () => {
    const map: Record<string, React.RefObject<ActionType | undefined>> = {
      vip: vipActionRef,
      pool: poolActionRef,
      member: memberActionRef,
      monitor: monitorActionRef,
    }
    return map[activeTab]?.current
  }

  const TAB_LABELS: Record<string, string> = {
    vip: 'VIP',
    pool: 'Pool',
    member: 'Member',
    monitor: 'Health Monitor',
  }

  const vipColumns: ProColumns<LbVip>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: 'IP 地址', dataIndex: 'address' },
    { title: '端口', dataIndex: 'port' },
    { title: '协议', dataIndex: 'protocol' },
    { title: 'Pool ID', dataIndex: 'pool_id' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, r) => [
        <a key="edit" onClick={() => handleEdit(r)}>
          编辑
        </a>,
        <Popconfirm key="del" title="确定删除？" onConfirm={() => handleDelete(r.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  const poolColumns: ProColumns<LbPool>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '算法', dataIndex: 'lb_method' },
    { title: '协议', dataIndex: 'protocol' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, r) => [
        <a key="edit" onClick={() => handleEdit(r)}>
          编辑
        </a>,
        <Popconfirm key="del" title="确定删除？" onConfirm={() => handleDelete(r.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  const memberColumns: ProColumns<LbMemberEntry>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '地址', dataIndex: 'address' },
    { title: '端口', dataIndex: 'port' },
    { title: '权重', dataIndex: 'weight' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, r) => [
        <a key="edit" onClick={() => handleEdit(r)}>
          编辑
        </a>,
        <Popconfirm key="del" title="确定删除？" onConfirm={() => handleDelete(r.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  const monitorColumns: ProColumns<LbHealthMonitor>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type' },
    { title: '延迟(s)', dataIndex: 'delay' },
    { title: '超时(s)', dataIndex: 'timeout' },
    { title: '最大重试', dataIndex: 'max_retries' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, r) => [
        <a key="edit" onClick={() => handleEdit(r)}>
          编辑
        </a>,
        <Popconfirm key="del" title="确定删除？" onConfirm={() => handleDelete(r.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  const renderVipForm = () => (
    <>
      <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
        <Input placeholder="请输入名称" />
      </Form.Item>
      <Form.Item
        name="address"
        label="IP 地址"
        rules={[{ required: true, message: '请输入 IP 地址' }]}
      >
        <Input placeholder="请输入 IP 地址" />
      </Form.Item>
      <Form.Item name="port" label="端口" rules={[{ required: true, message: '请输入端口' }]}>
        <InputNumber min={1} max={65535} style={{ width: '100%' }} placeholder="请输入端口" />
      </Form.Item>
      <Form.Item name="protocol" label="协议" rules={[{ required: true, message: '请选择协议' }]}>
        <Select
          placeholder="请选择协议"
          options={[
            { label: 'TCP', value: 'TCP' },
            { label: 'HTTP', value: 'HTTP' },
            { label: 'HTTPS', value: 'HTTPS' },
          ]}
        />
      </Form.Item>
      <Form.Item name="pool_id" label="Pool ID">
        <Input placeholder="请输入 Pool ID" />
      </Form.Item>
    </>
  )

  const renderPoolForm = () => (
    <>
      <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
        <Input placeholder="请输入名称" />
      </Form.Item>
      <Form.Item name="lb_method" label="算法" rules={[{ required: true, message: '请选择算法' }]}>
        <Select
          placeholder="请选择算法"
          options={[
            { label: '轮询', value: 'ROUND_ROBIN' },
            { label: '最少连接', value: 'LEAST_CONNECTIONS' },
            { label: '源 IP', value: 'SOURCE_IP' },
          ]}
        />
      </Form.Item>
      <Form.Item name="protocol" label="协议" rules={[{ required: true, message: '请选择协议' }]}>
        <Select
          placeholder="请选择协议"
          options={[
            { label: 'TCP', value: 'TCP' },
            { label: 'HTTP', value: 'HTTP' },
            { label: 'HTTPS', value: 'HTTPS' },
          ]}
        />
      </Form.Item>
    </>
  )

  const renderMemberForm = () => (
    <>
      <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
        <Input placeholder="请输入名称" />
      </Form.Item>
      <Form.Item name="address" label="地址" rules={[{ required: true, message: '请输入地址' }]}>
        <Input placeholder="请输入地址" />
      </Form.Item>
      <Form.Item name="port" label="端口" rules={[{ required: true, message: '请输入端口' }]}>
        <InputNumber min={1} max={65535} style={{ width: '100%' }} placeholder="请输入端口" />
      </Form.Item>
      <Form.Item name="weight" label="权重" rules={[{ required: true, message: '请输入权重' }]}>
        <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="请输入权重" />
      </Form.Item>
    </>
  )

  const renderMonitorForm = () => (
    <>
      <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
        <Input placeholder="请输入名称" />
      </Form.Item>
      <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
        <Select
          placeholder="请选择类型"
          options={[
            { label: 'HTTP', value: 'HTTP' },
            { label: 'HTTPS', value: 'HTTPS' },
            { label: 'TCP', value: 'TCP' },
            { label: 'PING', value: 'PING' },
          ]}
        />
      </Form.Item>
      <Form.Item name="delay" label="延迟(s)" rules={[{ required: true, message: '请输入延迟' }]}>
        <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入延迟" />
      </Form.Item>
      <Form.Item name="timeout" label="超时(s)" rules={[{ required: true, message: '请输入超时' }]}>
        <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入超时" />
      </Form.Item>
      <Form.Item
        name="max_retries"
        label="最大重试"
        rules={[{ required: true, message: '请输入最大重试次数' }]}
      >
        <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="请输入最大重试次数" />
      </Form.Item>
    </>
  )

  const FORM_MAP: Record<string, () => React.ReactNode> = {
    vip: renderVipForm,
    pool: renderPoolForm,
    member: renderMemberForm,
    monitor: renderMonitorForm,
  }

  const tabItems = [
    {
      key: 'vip',
      label: 'VIP',
      children: (
        <ProTable<LbVip>
          columns={vipColumns}
          actionRef={vipActionRef}
          rowKey="id"
          pagination={{ defaultPageSize: 20 }}
          search={false}
          request={async () => {
            try {
              const res = await listLbVips()
              return { data: res.vips, success: true }
            } catch {
              return { data: [], success: false }
            }
          }}
          toolBarRender={() => [
            <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              创建 VIP
            </Button>,
          ]}
        />
      ),
    },
    {
      key: 'pool',
      label: 'Pool',
      children: (
        <ProTable<LbPool>
          columns={poolColumns}
          actionRef={poolActionRef}
          rowKey="id"
          pagination={{ defaultPageSize: 20 }}
          search={false}
          request={async () => {
            try {
              const res = await listLbPools()
              return { data: res.pools, success: true }
            } catch {
              return { data: [], success: false }
            }
          }}
          toolBarRender={() => [
            <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              创建 Pool
            </Button>,
          ]}
        />
      ),
    },
    {
      key: 'member',
      label: 'Member',
      children: (
        <ProTable<LbMemberEntry>
          columns={memberColumns}
          actionRef={memberActionRef}
          rowKey="id"
          pagination={{ defaultPageSize: 20 }}
          search={false}
          request={async () => {
            try {
              const res = await listLbMembers()
              return { data: res.members, success: true }
            } catch {
              return { data: [], success: false }
            }
          }}
          toolBarRender={() => [
            <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              创建 Member
            </Button>,
          ]}
        />
      ),
    },
    {
      key: 'monitor',
      label: 'Health Monitor',
      children: (
        <ProTable<LbHealthMonitor>
          columns={monitorColumns}
          actionRef={monitorActionRef}
          rowKey="id"
          pagination={{ defaultPageSize: 20 }}
          search={false}
          request={async () => {
            try {
              const res = await listLbHealthMonitors()
              return { data: res.healthmonitors, success: true }
            } catch {
              return { data: [], success: false }
            }
          }}
          toolBarRender={() => [
            <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              创建 Health Monitor
            </Button>,
          ]}
        />
      ),
    },
  ]

  return (
    <PageContainer title="集群防护">
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <Modal
        title={`${editingId ? '编辑' : '创建'} ${TAB_LABELS[activeTab]}`}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {FORM_MAP[activeTab]?.()}
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default ClusterProtect
