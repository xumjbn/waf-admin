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
  Tabs,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PageContainer } from '@ant-design/pro-components'
import {
  createInstanceWarning,
  createInstancemWarning,
  deleteInstanceWarning,
  deleteInstancemWarning,
  listInstanceWarnings,
  listInstancemWarnings,
  updateInstanceWarning,
  updateInstancemWarning,
} from '@/api/system'
import type { MonitorWarning } from '@/api/types/system'
import { useResponsive } from '@/hooks/useResponsive'

type Scope = 'manager' | 'instance'

interface WarningFormValues {
  name: string
  type: string
  threshold: number
  enabled: boolean
}

const typeOptions = [
  { label: 'CPU 使用率 (%)', value: 'cpu' },
  { label: '内存使用率 (%)', value: 'memory' },
  { label: '磁盘使用率 (%)', value: 'disk' },
  { label: '网络流入速率 (Mbps)', value: 'net_in' },
  { label: '网络流出速率 (Mbps)', value: 'net_out' },
  { label: '连接数', value: 'connections' },
]

const typeLabel = (t: string) => typeOptions.find(o => o.value === t)?.label ?? t

const MonitorWarning = () => {
  const responsive = useResponsive()
  const [scope, setScope] = useState<Scope>('manager')
  const [manager, setInstancem] = useState<MonitorWarning[]>([])
  const [instanceList, setInstanceList] = useState<MonitorWarning[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<MonitorWarning | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm<WarningFormValues>()

  const list = scope === 'manager' ? manager : instanceList

  const reload = async () => {
    setLoading(true)
    try {
      const [a, b] = await Promise.all([listInstancemWarnings(), listInstanceWarnings()])
      setInstancem(a.warnings ?? [])
      setInstanceList(b.warnings ?? [])
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
    form.setFieldsValue({ enabled: true })
    setModalOpen(true)
  }

  const openEdit = (record: MonitorWarning) => {
    setEditing(record)
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      threshold: record.threshold,
      enabled: record.enabled,
    })
    setModalOpen(true)
  }

  const submit = async () => {
    try {
      const values = await form.validateFields()
      if (scope === 'manager') {
        if (editing) await updateInstancemWarning(editing.id, values)
        else await createInstancemWarning(values)
      } else {
        if (editing) await updateInstanceWarning(editing.id, values)
        else await createInstanceWarning(values)
      }
      message.success(editing ? '已更新' : '已创建')
      setModalOpen(false)
      reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const remove = async (id: string) => {
    try {
      if (scope === 'manager') await deleteInstancemWarning(id)
      else await deleteInstanceWarning(id)
      message.success('已删除')
      reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const toggle = async (record: MonitorWarning) => {
    try {
      const next = { ...record, enabled: !record.enabled }
      if (scope === 'manager') await updateInstancemWarning(record.id, next)
      else await updateInstanceWarning(record.id, next)
      reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ColumnsType<MonitorWarning> = [
    { title: '告警名称', dataIndex: 'name' },
    {
      title: '类型',
      dataIndex: 'type',
      width: 200,
      render: (t: string) => typeLabel(t),
    },
    {
      title: '阈值',
      dataIndex: 'threshold',
      width: 100,
      render: (v: number, record) => {
        const unit = ['cpu', 'memory', 'disk'].includes(record.type)
          ? '%'
          : record.type.startsWith('net_')
            ? ' Mbps'
            : ''
        return `${v}${unit}`
      },
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 120,
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
    <PageContainer title="监控告警" loading={loading}>
      <Card bordered={false}>
        <Tabs
          activeKey={scope}
          onChange={k => setScope(k as Scope)}
          tabBarExtraContent={
            <Button type="primary" onClick={openCreate}>
              新建告警
            </Button>
          }
          items={[
            {
              key: 'manager',
              label: `管理节点 (${manager.length})`,
              children: (
                <Table<MonitorWarning>
                  rowKey="id"
                  columns={columns}
                  dataSource={list}
                  pagination={{ pageSize: responsive.isMobile ? 10 : 20 }}
                  scroll={responsive.tableScroll}
                />
              ),
            },
            {
              key: 'instance',
              label: `防护节点 (${instanceList.length})`,
              children: (
                <Table<MonitorWarning>
                  rowKey="id"
                  columns={columns}
                  dataSource={list}
                  pagination={{ pageSize: responsive.isMobile ? 10 : 20 }}
                  scroll={responsive.tableScroll}
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={`${editing ? '编辑' : '新建'}${scope === 'manager' ? ' 管理节点' : ' 实例'} 告警`}
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
            <Input placeholder="例如 CPU 使用率告警" />
          </Form.Item>
          <Form.Item
            name="type"
            label="监控类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select options={typeOptions} placeholder="选择监控类型" />
          </Form.Item>
          <Form.Item
            name="threshold"
            label="阈值"
            rules={[{ required: true, message: '请输入阈值' }]}
          >
            <InputNumber min={0} max={100000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default MonitorWarning
