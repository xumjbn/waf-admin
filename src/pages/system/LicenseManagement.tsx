import { useState, useEffect, useCallback } from 'react'
import { PageContainer } from '@ant-design/pro-components'
import { Tabs, Descriptions, Button, Upload, Tag, Spin, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { listLicenses, createLicense } from '@/api/system'
import type { License } from '@/api/types/system'

const STATUS_MAP: Record<string, { color: string; text: string }> = {
  active: { color: 'green', text: '有效' },
  expired: { color: 'red', text: '已过期' },
  inactive: { color: 'default', text: '未激活' },
}

const LicenseManagement = () => {
  const [loading, setLoading] = useState(false)
  const [licenses, setLicenses] = useState<License[]>([])

  const loadLicenses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listLicenses()
      setLicenses(res.licenses)
    } catch {
      /* 已由拦截器提示 */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLicenses()
  }, [loadLicenses])

  const getUploadProps = (type: string): UploadProps => ({
    showUploadList: false,
    beforeUpload: async file => {
      const isValidType =
        file.name.endsWith('.lic') ||
        file.type === 'application/octet-stream' ||
        file.type === 'text/plain'
      const isValidSize = file.size / 1024 / 1024 < 10
      if (!isValidType) {
        message.error('只支持 .lic 格式的许可证文件')
        return Upload.LIST_IGNORE
      }
      if (!isValidSize) {
        message.error('文件大小不能超过 10MB')
        return Upload.LIST_IGNORE
      }
      try {
        const reader = new FileReader()
        reader.onload = async e => {
          try {
            const content = e.target?.result as string
            // TODO: 修正 API 字段映射 - content 应该作为许可证内容字段而非 expires_at
            await createLicense({ name: file.name, type, status: 'active', expires_at: content })
            message.success('许可证导入成功')
            loadLicenses()
          } catch {
            /* 已由拦截器提示 */
          }
        }
        reader.readAsText(file)
      } catch {
        /* 已由拦截器提示 */
      }
      return false
    },
  })

  const renderLicenseInfo = (type: string) => {
    const filtered = licenses.filter(l => l.type === type)
    if (filtered.length === 0) {
      return (
        <Descriptions column={1}>
          <Descriptions.Item label="状态">未导入许可证</Descriptions.Item>
        </Descriptions>
      )
    }
    return filtered.map(license => {
      const status = STATUS_MAP[license.status] ?? { color: 'default', text: license.status }
      return (
        <Descriptions key={license.id} column={1} bordered style={{ marginBottom: 16 }}>
          <Descriptions.Item label="名称">{license.name}</Descriptions.Item>
          <Descriptions.Item label="类型">{license.type}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={status.color}>{status.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="过期时间">{license.expires_at ?? '-'}</Descriptions.Item>
        </Descriptions>
      )
    })
  }

  const managerTab = (
    <>
      {renderLicenseInfo('manager')}
      <Upload {...getUploadProps('manager')}>
        <Button icon={<UploadOutlined />}>导入 管理节点 许可证</Button>
      </Upload>
    </>
  )

  const instanceTab = (
    <>
      {renderLicenseInfo('instance')}
      <Upload {...getUploadProps('instance')}>
        <Button icon={<UploadOutlined />}>导入 实例 许可证</Button>
      </Upload>
    </>
  )

  return (
    <PageContainer title="许可证管理">
      <Spin spinning={loading}>
        <Tabs
          items={[
            { key: 'manager', label: '管理节点 许可证', children: managerTab },
            { key: 'instance', label: '实例 许可证', children: instanceTab },
          ]}
        />
      </Spin>
    </PageContainer>
  )
}

export default LicenseManagement
