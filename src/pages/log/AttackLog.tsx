import { useRef, useState } from 'react'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tag,
  Popconfirm,
  message,
  Descriptions,
  Grid,
} from 'antd'
import { SearchOutlined, ExportOutlined, DeleteOutlined } from '@ant-design/icons'
import { listAttackLogs, exportAttackLogs, clearAttackLogs } from '@/api/log'
import type { AttackLog as AttackLogType } from '@/api/types/log'
import { downloadBlob } from '@/utils/download'

const { RangePicker } = DatePicker
const { useBreakpoint } = Grid

const severityMap = {
  low: { text: '低', color: 'blue' },
  medium: { text: '中', color: 'orange' },
  high: { text: '高', color: 'red' },
  critical: { text: '严重', color: 'purple' },
}

const actionMap = {
  block: { text: '阻断', color: 'red' },
  allow: { text: '放行', color: 'green' },
  log: { text: '记录', color: 'default' },
}

const AttackLog = () => {
  const actionRef = useRef<ActionType>()
  const [searchModalVisible, setSearchModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AttackLogType | null>(null)
  const [searchForm] = Form.useForm()
  const screens = useBreakpoint()
  const isMobile = screens.xs || screens.sm

  const handleExport = async () => {
    try {
      const blob = await exportAttackLogs()
      downloadBlob(blob, `attack_logs_${Date.now()}.csv`)
      message.success('导出成功')
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleClear = async () => {
    try {
      await clearAttackLogs()
      message.success('清空成功')
      actionRef.current?.reload()
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleSearch = async () => {
    try {
      await searchForm.validateFields()
      actionRef.current?.reload()
      setSearchModalVisible(false)
    } catch {
      /* 已由拦截器提示 */
    }
  }

  const handleRowClick = (record: AttackLogType) => {
    setSelectedLog(record)
    setDetailModalVisible(true)
  }

  const columns: ProColumns<AttackLogType>[] = [
    { title: '时间', dataIndex: 'datetime', width: 180, fixed: isMobile ? undefined : 'left' },
    { title: '源IP', dataIndex: 'src_ip', width: 140 },
    { title: '目标IP', dataIndex: 'dst_ip', width: 140, hideInTable: isMobile },
    { title: '主机', dataIndex: 'host', ellipsis: true, hideInTable: isMobile },
    { title: 'URL', dataIndex: 'url', ellipsis: true, hideInTable: isMobile },
    {
      title: '动作',
      dataIndex: 'action',
      width: 80,
      render: (_, record) => {
        const config = actionMap[record.action as keyof typeof actionMap] || {
          text: record.action,
          color: 'default',
        }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      width: 100,
      render: (_, record) => {
        const config = severityMap[record.severity as keyof typeof severityMap] ?? {
          text: record.severity,
          color: 'default',
        }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    { title: '规则名称', dataIndex: 'rule_name', ellipsis: true, hideInTable: isMobile },
  ]

  return (
    <PageContainer>
      <ProTable<AttackLogType>
        columns={columns}
        actionRef={actionRef}
        request={async params => {
          const res = await listAttackLogs(params)
          return { data: res.attack_logs ?? [], success: true }
        }}
        rowKey="id"
        pagination={{ defaultPageSize: isMobile ? 10 : 20 }}
        search={false}
        scroll={{ x: 'max-content' }}
        onRow={record => ({
          onClick: () => handleRowClick(record),
          style: { cursor: 'pointer' },
        })}
        toolBarRender={() => [
          <Button
            key="search"
            icon={<SearchOutlined />}
            onClick={() => setSearchModalVisible(true)}
          >
            高级搜索
          </Button>,
          <Button key="export" icon={<ExportOutlined />} onClick={handleExport}>
            导出
          </Button>,
          <Popconfirm key="clear" title="确定清空所有攻击日志吗？" onConfirm={handleClear}>
            <Button icon={<DeleteOutlined />} danger>
              清空
            </Button>
          </Popconfirm>,
        ]}
      />

      <Modal
        title="高级搜索"
        open={searchModalVisible}
        onOk={handleSearch}
        onCancel={() => setSearchModalVisible(false)}
        width={isMobile ? '100%' : 600}
      >
        <Form form={searchForm} layout="vertical">
          <Form.Item label="源IP" name="src_ip">
            <Input placeholder="请输入源IP" />
          </Form.Item>
          <Form.Item label="主机" name="host">
            <Input placeholder="请输入主机" />
          </Form.Item>
          <Form.Item label="严重程度" name="severity">
            <Select placeholder="请选择严重程度" allowClear>
              <Select.Option value="low">低</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="critical">严重</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="URI" name="uri">
            <Input placeholder="请输入URI" />
          </Form.Item>
          <Form.Item label="动作" name="action">
            <Select placeholder="请选择动作" allowClear>
              <Select.Option value="block">阻断</Select.Option>
              <Select.Option value="allow">放行</Select.Option>
              <Select.Option value="log">记录</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="目标端口" name="dst_port">
            <Input placeholder="请输入目标端口" />
          </Form.Item>
          <Form.Item label="规则ID" name="rule_id">
            <Input placeholder="请输入规则ID" />
          </Form.Item>
          <Form.Item label="时间范围" name="datetime">
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="攻击日志详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={isMobile ? '100%' : 800}
      >
        {selectedLog && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="时间" span={2}>
              {selectedLog.datetime}
            </Descriptions.Item>
            <Descriptions.Item label="源IP">{selectedLog.src_ip}</Descriptions.Item>
            <Descriptions.Item label="源端口">{selectedLog.src_port}</Descriptions.Item>
            <Descriptions.Item label="目标IP">{selectedLog.dst_ip}</Descriptions.Item>
            <Descriptions.Item label="目标端口">{selectedLog.dst_port}</Descriptions.Item>
            <Descriptions.Item label="主机" span={2}>
              {selectedLog.host}
            </Descriptions.Item>
            <Descriptions.Item label="URL" span={2}>
              {selectedLog.url}
            </Descriptions.Item>
            <Descriptions.Item label="协议">{selectedLog.protocol}</Descriptions.Item>
            <Descriptions.Item label="方法">{selectedLog.method}</Descriptions.Item>
            <Descriptions.Item label="动作">
              <Tag color={actionMap[selectedLog.action as keyof typeof actionMap]?.color}>
                {actionMap[selectedLog.action as keyof typeof actionMap]?.text ||
                  selectedLog.action}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="严重程度">
              <Tag color={severityMap[selectedLog.severity].color}>
                {severityMap[selectedLog.severity].text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="规则ID">{selectedLog.rule_id}</Descriptions.Item>
            <Descriptions.Item label="规则名称">{selectedLog.rule_name}</Descriptions.Item>
            <Descriptions.Item label="分类" span={2}>
              {selectedLog.category}
            </Descriptions.Item>
            {selectedLog.src_geo && (
              <Descriptions.Item label="源地理位置">{selectedLog.src_geo}</Descriptions.Item>
            )}
            {selectedLog.dst_geo && (
              <Descriptions.Item label="目标地理位置">{selectedLog.dst_geo}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </PageContainer>
  )
}

export default AttackLog
