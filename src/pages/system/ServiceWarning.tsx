import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PageContainer } from '@ant-design/pro-components'
import {
  createServiceWarning,
  deleteServiceWarning,
  listServiceWarnings,
  updateServiceWarning,
} from '@/api/system'
import type { ServiceWarning, ServiceWarningType } from '@/api/types/system'
import { useResponsive } from '@/hooks/useResponsive'

interface FormValues {
  name: string
  type: ServiceWarningType
  target: string
  threshold: number
  enabled: boolean
  notify_email?: string
}

const typeMeta: Record<ServiceWarningType, { label: string; unit: string; color: string }> = {
  site_down: { label: '站点掉线', unit: '次', color: 'red' },
  cert_expire: { label: '证书到期', unit: '天', color: 'orange' },
  cc_attack: { label: 'CC 攻击', unit: 'QPS', color: 'volcano' },
  qps_spike: { label: 'QPS 突增', unit: 'QPS', color: 'blue' },
}

const ServiceWarningPage = () => {
  const responsive = useResponsive()
  const [list, setList] = useState<ServiceWarning[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<ServiceWarning | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm<FormValues>()

  const reload = async () => {
    setLoading(true)
    try {
      const res = await listServiceWarnings()
      setList(res.warnings ?? [])
    } catch {
      /* 已由拦截器提示 */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ enabled: true, threshold: 1 })
    setModalOpen(true)
  }

  const openEdit = (record: ServiceWarning) => {
    setEditing(record)
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      target: record.target,
      threshold: record.threshold,
      enabled: record.enabled,
      notify_email: record.notify_email,
    })
    setModalOpen(true)
  }

  const submit = async () => {
    try {
      const v = await form.validateFields()
      if (editing) {
        await updateServiceWarning(editing.id, v)
        message.success('告警已更新')
      } else {
        await createServiceWarning(v)
        message.success('告警已创建')
      }
      setModalOpen(false)
      reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const remove = async (id: string) => {
    try {
      await deleteServiceWarning(id)
      message.success('已删除')
      reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const toggle = async (record: ServiceWarning) => {
    try {
      await updateServiceWarning(record.id, { ...record, enabled: !record.enabled })
      reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ColumnsType<ServiceWarning> = [
    { title: '告警名称', dataIndex: 'name' },
    {
      title: '类型',
      dataIndex: 'type',
      width: 140,
      render: (t: ServiceWarningType) => <Tag color={typeMeta[t].color}>{typeMeta[t].label}</Tag>,
    },
    { title: '目标', dataIndex: 'target' },
    {
      title: '阈值',
      dataIndex: 'threshold',
      width: 120,
      render: (v: number, record) => `${v} ${typeMeta[record.type].unit}`,
    },
    { title: '通知邮箱', dataIndex: 'notify_email', ellipsis: true },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 90,
      render: (enabled: boolean, record) => (
        <Switch checked={enabled} onChange={() => toggle(record)} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <a onClick={() => openEdit(record)}>编辑</a>
          <Popconfirm title="确认删除此告警?" onConfirm={() => remove(record.id)}>
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <PageContainer title="业务告警" loading={loading}>
      <Card
        bordered={false}
        title="告警规则"
        extra={
          <Button type="primary" onClick={openCreate}>
            新建告警
          </Button>
        }
      >
        <Table<ServiceWarning>
          rowKey="id"
          columns={columns}
          dataSource={list}
          pagination={{ pageSize: responsive.isMobile ? 10 : 20 }}
          scroll={responsive.tableScroll}
        />
      </Card>

      <Modal
        title={`${editing ? '编辑' : '新建'}业务告警`}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        width={responsive.modalWidth}
        destroyOnClose
      >
        <Form form={form} layout={responsive.formLayout} preserve={false}>
          <Form.Item
            name="name"
            label="告警名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="例如 主站点掉线告警" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select
              options={(Object.keys(typeMeta) as ServiceWarningType[]).map(k => ({
                label: typeMeta[k].label,
                value: k,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="target"
            label="目标"
            rules={[{ required: true, message: '请输入目标(站点/域名等)' }]}
          >
            <Input placeholder="例如 www.example.com 或 全部站点" />
          </Form.Item>
          <Form.Item
            name="threshold"
            label="阈值"
            rules={[{ required: true, message: '请输入阈值' }]}
          >
            <InputNumber min={0} max={1000000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="notify_email"
            label="通知邮箱"
            rules={[{ type: 'email', message: '请输入合法邮箱' }]}
          >
            <Input placeholder="ops@example.com" />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default ServiceWarningPage
