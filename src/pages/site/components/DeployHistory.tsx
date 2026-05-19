import { useRef } from 'react'
import { ProTable } from '@ant-design/pro-components'
import type { ProColumns, ActionType } from '@ant-design/pro-components'
import { Tag, Modal, Descriptions } from 'antd'
import { useState } from 'react'
import { listSiteDeployments, getDeployment } from '@/api/deploy'
import type { DeploymentItem, DeploymentDetail, NodeDeployStatus } from '@/api/types/deploy'

const TYPE_MAP: Record<string, string> = { full: '全量', site: '站点', policy: '策略' }

const DeployHistory = ({ siteId }: { siteId: string }) => {
  const actionRef = useRef<ActionType>()
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentDeploy, setCurrentDeploy] = useState<DeploymentDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const showDetail = async (record: DeploymentItem) => {
    setDetailLoading(true)
    setDetailVisible(true)
    try {
      const { deployment } = await getDeployment(record.id)
      setCurrentDeploy(deployment)
    } catch {
      /* ignore */
    } finally {
      setDetailLoading(false)
    }
  }

  const STATUS_TAG: Record<string, { color: string; text: string }> = {
    success: { color: 'green', text: '成功' },
    pending: { color: 'blue', text: '待部署' },
    failed: { color: 'red', text: '失败' },
  }

  const columns: ProColumns<DeploymentItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '版本号', dataIndex: 'config_version', width: 160, ellipsis: true },
    {
      title: '类型',
      dataIndex: 'deploy_type',
      width: 80,
      render: (_, r) => <Tag>{TYPE_MAP[r.deploy_type] || r.deploy_type}</Tag>,
    },
    { title: '操作人', dataIndex: 'operator_name', width: 100 },
    { title: '时间', dataIndex: 'created_at', valueType: 'dateTime', width: 180 },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="detail" onClick={() => showDetail(record)}>
          详情
        </a>,
      ],
    },
  ]

  return (
    <>
      <ProTable<DeploymentItem>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        search={false}
        pagination={{ pageSize: 10 }}
        request={async params => {
          try {
            const res = await listSiteDeployments(
              siteId,
              (params as any).current || 1,
              (params as any).pageSize || 10,
            )
            return { data: res.data, success: true, total: res.total }
          } catch {
            return { data: [], success: false }
          }
        }}
      />

      <Modal
        title="部署详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
        loading={detailLoading}
      >
        {currentDeploy && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="站点">{currentDeploy.site_name}</Descriptions.Item>
              <Descriptions.Item label="域名">{currentDeploy.site_domain}</Descriptions.Item>
              <Descriptions.Item label="版本">{currentDeploy.config_version}</Descriptions.Item>
              <Descriptions.Item label="类型">
                <Tag>{TYPE_MAP[currentDeploy.deploy_type] || currentDeploy.deploy_type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="操作人">{currentDeploy.operator_name}</Descriptions.Item>
              <Descriptions.Item label="时间">{currentDeploy.created_at}</Descriptions.Item>
            </Descriptions>

            <h4>节点状态</h4>
            {currentDeploy.node_statuses?.length ? (
              <ul>
                {currentDeploy.node_statuses.map((ns: NodeDeployStatus) => {
                  const s = STATUS_TAG[ns.status] || { color: 'default', text: ns.status }
                  return (
                    <li key={ns.id}>
                      {ns.node_hostname}：<Tag color={s.color}>{s.text}</Tag>
                      {ns.message && <span style={{ color: '#888' }}>{ns.message}</span>}
                      {ns.applied_at && <span style={{ marginLeft: 8 }}>{ns.applied_at}</span>}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p style={{ color: '#888' }}>暂无节点状态</p>
            )}
          </>
        )}
      </Modal>
    </>
  )
}

export default DeployHistory
