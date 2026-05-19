import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Upload,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { UploadProps } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { PageContainer } from '@ant-design/pro-components'
import {
  deleteUpgradePackage,
  getUpgradeInfo,
  rollbackInstance,
  rollbackInstancem,
  upgradeInstance,
  upgradeInstancem,
  uploadUpgradePackage,
} from '@/api/system'
import type { UpgradableNode, UpgradeInfo, UpgradePackage, UpgradeTarget } from '@/api/types/system'
import { useResponsive } from '@/hooks/useResponsive'

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const modeLabel: Record<UpgradeInfo['mode'], string> = {
  standalone: '单机',
  cluster: '集群',
  ha: '高可用',
}

const targetLabel: Record<UpgradeTarget, string> = {
  manager: '管理节点 管理节点',
  instance: '实例 防护节点',
}

const statusTag: Record<UpgradableNode['status'], { color: string; text: string }> = {
  idle: { color: 'default', text: '空闲' },
  upgrading: { color: 'processing', text: '升级中' },
  failed: { color: 'red', text: '失败' },
  rollback: { color: 'orange', text: '已回滚' },
}

const SystemUpgrade = () => {
  const responsive = useResponsive()
  const [info, setInfo] = useState<UpgradeInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadTarget, setUploadTarget] = useState<UpgradeTarget>('manager')
  const [managerModalOpen, setInstancemModalOpen] = useState(false)
  const [instanceModalOpen, setInstanceModalOpen] = useState(false)
  const [managerForm] = Form.useForm<{ package_id: string }>()
  const [instanceForm] = Form.useForm<{ package_id: string; node_ids: string[] }>()

  const reload = async () => {
    setLoading(true)
    try {
      const res = await getUpgradeInfo()
      setInfo(res)
    } catch {
      /* 已由拦截器提示 */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      const fd = new FormData()
      fd.append('file', file as Blob)
      fd.append('target', uploadTarget)
      try {
        const pkg = await uploadUpgradePackage(fd)
        onSuccess?.(pkg)
        message.success(`升级包已上传: ${pkg.name}`)
        reload()
      } catch (e) {
        onError?.(e as Error)
      }
    },
  }

  const removePackage = async (id: string) => {
    try {
      await deleteUpgradePackage(id)
      message.success('升级包已删除')
      reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const submitInstancem = async () => {
    try {
      const v = await managerForm.validateFields()
      await upgradeInstancem({ package_id: v.package_id })
      message.success('管理节点 升级任务已下发')
      setInstancemModalOpen(false)
      managerForm.resetFields()
      reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const submitInstance = async () => {
    try {
      const v = await instanceForm.validateFields()
      await upgradeInstance({ package_id: v.package_id, node_ids: v.node_ids })
      message.success(`实例 升级任务已下发(${v.node_ids.length} 节点)`)
      setInstanceModalOpen(false)
      instanceForm.resetFields()
      reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const doRollbackInstancem = async () => {
    try {
      await rollbackInstancem()
      message.success('管理节点 回滚已下发')
      reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const doRollbackInstance = async (ids: string[]) => {
    try {
      await rollbackInstance({ node_ids: ids })
      message.success(`实例 回滚已下发(${ids.length} 节点)`)
      reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const packageColumns: ColumnsType<UpgradePackage> = [
    { title: '包名', dataIndex: 'name', ellipsis: true },
    {
      title: '目标',
      dataIndex: 'target',
      width: 120,
      render: (t: UpgradeTarget) =>
        t === 'manager' ? <Tag color="blue">管理节点</Tag> : <Tag color="purple">实例</Tag>,
    },
    { title: '版本', dataIndex: 'version', width: 110 },
    {
      title: '大小',
      dataIndex: 'size',
      width: 100,
      render: (s: number) => formatBytes(s),
    },
    {
      title: '上传时间',
      dataIndex: 'uploaded_at',
      width: 180,
      render: (s: string) => new Date(s).toLocaleString(),
    },
    { title: '说明', dataIndex: 'description', ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Popconfirm title="确认删除此升级包?" onConfirm={() => removePackage(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>
      ),
    },
  ]

  const instanceNodes = (info?.nodes ?? []).filter(n => n.type === 'instance')

  const nodeColumns: ColumnsType<UpgradableNode> = [
    { title: '节点', dataIndex: 'name' },
    {
      title: '类型',
      dataIndex: 'type',
      width: 120,
      render: (t: UpgradeTarget) => targetLabel[t],
    },
    { title: '当前版本', dataIndex: 'current_version', width: 130 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (s: UpgradableNode['status']) => (
        <Tag color={statusTag[s].color}>{statusTag[s].text}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Popconfirm title={`确认回滚 ${record.name}?`} onConfirm={() => doRollbackInstance([record.id])}>
          <a>回滚</a>
        </Popconfirm>
      ),
    },
  ]

  const managerPackages = (info?.packages ?? []).filter(p => p.target === 'manager')
  const instancePackages = (info?.packages ?? []).filter(p => p.target === 'instance')

  return (
    <PageContainer
      title="系统升级"
      content={
        <Alert
          message="升级前请务必备份系统配置,并选择业务低峰期执行。升级过程中,网关将短暂中断。"
          type="warning"
          showIcon
        />
      }
      loading={loading}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <Statistic title="运行模式" value={info ? modeLabel[info.mode] : '-'} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <Statistic title="管理节点 当前版本" value={info?.manager_version ?? '-'} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <Statistic title="实例 节点数" value={instanceNodes.length} suffix="台" />
          </Card>
        </Col>
      </Row>

      <Card
        bordered={false}
        title="升级包"
        style={{ marginBottom: 16 }}
        extra={
          <Space wrap>
            <Select
              value={uploadTarget}
              onChange={setUploadTarget}
              options={[
                { label: '管理节点 包', value: 'manager' },
                { label: '实例 包', value: 'instance' },
              ]}
              style={{ width: 130 }}
            />
            <Upload {...uploadProps}>
              <Button type="primary" icon={<InboxOutlined />}>
                上传升级包
              </Button>
            </Upload>
          </Space>
        }
      >
        <Table<UpgradePackage>
          rowKey="id"
          columns={packageColumns}
          dataSource={info?.packages ?? []}
          pagination={false}
          scroll={responsive.tableScroll}
          size="middle"
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            title="管理节点 管理节点"
            extra={
              <Space>
                <Button
                  type="primary"
                  onClick={() => setInstancemModalOpen(true)}
                  disabled={managerPackages.length === 0}
                >
                  升级 管理节点
                </Button>
                <Popconfirm title="确认回滚 管理节点 到上一版本?" onConfirm={doRollbackInstancem}>
                  <Button>回滚 管理节点</Button>
                </Popconfirm>
              </Space>
            }
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="当前版本">{info?.manager_version ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="可选升级包数量">{managerPackages.length}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            title="实例 防护节点"
            extra={
              <Button
                type="primary"
                onClick={() => setInstanceModalOpen(true)}
                disabled={instancePackages.length === 0 || instanceNodes.length === 0}
              >
                批量升级 实例
              </Button>
            }
          >
            <Table<UpgradableNode>
              rowKey="id"
              columns={nodeColumns}
              dataSource={instanceNodes}
              pagination={false}
              size="small"
              scroll={responsive.tableScroll}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="升级 管理节点"
        open={managerModalOpen}
        onOk={submitInstancem}
        onCancel={() => setInstancemModalOpen(false)}
        width={responsive.modalWidth}
        destroyOnClose
      >
        <Form form={managerForm} layout={responsive.formLayout} preserve={false}>
          <Form.Item
            name="package_id"
            label="选择升级包"
            rules={[{ required: true, message: '请选择升级包' }]}
          >
            <Select
              placeholder="请选择"
              options={managerPackages.map(p => ({
                label: `${p.name} (v${p.version})`,
                value: p.id,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量升级 实例"
        open={instanceModalOpen}
        onOk={submitInstance}
        onCancel={() => setInstanceModalOpen(false)}
        width={responsive.modalWidth}
        destroyOnClose
      >
        <Form form={instanceForm} layout={responsive.formLayout} preserve={false}>
          <Form.Item
            name="package_id"
            label="选择升级包"
            rules={[{ required: true, message: '请选择升级包' }]}
          >
            <Select
              placeholder="请选择"
              options={instancePackages.map(p => ({
                label: `${p.name} (v${p.version})`,
                value: p.id,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="node_ids"
            label="目标节点"
            rules={[{ required: true, message: '请至少选择一个节点' }]}
          >
            <Select
              mode="multiple"
              placeholder="选择需要升级的 实例 节点"
              options={instanceNodes.map(n => ({
                label: `${n.name} (当前 v${n.current_version})`,
                value: n.id,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default SystemUpgrade
