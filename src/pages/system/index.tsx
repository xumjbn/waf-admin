import { useEffect, useState } from 'react'
import { Card, Icon, Tag, Button, Tabs, Bar } from '@/components/ui'
import { Gauge } from '@/components/charts'
import * as systemApi from '@/api/live/system'
import PageUpgrade from './PageUpgrade'

type TabKey = 'about' | 'basic' | 'upgrade' | 'crs' | 'sec' | 'data' | 'pool'

export default function SystemPage() {
  const [tab, setTab] = useState<TabKey>('about')
  const [, setSettings] = useState<systemApi.SystemSetting[]>([])

  useEffect(() => {
    // 预拉 settings：basic tab 后续按 key 填充表单时直接用，
    // 当前 NW · 09 各 tab 仍是装饰性 chrome，不重写视图。
    systemApi
      .listSettings()
      .then(setSettings)
      .catch(err => {
        // eslint-disable-next-line no-console
        console.error('[system api]', err)
      })
  }, [])

  return (
    <>
      <div className="page-hd">
        <div>
          <h1>
            <span className="ord">NW · 09</span>
            系统管理
          </h1>
          <p>系统设置 · 规则库 · 数据维护 · 资源池</p>
        </div>
      </div>

      <Tabs
        tabs={[
          { value: 'about', label: '系统信息', ico: 'cpu' },
          { value: 'basic', label: '基础设置', ico: 'settings' },
          { value: 'upgrade', label: '系统升级', ico: 'arrow-up' },
          { value: 'crs', label: '规则库', ico: 'database' },
          { value: 'sec', label: '安全', ico: 'lock' },
          { value: 'data', label: '数据维护', ico: 'database' },
          { value: 'pool', label: '资源池', ico: 'server' },
        ]}
        value={tab}
        onChange={v => setTab(v as TabKey)}
      />

      {tab === 'about' && <AboutTab />}
      {tab === 'basic' && <BasicTab />}
      {tab === 'upgrade' && <PageUpgrade />}
      {tab === 'crs' && <CrsTab />}
      {tab === 'sec' && <SecTab />}
      {tab === 'data' && <DataTab />}
      {tab === 'pool' && <PoolTab />}
    </>
  )
}

function StatItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="muted fs-11" style={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div className="fw-700 text-0 fs-13" style={{ marginTop: 3 }}>
        {value}
      </div>
    </div>
  )
}

function AboutTab() {
  return (
    <div className="row r-2-1">
      <Card title="许可证 & 版本" ico="lock" bracketed>
        <div className="row r-3 gap-3">
          <StatItem label="产品" value="NebulaWAF 企业版" />
          <StatItem label="版本" value={<span className="mono">v3.0.0-rc.2</span>} />
          <StatItem label="构建" value={<span className="mono">2026-05-15</span>} />
          <StatItem label="授权客户" value="Example Corp." />
          <StatItem label="到期时间" value={<span className="mono">2027-01-01</span>} />
          <StatItem label="授权状态" value={<Tag kind="ok">有效</Tag>} />
          <StatItem label="最大站点" value="50" />
          <StatItem label="最大实例" value="20" />
          <StatItem label="支持级别" value="L3 7×24" />
        </div>
        <div className="divider-h" />
        <div className="flex items-center gap-2">
          <Icon name="sparkles" size={14} style={{ color: 'var(--brand-1)' }} />
          <span className="muted fs-12">
            本系统基于 Apache-2.0 协议开源，核心引擎 · 控制台 · API 全开放。
          </span>
        </div>
      </Card>

      <Card title="系统状态" ico="cpu">
        <div className="stack">
          <div className="flex items-center justify-between">
            <span className="muted fs-12">控制面</span>
            <Tag kind="ok">
              <span className="dot" />
              RUNNING
            </Tag>
          </div>
          <div className="flex items-center justify-between">
            <span className="muted fs-12">数据库 PostgreSQL</span>
            <Tag kind="ok">
              <span className="dot" />
              OK 14.6
            </Tag>
          </div>
          <div className="flex items-center justify-between">
            <span className="muted fs-12">日志后端 Loki</span>
            <Tag kind="ok">
              <span className="dot" />
              OK
            </Tag>
          </div>
          <div className="flex items-center justify-between">
            <span className="muted fs-12">缓存 Redis Cluster</span>
            <Tag kind="ok">
              <span className="dot" />3 节点
            </Tag>
          </div>
          <div className="flex items-center justify-between">
            <span className="muted fs-12">指标采集 Prometheus</span>
            <Tag kind="warn">
              <span className="dot" />
              降级
            </Tag>
          </div>
          <div className="divider-h" />
          <span className="muted fs-11" style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
            系统资源
          </span>
          <Gauge value={42} label="CPU" size={120} color="#a855f7" />
        </div>
      </Card>
    </div>
  )
}

