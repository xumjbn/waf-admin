import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PageContainer } from '@ant-design/pro-components'
import { createInstancePool, deleteInstancePool, listInstancePools, updateInstancePool } from '@/api/system'
import type { InstancePool } from '@/api/types/system'
import { useResponsive } from '@/hooks/useResponsive'

interface PoolFormValues {
  flavor: string
  capacity: number
  reserved: number
  description?: string
}

const InstancePools = () => {
  const responsive = useResponsive()
  const [pools, setPools] = useState<InstancePool[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<InstancePool | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm<PoolFormValues>()

  const reload = async () => {
    setLoading(true)
    try {
      const res = await listInstancePools()
      setPools(res.pools ?? [])
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
    setModalOpen(true)
  }

  const openEdit = (record: InstancePool) => {
    setEditing(record)
    form.setFieldsValue({
      flavor: record.flavor,
      capacity: record.capacity,
      reserved: record.reserved,
      description: record.description,
    })
    setModalOpen(true)
  }

  const submit = async () => {
    try {
      const v = await form.validateFields()
      if (editing) {
        await updateInstancePool(editing.id, v)
        message.success('资源池已更新')
      } else {
        await createInstancePool(v)
        message.success('资源池已创建')
      }
      setModalOpen(false)
      reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const remove = async (id: string) => {
    try {
      await deleteInstancePool(id)
      message.success('资源池已删除')
      reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const columns: ColumnsType<InstancePool> = [
    { title: '规格', dataIndex: 'flavor' },
    { title: '容量', dataIndex: 'capacity', width: 90 },
    { title: '使用中', dataIndex: 'used', width: 90 },
    { title: '保留', dataIndex: 'reserved', width: 90 },
    {
      title: '使用率',
      key: 'usage',
      width: 200,
      render: (_, record) => {
        const percent = record.capacity
          ? Math.round(((record.used + record.reserved) / record.capacity) * 100)
          : 0
        const status: 'normal' | 'success' | 'exception' =
          percent >= 90 ? 'exception' : percent >= 70 ? 'normal' : 'success'
        return <Progress percent={percent} status={status} size="small" />
      },
    },
    { title: '说明', dataIndex: 'description', ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <a onClick={() => openEdit(record)}>编辑</a>
          <Popconfirm
            title="确认删除此资源池?"
            description={record.used > 0 ? '资源池正在被使用,删除可能影响业务' : undefined}
            onConfirm={() => remove(record.id)}
          >
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const totalCapacity = pools.reduce((s, p) => s + p.capacity, 0)
  const totalUsed = pools.reduce((s, p) => s + p.used, 0)
  const totalReserved = pools.reduce((s, p) => s + p.reserved, 0)

  return (
    <PageContainer title="资源池配置" loading={loading}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <Statistic title="资源池总数" value={pools.length} suffix="个" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <Statistic title="总容量" value={totalCapacity} suffix="台" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <Statistic title="已占用 / 保留" value={`${totalUsed} / ${totalReserved}`} />
          </Card>
        </Col>
      </Row>

      <Card
        bordered={false}
        title="资源池列表"
        extra={
          <Button type="primary" onClick={openCreate}>
            新建资源池
          </Button>
        }
      >
        <Table<InstancePool>
          rowKey="id"
          columns={columns}
          dataSource={pools}
          pagination={false}
          scroll={responsive.tableScroll}
        />
      </Card>

      <Modal
        title={`${editing ? '编辑' : '新建'}资源池`}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        width={responsive.modalWidth}
        destroyOnClose
      >
        <Form form={form} layout={responsive.formLayout} preserve={false}>
          <Form.Item
            name="flavor"
            label="规格"
            rules={[{ required: true, message: '请输入规格,例如 standard.medium' }]}
          >
            <Input placeholder="standard.medium" />
          </Form.Item>
          <Form.Item
            name="capacity"
            label="容量"
            rules={[{ required: true, message: '请输入容量' }]}
          >
            <InputNumber min={1} max={1000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="reserved"
            label="保留台数"
            rules={[{ required: true, message: '请输入保留台数' }]}
          >
            <InputNumber min={0} max={1000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <Input.TextArea rows={2} placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default InstancePools
