import { useEffect, useState } from 'react'
import { Card, Tag, Button, Modal, Form, DatePicker, message, Row, Col } from 'antd'
import { PageContainer } from '@ant-design/pro-components'
import {
  CloudServerOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  ApiOutlined,
  SwapOutlined,
  DatabaseOutlined,
  HddOutlined,
} from '@ant-design/icons'
import MetricChart from '@/components/MetricChart'
import { useSystemMonitorStore } from '@/store/systemMonitor'
import dayjs, { type Dayjs } from 'dayjs'
import {
  getSystemResource,
  getNicState,
  getAllTime,
  getInstances,
  getRunningMode,
  changeInstancemTime,
  changeInstanceTime,
} from '@/api/aggregation'
import type {
  SystemResource,
  NicInterface,
  InstanceMonitorData,
  RunningMode,
} from '@/api/types/aggregation'

const REFRESH_INTERVAL_MS = 5000

interface NormalizedData {
  manager: { resources: SystemResource; interfaces: NicInterface[]; datetime: string } | null
  instances: InstanceMonitorData[]
}

interface NodeCardProps {
  title: string
  instanceId: string | null
  resources: SystemResource
  interfaces: NicInterface[]
  datetime: string
  onChangeTime: (instanceId: string | null) => void
}

const NodeCard = ({
  title,
  instanceId,
  resources,
  interfaces,
  datetime,
  onChangeTime,
}: NodeCardProps) => {
  const nodeId = instanceId ?? 'manager'
  const history = useSystemMonitorStore(
    s => s.nodes[nodeId] ?? { timestamps: [], cpu: [], memory: [], disk: [] },
  )

  return (
    <Card
      key={nodeId}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CloudServerOutlined style={{ fontSize: 18, color: '#0066ff' }} />
          <span>{title}</span>
        </div>
      }
      bordered={false}
      style={{
        marginBottom: 16,
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
      extra={
        <Button size="small" type="primary" onClick={() => onChangeTime(instanceId)}>
          修改时间
        </Button>
      }
    >
      {/* 系统信息栏 */}
      <Card
        bordered={false}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          marginBottom: 16,
          borderRadius: 8,
        }}
      >
        <Row gutter={[16, 12]}>
          <Col xs={24} sm={12} md={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClockCircleOutlined style={{ fontSize: 20, color: '#fff' }} />
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 2 }}>
                  系统时间
                </div>
                <div
                  style={{ fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'monospace' }}
                >
                  {datetime || '-'}
                </div>
              </div>
            </div>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ApiOutlined style={{ fontSize: 20, color: '#fff' }} />
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 2 }}>
                  连接数
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#fff',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {resources.net_connections ?? '-'}
                </div>
              </div>
            </div>
          </Col>
          <Col xs={12} sm={6} md={5}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SwapOutlined style={{ fontSize: 20, color: '#fff' }} />
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 2 }}>
                  网络 I/O
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#fff',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {resources.network_io ?? '-'}
                </div>
              </div>
            </div>
          </Col>
          <Col xs={12} sm={6} md={5}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DatabaseOutlined style={{ fontSize: 20, color: '#fff' }} />
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 2 }}>
                  内存总量
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#fff',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {String(resources.memory_total ?? '-')}
                </div>
              </div>
            </div>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <HddOutlined style={{ fontSize: 20, color: '#fff' }} />
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 2 }}>
                  磁盘总量
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#fff',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {String(resources.disk_total ?? '-')}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 图表行 */}
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ background: '#fafafa', borderRadius: 8 }}>
            <MetricChart
              title="CPU 使用率"
              data={history.cpu}
              timestamps={history.timestamps}
              color="#0066ff"
              height={180}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ background: '#fafafa', borderRadius: 8 }}>
            <MetricChart
              title="内存使用率"
              data={history.memory}
              timestamps={history.timestamps}
              color="#00c853"
              height={180}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ background: '#fafafa', borderRadius: 8 }}>
            <MetricChart
              title="磁盘使用率"
              data={history.disk}
              timestamps={history.timestamps}
              color="#ff9800"
              height={180}
            />
          </Card>
        </Col>
      </Row>

      {/* 网络接口状态 */}
      {interfaces.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {interfaces.map(it => (
            <Tag
              key={it.name}
              color={it.state === 'up' ? 'success' : 'error'}
              style={{ fontWeight: 500 }}
            >
              {it.name}: {it.state}
            </Tag>
          ))}
        </div>
      )}
    </Card>
  )
}

