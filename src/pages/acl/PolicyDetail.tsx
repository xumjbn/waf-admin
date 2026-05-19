import { useState, useRef, useEffect } from 'react'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Popconfirm,
  message,
  Descriptions,
  Space,
  Tag,
} from 'antd'
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { getAclPolicy, listAclRules, createAclRule, updateAclRule, deleteAclRule } from '@/api/acl'
import type { AclPolicy, AclRule } from '@/api/types/acl'

const PROTOCOL_OPTIONS = [
  { label: 'TCP', value: 'tcp' },
  { label: 'UDP', value: 'udp' },
  { label: 'ICMP', value: 'icmp' },
  { label: '任意', value: 'any' },
]

const ACTION_OPTIONS = [
  { label: '允许', value: 'allow' },
  { label: '拒绝', value: 'deny' },
]

const PolicyDetail = () => {
  const { id: policyId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const [policy, setPolicy] = useState<AclPolicy | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    if (!policyId) return
    getAclPolicy(policyId)
      .then(setPolicy)
      .catch(() => {
        /* 已由拦截器提示 */
      })
  }, [policyId])

  const handleCreate = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: AclRule) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    if (!policyId) return
    try {
      await deleteAclRule(policyId, id)
      message.success('删除成功')
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleSubmit = async () => {
    if (!policyId) return
    try {
      const values = await form.validateFields()
      if (editingId) {
        await updateAclRule(policyId, editingId, values)
        message.success('更新成功')
      } else {
        await createAclRule(policyId, values)
        message.success('创建成功')
      }
      setModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleToggleEnabled = async (record: AclRule) => {
    if (!policyId) return
    try {
      await updateAclRule(policyId, record.id, { enabled: !record.enabled })
      message.success(record.enabled ? '已禁用' : '已启用')
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ProColumns<AclRule>[] = [
    { title: '源IP', dataIndex: 'source_ip', ellipsis: true },
    { title: '目标IP', dataIndex: 'destination_ip', ellipsis: true },
    { title: '端口', dataIndex: 'port' },
    {
      title: '协议',
      dataIndex: 'protocol',
      render: (_, record) => {
        const colorMap: Record<string, string> = {
          tcp: 'blue',
          udp: 'green',
          icmp: 'orange',
          any: 'default',
        }
        return (
          <Tag color={colorMap[record.protocol ?? 'any']}>{record.protocol?.toUpperCase()}</Tag>
        )
      },
    },
    {
      title: '动作',
      dataIndex: 'action',
      render: (_, record) => (
        <Tag color={record.action === 'allow' ? 'success' : 'error'}>
          {record.action === 'allow' ? '允许' : '拒绝'}
        </Tag>
      ),
    },
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
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该规则?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <PageContainer
      title="ACL规则管理"
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/acl/policies')}>
          返回策略列表
        </Button>
      }
    >
      {policy && (
        <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="策略名称">{policy.name}</Descriptions.Item>
          <Descriptions.Item label="启用状态">
            <Tag color={policy.enabled ? 'success' : 'default'}>
              {policy.enabled ? '启用' : '禁用'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="优先级">{policy.priority}</Descriptions.Item>
          <Descriptions.Item label="规则数">{policy.rule_count ?? 0}</Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>
            {policy.description || '-'}
          </Descriptions.Item>
        </Descriptions>
      )}
      <ProTable<AclRule>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        request={async () => {
          if (!policyId) return { data: [], success: false }
          const res = await listAclRules(policyId)
          return { data: res.rules, success: true }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建规则
          </Button>,
        ]}
      />
      <Modal
        title={editingId ? '编辑规则' : '新建规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="source_ip" label="源IP地址">
            <Input placeholder="例如: 192.168.1.0/24 或 0.0.0.0/0" />
          </Form.Item>
          <Form.Item name="destination_ip" label="目标IP地址">
            <Input placeholder="例如: 10.0.0.0/8" />
          </Form.Item>
          <Form.Item name="port" label="端口">
            <Input placeholder="例如: 80,443 或 * 表示所有端口" />
          </Form.Item>
          <Form.Item name="protocol" label="协议" initialValue="any">
            <Select options={PROTOCOL_OPTIONS} />
          </Form.Item>
          <Form.Item name="action" label="动作" rules={[{ required: true }]} initialValue="deny">
            <Select options={ACTION_OPTIONS} />
          </Form.Item>
          <Form.Item name="enabled" label="启用状态" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入规则描述" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default PolicyDetail
