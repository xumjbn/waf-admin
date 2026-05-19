import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Timeline,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PageContainer } from '@ant-design/pro-components'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getPolicy,
  getPolicyChangeHistory,
  listCategories,
  listRules,
  updateCategory,
  updateRule,
  listCustomParameters,
  updateCustomParameter,
} from '@/api/policy'
import type {
  Category,
  ChangeHistoryItem,
  CustomParameter,
  CustomParameterName,
  Policy,
  Rule,
} from '@/api/types/policy'
import { useResponsive } from '@/hooks/useResponsive'

const policyLevelMap = {
  high: { text: '高', color: 'red' },
  medium: { text: '中', color: 'orange' },
  low: { text: '低', color: 'blue' },
} as const

const engineModeMap = {
  block: { text: '启用', color: 'green' },
  warning: { text: '告警', color: 'orange' },
  disable: { text: '禁用', color: 'default' },
} as const

const severityColor: Record<Rule['severity'], string> = {
  critical: 'red',
  high: 'volcano',
  medium: 'orange',
  low: 'gold',
  info: 'blue',
}

const actionLabel: Record<Rule['action'], string> = {
  deny: '拒绝',
  pass: '放行',
  allow: '允许',
  drop: '丢弃',
  redirect: '重定向',
}

interface EditCategoryFormValues {
  display_name: string
  state: Category['state']
}

interface EditRuleFormValues {
  state: Rule['state']
  severity: Rule['severity']
  action: Rule['action']
  log: boolean
  description: string
}

