import { useEffect, useState } from 'react'
import { Button, Modal, Form, Input, Select, Switch, Tag, Popconfirm, message } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { useNavigate } from 'react-router-dom'
import {
  listGlobalCustomRules,
  createGlobalCustomRule,
  updateGlobalCustomRule,
  deleteGlobalCustomRule,
} from '@/api/policy'
import type { GlobalCustomRule } from '@/api/types/policy'

const severityMap: Record<string, { text: string; color: string }> = {
  critical: { text: '严重', color: 'red' },
  high: { text: '高危', color: 'volcano' },
  medium: { text: '中危', color: 'orange' },
  low: { text: '低危', color: 'gold' },
  info: { text: '信息', color: 'blue' },
}

const actionMap: Record<string, string> = {
  deny: '阻断',
  pass: '检测',
  allow: '放行',
  drop: '丢弃',
  redirect: '重定向',
}

const CustomRulePage = () => {
  const navigate = useNavigate()
  const [rules, setRules] = useState<GlobalCustomRule[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState<GlobalCustomRule | null>(null)
  const [form] = Form.useForm()
  const actionValue = Form.useWatch('action', form)

  const loadRules = async () => {
    setLoading(true)
    try {
      const res = await listGlobalCustomRules()
      setRules(res.custom_rules ?? [])
    } catch {
      /* 已由拦截器提示 */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRules()
  }, [])

  const handleCreate = () => {
    setEditingRule(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: GlobalCustomRule) => {
    setEditingRule(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteGlobalCustomRule(id)
      message.success('删除成功')
      loadRules()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRule) {
        await updateGlobalCustomRule(editingRule.id, values)
        message.success('更新成功')
      } else {
        await createGlobalCustomRule(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadRules()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ProColumns<GlobalCustomRule>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      render: (_, record) => (
        <a onClick={() => navigate(`/policy/custom-rule/${record.id}`)}>{record.name}</a>
      ),
    },
    { title: '类型', dataIndex: 'type', render: v => (v === 'and' ? 'AND' : 'OR') },
    {
      title: '位置',
      dataIndex: 'position',
      render: v => (v === 'before' ? '引擎前' : '引擎后'),
    },
    {
      title: '威胁等级',
      dataIndex: 'severity',
      render: (_, record) => (
        <Tag color={severityMap[record.severity]?.color}>
          {severityMap[record.severity]?.text ?? record.severity}
        </Tag>
      ),
    },
    {
      title: '日志',
      dataIndex: 'log',
      render: v => (v ? <Tag color="green">启用</Tag> : <Tag>禁用</Tag>),
    },
    {
      title: '动作',
      dataIndex: 'action',
      render: (_, record) => actionMap[record.action] ?? record.action,
    },
    {
      title: '状态',
      dataIndex: 'state',
      render: v => (v ? <Tag color="green">启用</Tag> : <Tag>禁用</Tag>),
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="nodes" onClick={() => navigate(`/policy/custom-rule/${record.id}`)}>
          节点
        </a>,
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>,
        <Popconfirm key="delete" title="确认删除此规则?" onConfirm={() => handleDelete(record.id)}>
          <a>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <PageContainer title="自定义规则">
      <ProTable<GlobalCustomRule>
        columns={columns}
        dataSource={rules}
        loading={loading}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        toolBarRender={() => [
          <Button key="create" type="primary" onClick={handleCreate}>
            创建规则
          </Button>,
        ]}
      />

      <Modal
        title={editingRule ? '编辑规则' : '创建规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={520}
      >
        <Form form={form} layout="vertical" initialValues={{ log: false, state: true }}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select placeholder="请选择类型">
              <Select.Option value="and">AND</Select.Option>
              <Select.Option value="or">OR</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="position" label="位置" rules={[{ required: true }]}>
            <Select placeholder="请选择位置">
              <Select.Option value="before">引擎前</Select.Option>
              <Select.Option value="after">引擎后</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="severity" label="威胁等级" rules={[{ required: true }]}>
            <Select placeholder="请选择威胁等级">
              <Select.Option value="critical">严重</Select.Option>
              <Select.Option value="high">高危</Select.Option>
              <Select.Option value="medium">中危</Select.Option>
              <Select.Option value="low">低危</Select.Option>
              <Select.Option value="info">信息</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="log" label="日志记录" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="action" label="动作" rules={[{ required: true }]}>
            <Select placeholder="请选择动作">
              <Select.Option value="deny">阻断</Select.Option>
              <Select.Option value="pass">检测</Select.Option>
              <Select.Option value="allow">放行</Select.Option>
              <Select.Option value="drop">丢弃</Select.Option>
              <Select.Option value="redirect">重定向</Select.Option>
            </Select>
          </Form.Item>
          {actionValue === 'redirect' && (
            <Form.Item
              name="url"
              label="重定向 URL"
              rules={[{ required: true, message: '请输入重定向 URL' }]}
            >
              <Input placeholder="请输入重定向 URL" />
            </Form.Item>
          )}
          <Form.Item name="state" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default CustomRulePage
