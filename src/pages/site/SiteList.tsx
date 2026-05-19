import { useState, useRef } from 'react'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Collapse,
  Tag,
  Popconfirm,
  message,
  Grid,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { listSites, createSite, updateSite, deleteSite } from '@/api/site'
import { deploySite } from '@/api/deploy'
import type { ProtectSite } from '@/api/types/site'

const { TextArea } = Input
const { useBreakpoint } = Grid

const SiteList = () => {
  const navigate = useNavigate()
  const actionRef = useRef<ActionType>()
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [forbiddenType, setForbiddenType] = useState<'block' | 'redirect'>('block')
  const [deployModalVisible, setDeployModalVisible] = useState(false)
  const [deployingSite, setDeployingSite] = useState<ProtectSite | null>(null)
  const [deployNodeIds, setDeployNodeIds] = useState<number[]>([])
  const screens = useBreakpoint()
  const isMobile = screens.xs || screens.sm

  const handleCreate = () => {
    setEditingId(null)
    form.resetFields()
    setForbiddenType('block')
    setModalVisible(true)
  }

  const handleEdit = (record: ProtectSite) => {
    setEditingId(record.id)
    form.setFieldsValue({
      ...record,
      domain_match: record.domain_match === 'exact',
      front_keepalive: record.front_keepalive === 1,
      backend_keepalive: record.backend_keepalive === 1,
    })
    setForbiddenType(record.forbidden_type)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSite(id)
      message.success('删除成功')
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleDeploy = (record: ProtectSite) => {
    setDeployingSite(record)
    setDeployNodeIds([])
    setDeployModalVisible(true)
  }

  const handleDeployConfirm = async () => {
    if (!deployingSite) return
    try {
      await deploySite(deployingSite.id, {
        deploy_type: 'full',
        target_nodes: deployNodeIds,
      })
      message.success('部署已下发')
      setDeployModalVisible(false)
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        domain_match: values.domain_match ? 'exact' : 'prefix',
        front_keepalive: values.front_keepalive ? 1 : 0,
        backend_keepalive: values.backend_keepalive ? 1 : 0,
      }
      if (editingId) {
        await updateSite(editingId, payload)
        message.success('更新成功')
      } else {
        await createSite(payload)
        message.success('创建成功')
      }
      setModalVisible(false)
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const LOG_LEVEL_MAP: Record<string, string> = {
    debug: '调试',
    info: '信息',
    warn: '警告',
    error: '错误',
  }

  const columns: ProColumns<ProtectSite>[] = [
    {
      title: '站点名称',
      dataIndex: 'name',
      fixed: isMobile ? undefined : 'left',
      width: 150,
      render: (_, record) => (
        <a
          onClick={() => navigate(`/site/${record.id}`)}
          role="link"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              navigate(`/site/${record.id}`)
            }
          }}
          aria-label={`查看站点 ${record.name} 详情`}
        >
          {record.name}
        </a>
      ),
    },
    { title: '域名', dataIndex: 'domains', ellipsis: true, hideInTable: isMobile },
    { title: '策略', dataIndex: 'policy_id', ellipsis: true, hideInTable: isMobile },
    {
      title: '状态',
      dataIndex: 'admin_state_up',
      width: 80,
      render: (_, record) => (
        <Tag color={record.admin_state_up ? 'green' : 'default'}>
          {record.admin_state_up ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '部署状态',
      dataIndex: 'deploy_status',
      width: 100,
      render: () => <Tag color="blue">待部署</Tag>,
    },
    {
      title: '日志级别',
      dataIndex: 'log_level',
      width: 100,
      hideInTable: isMobile,
      render: (_, record) => LOG_LEVEL_MAP[record.log_level] ?? record.log_level,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      width: 180,
      hideInTable: isMobile,
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="deploy"
          onClick={() => handleDeploy(record)}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleDeploy(record)
            }
          }}
          aria-label={`部署站点 ${record.name}`}
        >
          部署
        </a>,
        <a
          key="edit"
          onClick={() => handleEdit(record)}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleEdit(record)
            }
          }}
          aria-label={`编辑站点 ${record.name}`}
        >
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确定删除该站点？"
          description={`将删除站点「${record.name}」，此操作不可恢复。`}
          onConfirm={() => handleDelete(record.id)}
          okText="确认删除"
          cancelText="取消"
        >
          <a
            style={{ color: '#ff4d4f' }}
            role="button"
            tabIndex={0}
            aria-label={`删除站点 ${record.name}`}
          >
            删除
          </a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <PageContainer title="站点列表">
      <ProTable<ProtectSite>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{ defaultPageSize: isMobile ? 10 : 20 }}
        search={false}
        scroll={{ x: 'max-content' }}
        request={async () => {
          try {
            const res = await listSites()
            return { data: res.protect_sites, success: true }
          } catch {
            return { data: [], success: false }
          }
        }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined aria-hidden="true" />}
            onClick={handleCreate}
            aria-label="创建新站点"
          >
            创建站点
          </Button>,
        ]}
      />

      <Modal
        title={editingId ? '编辑站点' : '创建站点'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={isMobile ? '100%' : 640}
        destroyOnClose
        aria-labelledby="site-modal-title"
        aria-describedby="site-modal-description"
      >
        <div id="site-modal-description" className="sr-only">
          {editingId ? '编辑现有站点的配置信息' : '创建新站点并配置相关参数'}
        </div>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ admin_state_up: true, front_timeout: 60, backend_timeout: 60 }}
        >
          <Form.Item
            name="name"
            label="站点名称"
            rules={[{ required: true, message: '请输入站点名称' }]}
          >
            <Input placeholder="请输入站点名称" />
          </Form.Item>
          <Form.Item
            name="domains"
            label="域名"
            rules={[{ required: true, message: '请输入域名' }]}
          >
            <TextArea rows={3} placeholder="请输入域名，多个域名换行分隔" />
          </Form.Item>
          <Form.Item name="domain_match" label="精确匹配域名" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="policy_id" label="关联策略">
            <Select allowClear placeholder="请选择策略" />
          </Form.Item>
          <Form.Item name="admin_state_up" label="管理状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Collapse
            ghost
            items={[
              {
                key: 'advanced',
                label: '高级配置',
                children: (
                  <>
                    <Form.Item name="forbidden_type" label="阻断页面类型">
                      <Select
                        onChange={v => setForbiddenType(v)}
                        options={[
                          { label: '默认阻断页', value: 'block' },
                          { label: '重定向', value: 'redirect' },
                        ]}
                      />
                    </Form.Item>
                    {forbiddenType === 'redirect' && (
                      <Form.Item name="redirect_url" label="重定向URL">
                        <Input placeholder="请输入重定向URL" />
                      </Form.Item>
                    )}
                    <Form.Item name="ip_src" label="IP来源">
                      <Select
                        allowClear
                        placeholder="请选择IP来源"
                        options={[
                          { label: 'remote_addr', value: 'remote_addr' },
                          { label: 'x-forwarded-for', value: 'x_forwarded_for' },
                          { label: 'x-real-ip', value: 'x_real_ip' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item name="log_level" label="日志等级">
                      <Select
                        allowClear
                        placeholder="请选择日志等级"
                        options={[
                          { label: '调试', value: 'debug' },
                          { label: '信息', value: 'info' },
                          { label: '警告', value: 'warn' },
                          { label: '错误', value: 'error' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item name="front_timeout" label="请求超时(秒)">
                      <InputNumber min={1} max={7200} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="backend_timeout" label="后端超时(秒)">
                      <InputNumber min={1} max={7200} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="front_keepalive" label="客户端长连接" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item
                      name="backend_keepalive"
                      label="服务端长连接"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                    <Form.Item name="check_request_body" label="请求体检测" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item
                      name="check_response_body"
                      label="响应体检测"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                    <Form.Item name="audit_status" label="访问审计" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item name="anti_virus" label="病毒防护" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item
                      name="server_info_hide"
                      label="服务器信息隐藏"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />
        </Form>
      </Modal>

      <Modal
        title={`部署站点 - ${deployingSite?.name || ''}`}
        open={deployModalVisible}
        onOk={handleDeployConfirm}
        onCancel={() => setDeployModalVisible(false)}
        okText="确认部署"
        cancelText="取消"
        width={480}
        destroyOnClose
        aria-labelledby="deploy-modal-title"
      >
        <p>即将下发 nginx + modsecurity 配置到在线实例，确认继续？</p>
      </Modal>
    </PageContainer>
  )
}

export default SiteList