function BasicTab() {
  return (
    <div className="row r-1-1">
      <Card title="基本设置" ico="settings">
        <div className="stack">
          <div className="field">
            <label>系统名称</label>
            <input className="input" defaultValue="NebulaWAF" />
          </div>
          <div className="field">
            <label>时区</label>
            <select className="select">
              <option>Asia/Shanghai (UTC+8)</option>
            </select>
          </div>
          <div className="field">
            <label>语言</label>
            <select className="select">
              <option>简体中文</option>
              <option>English</option>
            </select>
          </div>
          <div className="field">
            <label>日志保留天数</label>
            <input className="input" defaultValue="90" />
          </div>
          <Button variant="pri" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
            保存设置
          </Button>
        </div>
      </Card>
      <Card title="网络设置" ico="topology">
        <div className="stack">
          <div className="field">
            <label>管理接口</label>
            <input className="input" defaultValue="0.0.0.0" />
          </div>
          <div className="field">
            <label>管理端口</label>
            <input className="input" defaultValue="8443" />
          </div>
          <div className="field">
            <label>外网 API 端点</label>
            <input className="input" defaultValue="https://waf.example.com/api" />
          </div>
          <div className="field">
            <label>NTP 服务器</label>
            <input className="input" defaultValue="ntp.aliyun.com,time.cloud.tencent.com" />
          </div>
          <Button variant="pri" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
            保存设置
          </Button>
        </div>
      </Card>
    </div>
  )
}

function CrsTab() {
  return (
    <Card title="OWASP CRS 规则库" ico="database" bodyClass="np">
      <table>
        <thead>
          <tr>
            <th>版本</th>
            <th>更新日期</th>
            <th>规则数</th>
            <th>变更</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="mono">CRS 4.0.0</td>
            <td>2026-05-10</td>
            <td className="mono">356</td>
            <td>新增 Log4j · Spring4Shell · MOVEit 等</td>
            <td>
              <Tag kind="ok">已应用</Tag>
            </td>
          </tr>
          <tr>
            <td className="mono">CRS 3.8.0</td>
            <td>2026-04-01</td>
            <td className="mono">342</td>
            <td>优化 SQL 注入语义检测</td>
            <td>
              <span className="tbl-link">回滚</span>
            </td>
          </tr>
          <tr>
            <td className="mono">CRS 3.7.5</td>
            <td>2026-02-01</td>
            <td className="mono">336</td>
            <td>常规更新</td>
            <td className="muted fs-12">已归档</td>
          </tr>
        </tbody>
      </table>
    </Card>
  )
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="flex items-center"
      style={{ padding: '5px 0', borderBottom: '1px solid var(--line-2)' }}
    >
      <span className="muted fs-11" style={{ width: 120, letterSpacing: 0.5 }}>
        {label}
      </span>
      <span className="fs-12 text-1" style={{ flex: 1 }}>
        {value}
      </span>
    </div>
  )
}

function SecTab() {
  return (
    <div className="row r-1-1">
      <Card title="登录与会话" ico="lock">
        <div className="stack">
          <KV label="会话超时" value="30 分钟" />
          <KV label="登录失败锁定" value="5 次 / 15 分钟" />
          <KV label="密码策略" value="≥ 12 位 · 大小写+数字+符号" />
          <KV label="管理 IP 白名单" value="未配置" />
          <KV label="双因素认证" value={<Tag kind="warn">未启用</Tag>} />
          <KV label="审计日志" value={<Tag kind="ok">已启用</Tag>} />
        </div>
      </Card>
      <Card title="加密 & 证书" ico="lock">
        <div className="stack">
          <KV label="管理面证书" value="Let's Encrypt R3" />
          <KV label="到期时间" value="2026-08-12" />
          <KV label="TLS 版本" value="TLS 1.2 / 1.3" />
          <KV label="密钥管理" value="HashiCorp Vault" />
          <KV label="敏感数据加密" value={<Tag kind="ok">AES-256-GCM</Tag>} />
        </div>
      </Card>
    </div>
  )
}

function DataTab() {
  return (
    <Card title="数据维护" ico="database">
      <div className="muted fs-12 mb-4">这些操作不可逆，请谨慎使用。</div>
      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
        <Button variant="ghost">
          <Icon name="trash" size={13} className="ico" />
          清理过期攻击日志 (≥ 90 天)
        </Button>
        <Button variant="ghost">
          <Icon name="trash" size={13} className="ico" />
          清理过期操作日志
        </Button>
        <Button variant="line">
          <Icon name="download" size={13} className="ico" />
          导出全量备份
        </Button>
        <Button variant="line">
          <Icon name="refresh" size={13} className="ico" />
          重建索引
        </Button>
        <Button
          variant="pri"
          style={{
            background: 'var(--danger)',
            boxShadow: '0 4px 14px -4px rgba(239,68,68,.5)',
          }}
        >
          <Icon name="alert" size={13} className="ico" />
          重置全部统计
        </Button>
      </div>
    </Card>
  )
}

function PoolTab() {
  return (
    <Card title="资源池" ico="server" meta="2 个池" bodyClass="np">
      <table>
        <thead>
          <tr>
            <th>资源池</th>
            <th>规格</th>
            <th>可用</th>
            <th>已分配</th>
            <th>使用率</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="fw-600">
              <span className="tbl-link">default-pool</span>
            </td>
            <td>
              <Tag kind="info">4C8G</Tag>
            </td>
            <td className="mono">20</td>
            <td className="mono">12</td>
            <td>
              <Bar value={60} kind="brand" width={80} label="60%" />
            </td>
            <td>
              <Tag kind="ok">正常</Tag>
            </td>
          </tr>
          <tr>
            <td className="fw-600">
              <span className="tbl-link">high-perf-pool</span>
            </td>
            <td>
              <Tag kind="pink">8C16G</Tag>
            </td>
            <td className="mono">10</td>
            <td className="mono">4</td>
            <td>
              <Bar value={40} kind="brand" width={80} label="40%" />
            </td>
            <td>
              <Tag kind="ok">正常</Tag>
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  )
}
