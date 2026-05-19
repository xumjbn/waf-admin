import { useState, useRef } from 'react'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Modal, Form, Input, Select, Tag, Popconfirm, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import {
  listHaClusters,
  createHaCluster,
  updateHaCluster,
  deleteHaCluster,
  listHaInstances,
  addHaInstanceToCluster,
  removeHaInstanceFromCluster,
  listInstances,
} from '@/api/instance'
import type { HaCluster, HaInstance, Instance } from '@/api/types/instance'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: '运行中', color: 'green' },
  inactive: { label: '未激活', color: 'default' },
  standby: { label: '待机', color: 'blue' },
  error: { label: '异常', color: 'red' },
}

const HaProtect = () => {
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const [nodeForm] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [nodeModalVisible, setNodeModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null)
  const [instanceOptions, setInstanceOptions] = useState<Instance[]>([])

  const handleCreate = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: HaCluster) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteHaCluster(id)
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
        await updateHaCluster(editingId, values)
        message.success('更新成功')
      } else {
        await createHaCluster(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleAddNode = async (clusterId: string) => {
    try {
      const res = await listInstances()
      setInstanceOptions(res.instances)
      setSelectedClusterId(clusterId)
      nodeForm.resetFields()
      setNodeModalVisible(true)
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleNodeSubmit = async () => {
    try {
      const values = await nodeForm.validateFields()
      await addHaInstanceToCluster(selectedClusterId!, { instance_id: values.instance_id })
      message.success('添加节点成功')
      setNodeModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleRemoveNode = async (clusterId: string, instanceId: string) => {
    try {
      await removeHaInstanceFromCluster(clusterId, instanceId)
      message.success('删除节点成功')
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ProColumns<HaCluster>[] = [
    { title: '集群名称', dataIndex: 'name' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (_, record) => {
        const s = STATUS_MAP[record.status]
        return <Tag color={s?.color ?? 'default'}>{s?.label ?? record.status}</Tag>
      },
    },
    {
      title: '节点数',
      dataIndex: 'nodes',
      render: (_, record) => record.nodes?.length ?? 0,
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="add" onClick={() => handleAddNode(record.id)}>
          添加节点
        </a>,
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <Popconfirm key="delete" title="确定删除该集群？" onConfirm={() => handleDelete(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  const expandedRowRender = (record: HaCluster) => {
    const nodeColumns: ProColumns<HaInstance>[] = [
      { title: '实例 ID', dataIndex: 'instance_id' },
      {
        title: '状态',
        dataIndex: 'status',
        render: (_, node) => {
          const s = STATUS_MAP[node.status ?? 'inactive']
          return <Tag color={s?.color ?? 'default'}>{s?.label ?? node.status}</Tag>
        },
      },
      {
        title: '操作',
        valueType: 'option',
        render: (_, node) => [
          <Popconfirm
            key="remove"
            title="确定删除该节点？"
            onConfirm={() => handleRemoveNode(record.id, node.instance_id)}
          >
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>,
        ],
      },
    ]

    return (
      <ProTable<HaInstance>
        columns={nodeColumns}
        rowKey="instance_id"
        search={false}
        pagination={false}
        toolBarRender={false}
        request={async () => {
          try {
            const res = await listHaInstances(record.id)
            return { data: res.ha_instances, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
      />
    )
  }

  return (
    <PageContainer title="HA 防护">
      <ProTable<HaCluster>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        expandable={{ expandedRowRender }}
        request={async () => {
          try {
            const res = await listHaClusters()
            return { data: res.clusters, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建集群
          </Button>,
        ]}
      />

      <Modal
        title={editingId ? '编辑 HA 集群' : '创建 HA 集群'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="集群名称"
            rules={[{ required: true, message: '请输入集群名称' }]}
          >
            <Input placeholder="请输入集群名称" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              placeholder="请选择状态"
              options={[
                { label: '运行中', value: 'active' },
                { label: '未激活', value: 'inactive' },
                { label: '待机', value: 'standby' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加 HA 节点"
        open={nodeModalVisible}
        onOk={handleNodeSubmit}
        onCancel={() => setNodeModalVisible(false)}
        destroyOnClose
      >
        <Form form={nodeForm} layout="vertical">
          <Form.Item
            name="instance_id"
            label="实例 实例"
            rules={[{ required: true, message: '请选择 实例 实例' }]}
          >
            <Select
              placeholder="请选择 实例 实例"
              options={instanceOptions.map(inst => ({ label: inst.name, value: inst.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default HaProtect
