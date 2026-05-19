import { useState, useEffect, useRef, useCallback } from 'react'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import {
  Tabs,
  Form,
  InputNumber,
  Button,
  Card,
  Radio,
  Modal,
  Input,
  Popconfirm,
  message,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import {
  getPasswordLengthConfig,
  updatePasswordLengthConfig,
  getAttemptLimitConfig,
  updateAttemptLimitConfig,
  getPasswordChangeCycle,
  updatePasswordChangeCycle,
  getAuthHostConfig,
  updateAuthHostConfig,
  listAuthHosts,
  createAuthHost,
  updateAuthHost,
  deleteAuthHost,
} from '@/api/system'
import type {
  PasswordLengthConfig,
  AttemptLimitConfig,
  PasswordChangeCycle,
  AuthHostConfig,
  AuthHost,
} from '@/api/types/system'

const SecurityManagement = () => {
  const actionRef = useRef<ActionType>()
  const [pwLengthForm] = Form.useForm()
  const [attemptForm] = Form.useForm()
  const [cycleForm] = Form.useForm()
  const [hostForm] = Form.useForm()
  const [hostModalVisible, setHostModalVisible] = useState(false)
  const [editingHostId, setEditingHostId] = useState<string | null>(null)
  const [hostConfig, setHostConfig] = useState<AuthHostConfig>({ enabled: false })

  const loadPasswordConfigs = useCallback(async () => {
    try {
      const [pwLength, attempt, cycle] = await Promise.all([
        getPasswordLengthConfig(),
        getAttemptLimitConfig(),
        getPasswordChangeCycle(),
      ])
      pwLengthForm.setFieldsValue(pwLength)
      attemptForm.setFieldsValue(attempt)
      cycleForm.setFieldsValue(cycle)
    } catch {
      /* 已由拦截器提示 */
    }
  }, [pwLengthForm, attemptForm, cycleForm])

  const loadHostConfig = useCallback(async () => {
    try {
      const config = await getAuthHostConfig()
      setHostConfig(config)
    } catch {
      /* 已由拦截器提示 */
    }
  }, [])

  useEffect(() => {
    loadPasswordConfigs()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHostConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSavePwLength = async () => {
    try {
      const values = await pwLengthForm.validateFields()
      await updatePasswordLengthConfig(values as PasswordLengthConfig)
      message.success('保存成功')
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleSaveAttempt = async () => {
    try {
      const values = await attemptForm.validateFields()
      await updateAttemptLimitConfig(values as AttemptLimitConfig)
      message.success('保存成功')
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleSaveCycle = async () => {
    try {
      const values = await cycleForm.validateFields()
      await updatePasswordChangeCycle(values as PasswordChangeCycle)
      message.success('保存成功')
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleHostConfigChange = async (enabled: boolean) => {
    try {
      await updateAuthHostConfig({ enabled })
      setHostConfig({ enabled })
      message.success('保存成功')
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleCreateHost = () => {
    setEditingHostId(null)
    hostForm.resetFields()
    setHostModalVisible(true)
  }

  const handleEditHost = (record: AuthHost) => {
    setEditingHostId(record.id)
    hostForm.setFieldsValue(record)
    setHostModalVisible(true)
  }

  const handleDeleteHost = async (id: string) => {
    try {
      await deleteAuthHost(id)
      message.success('删除成功')
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleSubmitHost = async () => {
    try {
      const values = await hostForm.validateFields()
      if (editingHostId) {
        await updateAuthHost(editingHostId, values)
        message.success('更新成功')
      } else {
        await createAuthHost(values)
        message.success('创建成功')
      }
      setHostModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const hostColumns: ProColumns<AuthHost>[] = [
    { title: 'IP 地址', dataIndex: 'ip' },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => handleEditHost(record)}>
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确定删除该主机？"
          onConfirm={() => handleDeleteHost(record.id)}
        >
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  const passwordTab = (
    <>
      <Card title="密码长度配置" style={{ marginBottom: 16 }}>
        <Form form={pwLengthForm} layout="inline">
          <Form.Item name="min_length" label="最小长度" rules={[{ required: true }]}>
            <InputNumber min={6} max={32} />
          </Form.Item>
          <Form.Item name="max_length" label="最大长度">
            <InputNumber min={6} max={128} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSavePwLength}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="登录尝试限制" style={{ marginBottom: 16 }}>
        <Form form={attemptForm} layout="inline">
          <Form.Item name="max_attempts" label="最大尝试次数" rules={[{ required: true }]}>
            <InputNumber min={1} max={10} />
          </Form.Item>
          <Form.Item name="lockout_duration" label="锁定时长(秒)">
            <InputNumber min={60} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSaveAttempt}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="密码更换周期">
        <Form form={cycleForm} layout="inline">
          <Form.Item name="cycle" label="更换周期(天)" rules={[{ required: true }]}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSaveCycle}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  )

  const trustedHostTab = (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Radio.Group
          value={hostConfig.enabled}
          onChange={e => handleHostConfigChange(e.target.value)}
        >
          <Radio value={false}>允许所有主机</Radio>
          <Radio value={true}>仅允许可信主机</Radio>
        </Radio.Group>
      </Card>

      <ProTable<AuthHost>
        columns={hostColumns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: 20 }}
        search={false}
        request={async () => {
          try {
            const res = await listAuthHosts()
            return { data: res.auth_hosts, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreateHost}>
            添加可信主机
          </Button>,
        ]}
      />

      <Modal
        title={editingHostId ? '编辑可信主机' : '添加可信主机'}
        open={hostModalVisible}
        onOk={handleSubmitHost}
        onCancel={() => setHostModalVisible(false)}
        destroyOnClose
      >
        <Form form={hostForm} layout="vertical">
          <Form.Item
            name="ip"
            label="IP 地址"
            rules={[{ required: true, message: '请输入 IP 地址' }]}
          >
            <Input placeholder="请输入 IP 地址" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )

  return (
    <PageContainer title="安全管理">
      <Tabs
        items={[
          { key: 'password', label: '密码策略', children: passwordTab },
          { key: 'trusted', label: '可信主机', children: trustedHostTab },
        ]}
      />
    </PageContainer>
  )
}

export default SecurityManagement
