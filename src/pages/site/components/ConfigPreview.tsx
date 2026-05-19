import { useEffect, useState } from 'react'
import { Card, Typography, Spin } from 'antd'
import { previewSiteConfig } from '@/api/deploy'

const { Text } = Typography

const ConfigPreview = ({ siteId }: { siteId: string }) => {
  const [loading, setLoading] = useState(true)
  const [nginxConfig, setNginxConfig] = useState('')
  const [modsecConfig, setModsecConfig] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await previewSiteConfig(siteId)
        setNginxConfig(res.site_config)
        setModsecConfig(res.policy_config)
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [siteId])

  if (loading) return <Spin />

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Card title="Nginx 配置" size="small" style={{ maxHeight: 600, overflow: 'auto' }}>
        <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>
          <Text code>{nginxConfig || '(暂无)'}</Text>
        </pre>
      </Card>
      <Card title="ModSecurity 配置" size="small" style={{ maxHeight: 600, overflow: 'auto' }}>
        <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>
          <Text code>{modsecConfig || '(暂无)'}</Text>
        </pre>
      </Card>
    </div>
  )
}

export default ConfigPreview
