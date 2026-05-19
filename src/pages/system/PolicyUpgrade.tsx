import { useEffect, useState } from 'react'
import { Alert, Button, Card, Form, Input, Modal, Space, Table, Tag, Upload, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { UploadProps } from 'antd'
import { CloudUploadOutlined, ReloadOutlined } from '@ant-design/icons'
import { PageContainer } from '@ant-design/pro-components'
import { getPolicyUpgradeLog, upgradePolicy } from '@/api/policy'
import { useResponsive } from '@/hooks/useResponsive'

interface UpgradeLogEntry {
  timestamp: string
  message: string
  version?: string
  status?: 'success' | 'failed'
}

const PolicyUpgrade = () => {
  const responsive = useResponsive()
  const [logs, setLogs] = useState<UpgradeLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm<{ url: string; description?: string }>()

  const reload = async () => {
    setLoading(true)
    try {
      const res = (await getPolicyUpgradeLog()) as { logs?: UpgradeLogEntry[] }
      setLogs(res?.logs ?? [])
    } catch {
      /* 已由拦截器提示 */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const submitUrl = async () => {
    try {
      const v = await form.validateFields()
      await upgradePolicy({ source: 'url', url: v.url, description: v.description })
      message.success('策略升级任务已下发')
      setModalOpen(false)
      form.resetFields()
      reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        // Mock 端不支持上传字段细节,使用 base64 模拟
        const reader = new FileReader()
        reader.readAsDataURL(file as Blob)
        await new Promise<void>(resolve => {
          reader.onload = () => resolve()
        })
        await upgradePolicy({
          source: 'file',
          name: (file as File).name,
          content_base64: (reader.result as string)?.split(',').pop() ?? '',
        })
        onSuccess?.({})
        message.success(`策略包已上传: ${(file as File).name}`)
        reload()
      } catch (e) {
        onError?.(e as Error)
      }
    },
  }

  const columns: ColumnsType<UpgradeLogEntry> = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    { title: '版本', dataIndex: 'version', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s?: string) =>
        s === 'failed' ? <Tag color="red">失败</Tag> : <Tag color="green">成功</Tag>,
    },
    { title: '消息', dataIndex: 'message' },
  ]

  return (
    <PageContainer
      title="策略升级"
      content={
        <Alert
          message="升级前请确保策略包来源可信,升级期间防护引擎将短暂重载,建议在业务低峰期执行。"
          type="info"
          showIcon
        />
      }
      loading={loading}
    >
      <Card
        bordered={false}
        title="升级方式"
        style={{ marginBottom: 16 }}
        extra={
          <Button icon={<ReloadOutlined />} onClick={reload}>
            刷新
          </Button>
        }
      >
        <Space size="middle" wrap>
          <Upload {...uploadProps}>
            <Button type="primary" icon={<CloudUploadOutlined />}>
              上传策略包文件
            </Button>
          </Upload>
          <Button onClick={() => setModalOpen(true)}>通过 URL 升级</Button>
        </Space>
      </Card>

      <Card bordered={false} title="升级日志">
        <Table<UpgradeLogEntry>
          rowKey={(_, idx) => `${idx}`}
          columns={columns}
          dataSource={logs}
          pagination={{ pageSize: responsive.isMobile ? 10 : 20 }}
          scroll={responsive.tableScroll}
        />
      </Card>

      <Modal
        title="通过 URL 升级"
        open={modalOpen}
        onOk={submitUrl}
        onCancel={() => setModalOpen(false)}
        width={responsive.modalWidth}
        destroyOnClose
      >
        <Form form={form} layout={responsive.formLayout} preserve={false}>
          <Form.Item
            name="url"
            label="策略包 URL"
            rules={[
              { required: true, message: '请输入 URL' },
              { type: 'url', message: '请输入合法 URL' },
            ]}
          >
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <Input.TextArea rows={3} placeholder="可选,记录本次升级目的" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default PolicyUpgrade