const SystemMonitor = () => {
  const [mode, setMode] = useState<RunningMode['running_mode']>('standalone')
  const [data, setData] = useState<NormalizedData>({ manager: null, instances: [] })
  const [timeModal, setTimeModal] = useState<{ open: boolean; instanceId: string | null }>({
    open: false,
    instanceId: null,
  })
  const [form] = Form.useForm<{ new_time: Dayjs }>()

  const load = async () => {
    try {
      const [resources, nic, times, runMode, instancesRes] = await Promise.all([
        getSystemResource(),
        getNicState() as unknown as Promise<
          Record<string, NicInterface[] | { [id: string]: NicInterface[] }>
        >,
        getAllTime(),
        getRunningMode(),
        getInstances(),
      ])
      setMode(runMode.running_mode)

      const resAny = resources as unknown as {
        manager?: SystemResource
        instance?: Array<Record<string, SystemResource>>
      }
      const managerInterfaces = (nic as { manager?: NicInterface[] }).manager ?? []
      const instancesInterfaces =
        (nic as unknown as { instances?: Record<string, NicInterface[]> }).instances ?? {}

      const instanceList = instancesRes.instances ?? []
      const normalizedInstances: InstanceMonitorData[] = instanceList.map(inst => {
        const matched = (resAny.instance ?? []).find(d => inst.id in d)
        return {
          id: inst.id,
          name: inst.name,
          system_resources: (matched?.[inst.id] as SystemResource) ?? ({} as SystemResource),
          interfaces: instancesInterfaces[inst.id] ?? [],
          datetime: (times as Record<string, string>)[inst.id] ?? '',
        }
      })

      setData({
        manager:
          resAny.manager && managerInterfaces
            ? {
                resources: resAny.manager,
                interfaces: managerInterfaces,
                datetime: (times as Record<string, string>).manager ?? '',
              }
            : null,
        instances: normalizedInstances,
      })

      // Push data to store for chart history
      if (resAny.manager) {
        useSystemMonitorStore
          .getState()
          .push(
            'manager',
            resAny.manager.cpu_percent,
            resAny.manager.memory_percent,
            resAny.manager.disk_percent,
          )
      }
      normalizedInstances.forEach(inst => {
        useSystemMonitorStore
          .getState()
          .push(
            inst.id,
            inst.system_resources.cpu_percent,
            inst.system_resources.memory_percent,
            inst.system_resources.disk_percent,
          )
      })
    } catch {
      /* 拦截器已提示 */
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
    const timer = setInterval(load, REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  const onChangeTime = async () => {
    try {
      const { new_time } = await form.validateFields()
      const timeStr = new_time.format('YYYY-MM-DD HH:mm:ss')
      if (timeModal.instanceId) {
        await changeInstanceTime(timeModal.instanceId, timeStr)
      } else {
        await changeInstancemTime(timeStr)
      }
      message.success('时间修改成功')
      setTimeModal({ open: false, instanceId: null })
      form.resetFields()
      load()
    } catch {
      /* 拦截器已提示 */
    }
  }

  return (
    <PageContainer
      title="系统监控"
      subTitle={`运行模式: ${mode}`}
      extra={
        <Tag color="processing" icon={<ThunderboltOutlined />}>
          实时监控
        </Tag>
      }
    >
      {data.manager && (
        <NodeCard
          title="管理节点 管理节点"
          instanceId={null}
          resources={data.manager.resources}
          interfaces={data.manager.interfaces}
          datetime={data.manager.datetime}
          onChangeTime={instanceId => setTimeModal({ open: true, instanceId })}
        />
      )}
      {data.instances.map(inst => (
        <NodeCard
          key={inst.id}
          title={inst.name}
          instanceId={inst.id}
          resources={inst.system_resources}
          interfaces={inst.interfaces}
          datetime={inst.datetime}
          onChangeTime={instanceId => setTimeModal({ open: true, instanceId })}
        />
      ))}

      <Modal
        title="修改系统时间"
        open={timeModal.open}
        onOk={onChangeTime}
        onCancel={() => {
          setTimeModal({ open: false, instanceId: null })
          form.resetFields()
        }}
      >
        <Form form={form} initialValues={{ new_time: dayjs() }}>
          <Form.Item
            name="new_time"
            label="时间"
            rules={[{ required: true, message: '请选择时间' }]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default SystemMonitor