const BasePolicyDetail = () => {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const responsive = useResponsive()

  const [policy, setPolicy] = useState<Policy | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [parameters, setParameters] = useState<CustomParameter[]>([])
  const [history, setHistory] = useState<ChangeHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [categoryForm] = Form.useForm<EditCategoryFormValues>()
  const [ruleForm] = Form.useForm<EditRuleFormValues>()

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([getPolicy(id), listCategories(id), listRules(id), listCustomParameters(id)])
      .then(([p, c, r, pa]) => {
        setPolicy(p)
        setCategories(c.categories ?? [])
        setRules(r.rules ?? [])
        setParameters(pa.parameters ?? [])
      })
      .catch(() => {
        /* 已由拦截器提示 */
      })
      .finally(() => setLoading(false))
  }, [id])

  const reloadCategories = async () => {
    const c = await listCategories(id)
    setCategories(c.categories ?? [])
  }

  const reloadRules = async () => {
    const r = await listRules(id)
    setRules(r.rules ?? [])
  }

  const reloadParameters = async () => {
    const p = await listCustomParameters(id)
    setParameters(p.parameters ?? [])
  }

  const openHistory = async () => {
    setHistoryOpen(true)
    try {
      const res = await getPolicyChangeHistory(id)
      setHistory(res.history ?? [])
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const submitCategoryEdit = async () => {
    if (!editingCategory) return
    try {
      const values = await categoryForm.validateFields()
      await updateCategory(id, editingCategory.name, {
        display_name: values.display_name,
        state: values.state,
        enabled: values.state === 'enable',
      })
      message.success('类别已更新')
      setEditingCategory(null)
      reloadCategories()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const submitRuleEdit = async () => {
    if (!editingRule) return
    try {
      const values = await ruleForm.validateFields()
      await updateRule(id, editingRule.id, {
        state: values.state,
        severity: values.severity,
        action: values.action,
        log: values.log,
        description: values.description,
        enabled: values.state === 'enable',
      })
      message.success('规则已更新')
      setEditingRule(null)
      reloadRules()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const toggleCategory = async (record: Category) => {
    const next: Category['state'] = record.state === 'enable' ? 'disable' : 'enable'
    try {
      await updateCategory(id, record.name, { state: next, enabled: next === 'enable' })
      message.success(next === 'enable' ? '已启用' : '已禁用')
      reloadCategories()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const updateParam = async (name: CustomParameterName, value: number) => {
    try {
      await updateCustomParameter(id, name, value)
      message.success('参数已更新')
      reloadParameters()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const categoryColumns: ColumnsType<Category> = [
    { title: '类别 Slug', dataIndex: 'name' },
    { title: '显示名', dataIndex: 'display_name' },
    {
      title: '状态',
      dataIndex: 'state',
      render: (state: Category['state']) =>
        state === 'enable' ? <Tag color="green">已启用</Tag> : <Tag color="default">已禁用</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <a
            onClick={() => {
              setEditingCategory(record)
              categoryForm.setFieldsValue({
                display_name: record.display_name,
                state: record.state,
              })
            }}
          >
            编辑
          </a>
          <a onClick={() => toggleCategory(record)}>
            {record.state === 'enable' ? '禁用' : '启用'}
          </a>
        </Space>
      ),
    },
  ]

  const ruleColumns: ColumnsType<Rule> = [
    { title: '规则 ID', dataIndex: 'id', width: 140 },
    {
      title: 'URL / 路径',
      dataIndex: 'url',
      ellipsis: true,
    },
    {
      title: '严重度',
      dataIndex: 'severity',
      render: (s: Rule['severity']) => <Tag color={severityColor[s]}>{s.toUpperCase()}</Tag>,
    },
    {
      title: '动作',
      dataIndex: 'action',
      render: (a: Rule['action']) => <span>{actionLabel[a]}</span>,
    },
    {
      title: '日志',
      dataIndex: 'log',
      render: (log: boolean) => (log ? <Tag color="blue">记录</Tag> : <Tag>不记录</Tag>),
    },
    {
      title: '状态',
      dataIndex: 'state',
      render: (state: Rule['state']) =>
        state === 'enable' ? <Tag color="green">启用</Tag> : <Tag>禁用</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <a
          onClick={() => {
            setEditingRule(record)
            ruleForm.setFieldsValue({
              state: record.state,
              severity: record.severity,
              action: record.action,
              log: record.log,
              description: record.description,
            })
          }}
        >
          编辑
        </a>
      ),
    },
  ]

  const parameterColumns: ColumnsType<CustomParameter> = [
    { title: '参数名', dataIndex: 'name' },
    { title: '默认值', dataIndex: 'default_value' },
    {
      title: '当前值',
      dataIndex: 'value',
      render: (value: number, record) => (
        <InputNumber
          min={0}
          defaultValue={value}
          onBlur={e => {
            const next = Number(e.target.value)
            if (!Number.isNaN(next) && next !== value) {
              updateParam(record.name, next)
            }
          }}
          style={{ width: 140 }}
        />
      ),
    },
  ]

  return (
    <PageContainer
      title={policy ? `基础策略 · ${policy.name}` : '基础策略详情'}
      onBack={() => navigate('/policy/base')}
      extra={[
        <Button key="history" onClick={openHistory}>
          变更历史
        </Button>,
      ]}
      loading={loading}
    >
      {policy && (
        <Card style={{ marginBottom: 16 }} bordered={false}>
          <Descriptions column={responsive.isMobile ? 1 : 3} size="small">
            <Descriptions.Item label="策略名称">{policy.name}</Descriptions.Item>
            <Descriptions.Item label="防护等级">
              <Tag color={policyLevelMap[policy.policy_level].color}>
                {policyLevelMap[policy.policy_level].text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={engineModeMap[policy.engine_mode].color}>
                {engineModeMap[policy.engine_mode].text}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card bordered={false}>
        <Tabs
          defaultActiveKey="category"
          items={[
            {
              key: 'category',
              label: `规则类别 (${categories.length})`,
              children: (
                <Table<Category>
                  rowKey="name"
                  columns={categoryColumns}
                  dataSource={categories}
                  pagination={{ pageSize: responsive.isMobile ? 10 : 20 }}
                  scroll={responsive.tableScroll}
                />
              ),
            },
            {
              key: 'rule',
              label: `规则 (${rules.length})`,
              children: (
                <Table<Rule>
                  rowKey="id"
                  columns={ruleColumns}
                  dataSource={rules}
                  pagination={{ pageSize: responsive.isMobile ? 10 : 20 }}
                  scroll={responsive.tableScroll}
                />
              ),
            },
            {
              key: 'parameter',
              label: `自定义参数 (${parameters.length})`,
              children: (
                <Table<CustomParameter>
                  rowKey="name"
                  columns={parameterColumns}
                  dataSource={parameters}
                  pagination={false}
                  scroll={responsive.tableScroll}
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="编辑类别"
        open={!!editingCategory}
        onOk={submitCategoryEdit}
        onCancel={() => setEditingCategory(null)}
        width={responsive.modalWidth}
        destroyOnClose
      >
        <Form form={categoryForm} layout={responsive.formLayout} preserve={false}>
          <Form.Item
            name="display_name"
            label="显示名"
            rules={[{ required: true, message: '请输入显示名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="state" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              options={[
                { label: '启用', value: 'enable' },
                { label: '禁用', value: 'disable' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑规则"
        open={!!editingRule}
        onOk={submitRuleEdit}
        onCancel={() => setEditingRule(null)}
        width={responsive.modalWidth}
        destroyOnClose
      >
        <Form form={ruleForm} layout={responsive.formLayout} preserve={false}>
          <Form.Item name="state" label="状态" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '启用', value: 'enable' },
                { label: '禁用', value: 'disable' },
              ]}
            />
          </Form.Item>
          <Form.Item name="severity" label="严重度" rules={[{ required: true }]}>
            <Select
              options={[
                { label: 'critical', value: 'critical' },
                { label: 'high', value: 'high' },
                { label: 'medium', value: 'medium' },
                { label: 'low', value: 'low' },
                { label: 'info', value: 'info' },
              ]}
            />
          </Form.Item>
          <Form.Item name="action" label="动作" rules={[{ required: true }]}>
            <Select
              options={(Object.keys(actionLabel) as Rule['action'][]).map(k => ({
                label: actionLabel[k],
                value: k,
              }))}
            />
          </Form.Item>
          <Form.Item name="log" label="记录日志" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="变更历史"
        placement="right"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        width={responsive.drawerWidth}
      >
        {history.length === 0 ? (
          <span style={{ color: '#999' }}>暂无变更记录</span>
        ) : (
          <Timeline
            items={history.map(item => ({
              children: (
                <Space direction="vertical" size={2}>
                  <span style={{ fontWeight: 500 }}>{item.action}</span>
                  <span style={{ color: '#888', fontSize: 12 }}>
                    {item.timestamp} · {item.user}
                  </span>
                  <span>{item.details}</span>
                </Space>
              ),
            }))}
          />
        )}
      </Drawer>
    </PageContainer>
  )
}

export default BasePolicyDetail
