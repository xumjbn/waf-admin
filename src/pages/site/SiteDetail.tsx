import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageContainer } from '@ant-design/pro-components'
import { Tabs, Button, Descriptions, Tag } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { getSite } from '@/api/site'
import type { ProtectSite } from '@/api/types/site'
import MemberTable from './components/MemberTable'
import AclTable from './components/AclTable'
import CcProtect from './components/CcProtect'
import CsrfProtect from './components/CsrfProtect'
import AntiTamper from './components/AntiTamper'
import CustomRule from './components/CustomRule'
import Accelerator from './components/Accelerator'
import AntiStealingLink from './components/AntiStealingLink'
import ContentInto from './components/ContentInto'
import LbMember from './components/LbMember'
import DeployHistory from './components/DeployHistory'
import ConfigPreview from './components/ConfigPreview'

const SiteDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [site, setSite] = useState<ProtectSite | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSite = async () => {
      if (!id) return
      try {
        setLoading(true)
        const { protect_site } = await getSite(id)
        setSite(protect_site)
      } catch {
        /* 已由拦截器提示 */
      } finally {
        setLoading(false)
      }
    }
    loadSite()
  }, [id])

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: site ? (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="站点名称">{site.name}</Descriptions.Item>
          <Descriptions.Item label="域名">{site.domains}</Descriptions.Item>
          <Descriptions.Item label="域名匹配">
            {site.domain_match === 'exact' && '精确匹配'}
            {site.domain_match === 'prefix' && '前缀匹配'}
            {site.domain_match === 'suffix' && '后缀匹配'}
            {site.domain_match === 'regex' && '正则匹配'}
          </Descriptions.Item>
          <Descriptions.Item label="管理状态">
            <Tag color={site.admin_state_up ? 'green' : 'red'}>
              {site.admin_state_up ? '启用' : '禁用'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="运行状态">
            <Tag
              color={
                site.status === 'active' ? 'green' : site.status === 'error' ? 'red' : 'default'
              }
            >
              {site.status === 'active' && '活跃'}
              {site.status === 'inactive' && '未激活'}
              {site.status === 'error' && '错误'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="阻断方式">
            {site.forbidden_type === 'block' ? '拦截' : '重定向'}
          </Descriptions.Item>
          {site.redirect_url && (
            <Descriptions.Item label="重定向地址">{site.redirect_url}</Descriptions.Item>
          )}
          <Descriptions.Item label="检查请求体">
            <Tag color={site.check_request_body ? 'blue' : 'default'}>
              {site.check_request_body ? '是' : '否'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="检查响应体">
            <Tag color={site.check_response_body ? 'blue' : 'default'}>
              {site.check_response_body ? '是' : '否'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="前端保活">{site.front_keepalive}s</Descriptions.Item>
          <Descriptions.Item label="前端超时">{site.front_timeout}s</Descriptions.Item>
          <Descriptions.Item label="后端保活">{site.backend_keepalive}s</Descriptions.Item>
          <Descriptions.Item label="后端超时">{site.backend_timeout}s</Descriptions.Item>
          <Descriptions.Item label="日志级别">
            <Tag>{site.log_level.toUpperCase()}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="审计状态">
            <Tag color={site.audit_status ? 'green' : 'default'}>
              {site.audit_status ? '开启' : '关闭'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="防病毒">
            <Tag color={site.anti_virus ? 'green' : 'default'}>
              {site.anti_virus ? '开启' : '关闭'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="防篡改告警">
            <Tag color={site.anti_tamper_alarm ? 'green' : 'default'}>
              {site.anti_tamper_alarm ? '开启' : '关闭'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="隐藏服务器信息">
            <Tag color={site.server_info_hide ? 'green' : 'default'}>
              {site.server_info_hide ? '是' : '否'}
            </Tag>
          </Descriptions.Item>
          {site.created_at && (
            <Descriptions.Item label="创建时间">{site.created_at}</Descriptions.Item>
          )}
        </Descriptions>
      ) : null,
    },
    { key: 'member', label: '防护成员', children: id ? <MemberTable siteId={id} /> : null },
    { key: 'acl', label: 'ACL 防护', children: id ? <AclTable siteId={id} /> : null },
    { key: 'cc', label: 'CC 防护', children: id ? <CcProtect siteId={id} /> : null },
    { key: 'csrf', label: 'CSRF 防护', children: id ? <CsrfProtect siteId={id} /> : null },
    { key: 'tamper', label: '防篡改', children: id ? <AntiTamper siteId={id} /> : null },
    { key: 'custom', label: '自定义规则', children: id ? <CustomRule siteId={id} /> : null },
    { key: 'accelerator', label: 'WEB 加速', children: id ? <Accelerator siteId={id} /> : null },
    { key: 'anti-steal', label: '防盗链', children: id ? <AntiStealingLink siteId={id} /> : null },
    { key: 'content', label: '内容注入', children: id ? <ContentInto siteId={id} /> : null },
    { key: 'lb', label: 'LB 成员', children: id ? <LbMember siteId={id} /> : null },
    { key: 'deploy', label: '部署历史', children: id ? <DeployHistory siteId={id} /> : null },
    { key: 'preview', label: '配置预览', children: id ? <ConfigPreview siteId={id} /> : null },
  ]

  return (
    <PageContainer
      title={site?.name ?? '站点详情'}
      loading={loading}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/site')}>
          返回列表
        </Button>
      }
    >
      <Tabs items={tabItems} />
    </PageContainer>
  )
}

export default SiteDetail
