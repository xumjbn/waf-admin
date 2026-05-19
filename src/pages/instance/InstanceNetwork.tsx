import { useState, useRef } from 'react'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Modal, Form, Input, Tabs, Tag, Popconfirm, message } from 'antd'
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import {
  listInstanceInterfaces,
  updateInstanceInterface,
  listInstanceBridges,
  createInstanceBridge,
  updateInstanceBridge,
  deleteInstanceBridge,
} from '@/api/instance'
import type { InstanceInterface, InstanceBridge } from '@/api/types/instance'

const InstanceNetwork = () => {
  const { id: instanceId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const ifaceRef = useRef<ActionType>()
  const bridgeRef = useRef<ActionType>()
  const [ifaceForm] = Form.useForm()
  const [bridgeForm] = Form.useForm()
  const [ifaceModal, setIfaceModal] = useState(false)
  const [bridgeModal, setBridgeModal] = useState(false)
  const [editingIfaceId, setEditingIfaceId] = useState<string | null>(null)
  const [editingBridgeId, setEditingBridgeId] = useState<string | null>(null)

  const handleEditIface = (record: InstanceInterface) => {
    setEditingIfaceId(record.id)
    ifaceForm.setFieldsValue(record)
    setIfaceModal(true)
  }

  const handleSaveIface = async () => {
    if (!instanceId || !editingIfaceId) return
    try {
      const values = await ifaceForm.validateFields()
      await updateInstanceInterface(instanceId, editingIfaceId, values)
      message.success('更新成功')
      setIfaceModal(false)
      ifaceRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleCreateBridge = () => {
    setEditingBridgeId(null)
    bridgeForm.resetFields()
    setBridgeModal(true)
  }

  const handleEditBridge = (record: InstanceBridge) => {
    setEditingBridgeId(record.id)
    bridgeForm.setFieldsValue(record)
    setBridgeModal(true)
  }

  const handleSaveBridge = async () => {
    if (!instanceId) return
    try {
      const values = await bridgeForm.validateFields()
      if (editingBridgeId) {
        await updateInstanceBridge(instanceId, editingBridgeId, values)
        message.success('更新成功')
      } else {
        await createInstanceBridge(instanceId, values)
        message.success('创建成功')
      }
      setBridgeModal(false)
      bridgeRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleDeleteBridge = async (id: string) => {
    if (!instanceId) return
    try {
      await deleteInstanceBridge(instanceId, id)
      message.success('删除成功')
      bridgeRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const ifaceColumns: ProColumns<InstanceInterface>[] = [
    { title: '名称', dataIndex: 'name' },
    {
      title: '角色',
      render: () => <Tag color="default">-</Tag>,
    },
    { title: 'IP 地址', dataIndex: 'ip_address' },
    { title: '子网掩码', dataIndex: 'netmask' },
    { title: '网关', dataIndex: 'gateway', render: v => v ?? '-' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => handleEditIface(record)}>
          编辑
        </a>,
      ],
    },
  ]

  const bridgeColumns: ProColumns<InstanceBridge>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '接口', dataIndex: 'interfaces', render: (_, r) => (r.interfaces ?? []).join(', ') },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => handleEditBridge(record)}>
          编辑
        </a>,
        <Popconfirm key="del" title="确定删除?" onConfirm={() => handleDeleteBridge(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <PageContainer
      title="网络配置"
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/instance')}>
          返回
        </Button>
      }
    >
      <Tabs
        items={[
          {
            key: 'iface',
            label: '网络接口',
            children: (
              <ProTable<InstanceInterface>
                columns={ifaceColumns}
                actionRef={ifaceRef}
                rowKey="id"
                pagination={{ defaultPageSize: 20 }}
                search={false}
                request={async () => {
                  if (!instanceId) return { data: [], success: true }
                  const res = await listInstanceInterfaces(instanceId)
                  return { data: res.interfaces ?? [], success: true }
                }}
              />
            ),
          },
          {
            key: 'bridge',
            label: '网桥',
            children: (
              <ProTable<InstanceBridge>
                columns={bridgeColumns}
                actionRef={bridgeRef}
                rowKey="id"
                pagination={{ defaultPageSize: 20 }}
                search={false}
                request={async () => {
                  if (!instanceId) return { data: [], success: true }
                  const res = await listInstanceBridges(instanceId)
                  return { data: res.bridges ?? [], success: true }
                }}
                toolBarRender={() => [
                  <Button
                    key="add"
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreateBridge}
                  >
                    创建网桥
                  </Button>,
                ]}
              />
            ),
          },
        ]}
      />

      <Modal
        title="编辑接口"
        open={ifaceModal}
        onOk={handleSaveIface}
        onCancel={() => setIfaceModal(false)}
      >
        <Form form={ifaceForm} layout="vertical">
          <Form.Item name="ip_address" label="IP 地址" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="netmask" label="子网掩码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="gateway" label="网关">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingBridgeId ? '编辑网桥' : '创建网桥'}
        open={bridgeModal}
        onOk={handleSaveBridge}
        onCancel={() => setBridgeModal(false)}
      >
        <Form form={bridgeForm} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="interfaces" label="接口">
            <Input placeholder="逗号分隔,如 eth0,eth1" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default InstanceNetwork
