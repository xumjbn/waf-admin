import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ArrowDownOutlined, ArrowUpOutlined, PlusOutlined } from '@ant-design/icons'
import { PageContainer } from '@ant-design/pro-components'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createCustomRuleNode,
  deleteCustomRuleNode,
  getGlobalCustomRule,
  listCustomRuleNodes,
  updateCustomRuleNode,
  updateCustomRuleNodePriority,
} from '@/api/policy'
import type { CustomRuleNode, GlobalCustomRule } from '@/api/types/policy'
import { useResponsive } from '@/hooks/useResponsive'

interface NodeFormValues {
  variable: string
  match: string
  lowercase: boolean
  length: boolean
  decodeurl: boolean
  decodehtml: boolean
  decodebase64: boolean
  decodehex: boolean
}

type FlagKey = 'lowercase' | 'length' | 'decodeurl' | 'decodehtml' | 'decodebase64' | 'decodehex'

const decodeFlags: FlagKey[] = [
  'lowercase',
  'length',
  'decodeurl',
  'decodehtml',
  'decodebase64',
  'decodehex',
]

const flagLabel: Record<FlagKey, string> = {
  lowercase: '转小写',
  length: '取长度',
  decodeurl: 'URL 解码',
  decodehtml: 'HTML 解码',
  decodebase64: 'Base64 解码',
  decodehex: 'Hex 解码',
}

const severityMap: Record<string, { text: string; color: string }> = {
  critical: { text: '严重', color: 'red' },
  high: { text: '高危', color: 'volcano' },
  medium: { text: '中危', color: 'orange' },
  low: { text: '低危', color: 'gold' },
  info: { text: '信息', color: 'blue' },
}

const CustomRuleDetail = () => {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const responsive = useResponsive()

  const [rule, setRule] = useState<GlobalCustomRule | null>(null)
  const [nodes, setNodes] = useState<CustomRuleNode[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CustomRuleNode | null>(null)
  const [form] = Form.useForm<NodeFormValues>()

  const reloadNodes = async () => {
    const res = await listCustomRuleNodes(id)
    setNodes(res.nodes ?? [])
  }

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([getGlobalCustomRule(id), listCustomRuleNodes(id)])
      .then(([r, ns]) => {
        setRule(r)
        setNodes(ns.nodes ?? [])
      })
      .catch(() => {
        /* 已由拦截器提示 */
      })
      .finally(() => setLoading(false))
  }, [id])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      lowercase: false,
      length: false,
      decodeurl: false,
      decodehtml: false,
      decodebase64: false,
      decodehex: false,
    })
    setModalOpen(true)
  }

  const openEdit = (record: CustomRuleNode) => {
    setEditing(record)
    form.setFieldsValue({
      variable: record.variable,
      match: record.match,
      lowercase: record.lowercase,
      length: record.length,
      decodeurl: record.decodeurl,
      decodehtml: record.decodehtml,
      decodebase64: record.decodebase64,
      decodehex: record.decodehex,
    })
    setModalOpen(true)
  }

  const submit = async () => {
    try {
      const values = await form.validateFields()
      if (editing) {
        await updateCustomRuleNode(id, editing.id, values)
        message.success('节点已更新')
      } else {
        await createCustomRuleNode(id, values)
        message.success('节点已创建')
      }
      setModalOpen(false)
      reloadNodes()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const remove = async (nodeId: string) => {
    try {
      await deleteCustomRuleNode(id, nodeId)
      message.success('删除成功')
      reloadNodes()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const move = async (nodeId: string, direction: 'up' | 'down') => {
    try {
      await updateCustomRuleNodePriority(id, nodeId, direction)
      reloadNodes()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ColumnsType<CustomRuleNode> = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_, __, idx) => idx + 1,
    },
    { title: '变量', dataIndex: 'variable' },
    {
      title: '匹配',
      dataIndex: 'match',
      ellipsis: true,
      render: (v: string) => <code style={{ fontSize: 12 }}>{v}</code>,
    },
    {
      title: '解码 / 处理',
      key: 'flags',
      render: (_, record) => (
        <Space size={4} wrap>
          {decodeFlags
            .filter(k => Boolean(record[k]))
            .map(k => (
              <Tag key={k} color="blue">
                {flagLabel[k]}
              </Tag>
            ))}
          {decodeFlags.every(k => !record[k]) && <span style={{ color: '#bbb' }}>无</span>}
        </Space>
      ),
    },
    {
      title: '排序',
      key: 'reorder',
      width: 120,
      render: (_, record, idx) => (
        <Space size={0}>
          <Button
            type="text"
            size="small"
            icon={<ArrowUpOutlined />}
            disabled={idx === 0}
            onClick={() => move(record.id, 'up')}
            aria-label="上移"
          />
          <Button
            type="text"
            size="small"
            icon={<ArrowDownOutlined />}
            disabled={idx === nodes.length - 1}
            onClick={() => move(record.id, 'down')}
            aria-label="下移"
          />
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <a onClick={() => openEdit(record)}>编辑</a>
          <Popconfirm title="确认删除此节点?" onConfirm={() => remove(record.id)}>
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <PageContainer
      title={rule ? `自定义规则 · ${rule.name}` : '自定义规则详情'}
      onBack={() => navigate('/policy/custom-rule')}
      loading={loading}
    >
      {rule && (
        <Card style={{ marginBottom: 16 }} bordered={false}>
          <Descriptions column={responsive.isMobile ? 1 : 3} size="small">
            <Descriptions.Item label="规则名称">{rule.name}</Descriptions.Item>
            <Descriptions.Item label="组合类型">
              {rule.type === 'and' ? 'AND' : 'OR'}
            </Descriptions.Item>
            <Descriptions.Item label="位置">
              {rule.position === 'before' ? '引擎前' : '引擎后'}
            </Descriptions.Item>
            <Descriptions.Item label="威胁等级">
              <Tag color={severityMap[rule.severity]?.color}>
                {severityMap[rule.severity]?.text ?? rule.severity}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="动作">{rule.action}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {rule.state ? <Tag color="green">启用</Tag> : <Tag>禁用</Tag>}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card
        bordered={false}
        title={`匹配节点 (${nodes.length})`}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            添加节点
          </Button>
        }
      >
        <Table<CustomRuleNode>
          rowKey="id"
          columns={columns}
          dataSource={nodes}
          pagination={false}
          scroll={responsive.tableScroll}
        />
      </Card>

      <Modal
        title={editing ? '编辑节点' : '添加节点'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        width={responsive.modalWidth}
        destroyOnClose
      >
        <Form form={form} layout={responsive.formLayout} preserve={false}>
          <Form.Item
            name="variable"
            label="变量"
            rules={[{ required: true, message: '请输入变量,例如 args.user' }]}
          >
            <Input placeholder="例如 args.user / request_uri" />
          </Form.Item>
          <Form.Item
            name="match"
            label="匹配"
            rules={[{ required: true, message: '请输入匹配表达式' }]}
          >
            <Input.TextArea rows={3} placeholder="字符串或正则表达式" />
          </Form.Item>
          {decodeFlags.map(k => (
            <Form.Item key={k} name={k} label={flagLabel[k]} valuePropName="checked">
              <Switch />
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default CustomRuleDetail
