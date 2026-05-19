import { useState, useRef, useMemo } from 'react'
import { ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Button, Modal, Form, Input, Select, InputNumber, Tabs, Popconfirm, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { listInstanceMembers, createInstanceMember, updateInstanceMember, deleteInstanceMember } from '@/api/site'
import type { InstanceProtectMember } from '@/api/types/site'

type MemberType = InstanceProtectMember['member_type']

const MEMBER_TYPE_TABS: { key: MemberType; label: string }[] = [
  { key: 'transparent', label: '透明防护' },
  { key: 'reverse', label: '反代防护' },
  { key: 'bypass', label: '旁路监听' },
]

const PROTOCOL_OPTIONS = [
  { label: 'HTTP', value: 'http' },
  { label: 'HTTPS', value: 'https' },
  { label: 'HTTP升级', value: 'upgrade_http' },
]

interface MemberTableProps {
  siteId: string
}

const MemberTable = ({ siteId }: MemberTableProps) => {
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<MemberType>('transparent')
  const [allMembers, setAllMembers] = useState<InstanceProtectMember[]>([])

  const filteredMembers = useMemo(
    () => allMembers.filter(m => m.member_type === activeTab),
    [allMembers, activeTab],
  )

  const fetchMembers = async () => {
    try {
      const res = await listInstanceMembers(siteId)
      setAllMembers(res.instance_protect)
    } catch {
      setAllMembers([])
    }
  }

  const handleCreate = () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ member_type: activeTab })
    setModalVisible(true)
  }

  const handleEdit = (record: InstanceProtectMember) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteInstanceMember(siteId, id)
      message.success('删除成功')
      fetchMembers()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingId) {
        await updateInstanceMember(siteId, editingId, values)
        message.success('更新成功')
      } else {
        await createInstanceMember(siteId, values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchMembers()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const currentType: MemberType = Form.useWatch('member_type', form) ?? activeTab

  const columns: ProColumns<InstanceProtectMember>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '协议', dataIndex: 'protocol' },
    { title: '实例', dataIndex: 'instance_id', ellipsis: true },
    { title: '地址', dataIndex: 'address', ellipsis: true },
    { title: '端口', dataIndex: 'protocol_port' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确定删除该防护成员？"
          onConfirm={() => handleDelete(record.id)}
        >
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <>
      <Tabs
        activeKey={activeTab}
        onChange={key => setActiveTab(key as MemberType)}
        items={MEMBER_TYPE_TABS}
      />
      <ProTable<InstanceProtectMember>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        dataSource={filteredMembers}
        request={async () => {
          await fetchMembers()
          return { success: true }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增防护成员
          </Button>,
        ]}
      />

      <Modal
        title={editingId ? '编辑防护成员' : '新增防护成员'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ member_type: activeTab }}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item name="member_type" label="成员类型" hidden>
            <Select options={MEMBER_TYPE_TABS.map(t => ({ label: t.label, value: t.key }))} />
          </Form.Item>
          <Form.Item name="protocol" label="协议">
            <Select placeholder="请选择协议" options={PROTOCOL_OPTIONS} />
          </Form.Item>
          <Form.Item name="instance_id" label="实例">
            <Select allowClear placeholder="请选择实例" />
          </Form.Item>
          <Form.Item
            name="protocol_port"
            label="端口"
            rules={[{ required: true, message: '请输入端口' }]}
          >
            <InputNumber min={1} max={65535} style={{ width: '100%' }} placeholder="请输入端口" />
          </Form.Item>

          {/* transparent 字段 */}
          {currentType === 'transparent' && (
            <>
              <Form.Item name="address" label="地址">
                <Input placeholder="请输入地址" />
              </Form.Item>
              <Form.Item name="service_subnet_id" label="服务子网">
                <Input placeholder="请输入服务子网ID" />
              </Form.Item>
              <Form.Item name="link" label="链路">
                <Input placeholder="请输入链路" />
              </Form.Item>
              <Form.Item name="vlan_id" label="VLAN ID">
                <Input placeholder="请输入VLAN ID" />
              </Form.Item>
            </>
          )}

          {/* reverse 字段 */}
          {currentType === 'reverse' && (
            <>
              <Form.Item name="local_address" label="本地地址">
                <Input placeholder="请输入本地地址" />
              </Form.Item>
              <Form.Item
                name="backend_address"
                label="后端地址"
                rules={[{ required: true, message: '请输入后端地址' }]}
              >
                <Input placeholder="请输入后端地址" />
              </Form.Item>
              <Form.Item
                name="backend_protocol_port"
                label="后端端口"
                rules={[{ required: true, message: '请输入后端端口' }]}
              >
                <InputNumber
                  min={1}
                  max={65535}
                  style={{ width: '100%' }}
                  placeholder="请输入后端端口"
                />
              </Form.Item>
              <Form.Item name="service_subnet_id" label="服务子网">
                <Input placeholder="请输入服务子网ID" />
              </Form.Item>
            </>
          )}

          {/* bypass 字段 */}
          {currentType === 'bypass' && (
            <>
              <Form.Item name="bypass_if" label="旁路接口">
                <Input placeholder="请输入旁路接口" />
              </Form.Item>
              <Form.Item name="address" label="地址">
                <Input placeholder="请输入地址" />
              </Form.Item>
              <Form.Item name="service_subnet_id" label="服务子网">
                <Input placeholder="请输入服务子网ID" />
              </Form.Item>
              <Form.Item name="vlan_id" label="VLAN ID">
                <Input placeholder="请输入VLAN ID" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </>
  )
}

export default MemberTable
