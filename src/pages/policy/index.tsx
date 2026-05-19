import { useState, useRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Card, Icon, type IconName, Tag, Button, Tabs, Toggle, Sparkline } from '@/components/ui'
import { Donut } from '@/components/charts'
import { RULES, type Rule } from '@/mocks/nebula'
import RuleEdit from './RuleEdit'

type TabKey = 'modules' | 'rules' | 'acl' | 'bot' | 'api'

function PolicyPage() {
  const [tab, setTab] = useState<TabKey>('rules')
  const [rules, setRules] = useState<Rule[]>(RULES)
  const dragSrcRef = useRef<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  const moveRule = (fromId: string, toId: string) => {
    if (fromId === toId) return
    setRules(prev => {
      const list = [...prev]
      const fromIdx = list.findIndex(r => r.id === fromId)
      const toIdx = list.findIndex(r => r.id === toId)
      const [moved] = list.splice(fromIdx, 1)
      list.splice(toIdx, 0, moved)
      return list.map((r, i) => ({ ...r, priority: i + 1 }))
    })
  }

  return (
    <>
      <div className="page-hd">
        <div>
          <h1>
            <span className="ord">NW · 04</span>
            防护配置
          </h1>
          <p>可视化策略编辑 · 拖拽优先级 · 支持 OWASP CRS 内置规则集与自定义表达式</p>
        </div>
        <div className="actions">
          <Button variant="ghost">
            <Icon name="download" size={13} className="ico" />
            导出规则
          </Button>
          <Button variant="line">
            <Icon name="sparkles" size={13} className="ico" />
            规则市场
          </Button>
          <Button variant="pri">
            <Icon name="plus" size={13} className="ico" />
            新建规则
          </Button>
        </div>
      </div>

      <Tabs
        tabs={[
          { value: 'modules', label: '防护模块', ico: 'shield' },
          { value: 'rules', label: '规则引擎', ico: 'rules', count: rules.length },
          { value: 'acl', label: '访问控制', ico: 'lock' },
          { value: 'bot', label: 'Bot 管理', ico: 'crosshair' },
          { value: 'api', label: 'API 安全', ico: 'flow' },
        ]}
        value={tab}
        onChange={v => setTab(v as TabKey)}
      />

      {tab === 'modules' && <ProtectionModules />}
      {tab === 'rules' && (
        <RuleEngine
          rules={rules}
          onMove={moveRule}
          onToggle={id =>
            setRules(r => r.map(x => (x.id === id ? { ...x, enabled: !x.enabled } : x)))
          }
          dragSrcRef={dragSrcRef}
          dragOver={dragOver}
          setDragOver={setDragOver}
        />
      )}
      {tab === 'acl' && <AclPanel />}
      {tab === 'bot' && <BotPanel />}
      {tab === 'api' && <ApiSecurityPanel />}
    </>
  )
}

const PROTECTION_MODULES: { id: string; ico: IconName; title: string; desc: string; enabled: boolean; level: 'low' | 'medium' | 'high'; hits: number }[] = [
  { id: 'sqli', ico: 'database', title: 'SQL 注入防护', desc: '基于 OWASP CRS + 语义分析 + 自定义指纹', enabled: true, level: 'high', hits: 23410 },
  { id: 'xss', ico: 'fire', title: 'XSS 防护', desc: '上下文感知、输出编码、CSP 友好', enabled: true, level: 'high', hits: 14209 },
  { id: 'csrf', ico: 'lock', title: 'CSRF 防护', desc: 'Token 验证、SameSite 检测', enabled: true, level: 'medium', hits: 1280 },
  { id: 'cc', ico: 'activity', title: 'CC 攻击防护', desc: '动态阈值 + 智能挑战 + IP/CIDR 限速', enabled: true, level: 'high', hits: 28490 },
  { id: 'upload', ico: 'database', title: '文件上传检测', desc: 'MIME 校验 + 内容指纹 + WebShell 识别', enabled: true, level: 'high', hits: 432 },
  { id: 'bot', ico: 'crosshair', title: 'Bot 流量管理', desc: 'TLS 指纹 + JS 挑战 + 行为分析', enabled: true, level: 'medium', hits: 18460 },
  { id: 'api', ico: 'flow', title: 'API 安全', desc: 'Schema 校验 + JWT 验证 + 速率限制', enabled: false, level: 'medium', hits: 902 },
  { id: 'geo', ico: 'globe', title: '地理区域屏蔽', desc: '基于 GeoIP 的国家/区域级访问控制', enabled: true, level: 'low', hits: 2080 },
  { id: 'leech', ico: 'eye', title: '防盗链', desc: 'Referer 校验 + 资源链接签名', enabled: false, level: 'low', hits: 0 },
]

function ProtectionModules() {
  const [mods, setMods] = useState(PROTECTION_MODULES)
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="muted fs-12">
          应用范围：<span className="text-0 fw-600">官网主站 (www.example.com)</span>
        </div>
        <select className="select">
          <option>官网主站</option>
          <option>API 网关</option>
        </select>
      </div>
      <div className="row r-3 gap-3">
        {mods.map(m => (
          <div key={m.id} className="card" style={{ padding: 18 }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: m.enabled ? 'var(--grad-soft)' : 'var(--bg-3)',
                    border: '1px solid var(--line-strong)',
                    display: 'grid',
                    placeItems: 'center',
                    color: m.enabled ? 'var(--brand-1)' : 'var(--text-3)',
                  }}
                >
                  <Icon name={m.ico} size={18} />
                </div>
                <div>
                  <div className="fw-700 text-0 fs-13">{m.title}</div>
                  <div className="muted fs-11">{m.desc}</div>
                </div>
              </div>
              <Toggle
                on={m.enabled}
                onChange={() =>
                  setMods(prev =>
                    prev.map(x => (x.id === m.id ? { ...x, enabled: !x.enabled } : x)),
                  )
                }
              />
            </div>
            <div className="flex items-center justify-between" style={{ marginTop: 14 }}>
              <div className="flex items-center gap-2">
                <span className="muted fs-11">等级</span>
                {(['low', 'medium', 'high'] as const).map(L => (
                  <span
                    key={L}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 10.5,
                      fontWeight: 700,
                      fontFamily: 'JetBrains Mono',
                      background:
                        m.level === L
                          ? L === 'high'
                            ? 'rgba(239,68,68,.15)'
                            : L === 'medium'
                              ? 'rgba(245,158,11,.15)'
                              : 'rgba(34,211,238,.15)'
                          : 'transparent',
                      color:
                        m.level === L
                          ? L === 'high'
                            ? 'var(--danger)'
                            : L === 'medium'
                              ? 'var(--warn)'
                              : 'var(--info)'
                          : 'var(--text-3)',
                      border: m.level === L ? '1px solid currentColor' : '1px solid var(--line)',
                      cursor: 'pointer',
                    }}
                  >
                    {L.toUpperCase()}
                  </span>
                ))}
              </div>
              <span className="mono fs-11 muted">{m.hits.toLocaleString()} 拦截</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RuleEngine({
  rules,
  onMove,
  onToggle,
  dragSrcRef,
  dragOver,
  setDragOver,
}: {
  rules: Rule[]
  onMove: (fromId: string, toId: string) => void
  onToggle: (id: string) => void
  dragSrcRef: React.MutableRefObject<string | null>
  dragOver: string | null
  setDragOver: (id: string | null) => void
}) {
  return (
    <div className="row r-1-2 gap-3">
      <Card title="规则统计" ico="rules" bracketed>
        <div className="stack">
          <div className="flex items-center justify-between">
            <span className="muted fs-12">规则总数</span>
            <span className="fw-700 text-0 fs-20 mono">{rules.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="muted fs-12">已启用</span>
            <span className="fw-700 t-ok fs-16 mono">{rules.filter(r => r.enabled).length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="muted fs-12">内置 / 自定义</span>
            <span className="mono fs-13">
              <span className="t-brand">{rules.filter(r => r.builtin).length}</span>
              <span className="muted"> / </span>
              <span className="t-pink">{rules.filter(r => !r.builtin).length}</span>
            </span>
          </div>
          <div className="divider-h" />
          <div
            className="muted fs-11"
            style={{ letterSpacing: 1, textTransform: 'uppercase' }}
          >
            近 24h 命中
          </div>
          <Sparkline
            data={[120, 180, 240, 200, 320, 280, 380, 450, 420, 510, 560]}
            color="#ec4899"
            height={42}
          />
          <div className="mono fs-20 fw-700 text-0">81,206</div>
        </div>

        <div className="divider-h" />

        <div
          className="muted fs-11 mb-2"
          style={{ letterSpacing: 1, textTransform: 'uppercase' }}
        >
          按动作分布
        </div>
        <div className="stack" style={{ gap: 8 }}>
          {[
            { lbl: '拦截 BLOCK', v: rules.filter(r => r.action === 'block').length, c: '#ef4444' },
            { lbl: '挑战 CHALLENGE', v: rules.filter(r => r.action === 'challenge').length, c: '#f59e0b' },
            { lbl: '限速 RATE', v: rules.filter(r => r.action === 'rate').length, c: '#a855f7' },
            { lbl: '放行 ALLOW', v: rules.filter(r => r.action === 'allow').length, c: '#10b981' },
            { lbl: '记录 LOG', v: rules.filter(r => r.action === 'log').length, c: '#22d3ee' },
          ].map(x => (
            <div key={x.lbl} className="flex items-center gap-2">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: x.c }} />
              <span className="fs-12 flex-1">{x.lbl}</span>
              <span className="mono fs-12 fw-600 text-0">{x.v}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="规则优先级"
        ico="grip"
        meta="拖拽行调整优先级 · 越靠前匹配越早"
        actions={
          <div className="flex gap-2">
            <input className="input" placeholder="搜索规则名 / ID" style={{ width: 240 }} />
            <select className="select">
              <option>全部站点</option>
            </select>
          </div>
        }
      >
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '32px 60px 1.6fr 1fr 1fr 1fr 0.8fr 1.1fr',
              gap: 10,
              alignItems: 'center',
              padding: '10px 12px',
              background: 'rgba(168,85,247,.05)',
              border: '1px dashed var(--line-strong)',
              color: 'var(--text-3)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              borderRadius: 8,
              marginBottom: 6,
            }}
          >
            <span />
            <span style={{ textAlign: 'center' }}>优先级</span>
            <span>规则名 / 适用站点</span>
            <span>匹配字段</span>
            <span>匹配模式</span>
            <span>动作</span>
            <span>命中</span>
            <span>状态</span>
          </div>
          {rules.map(r => (
            <div
              key={r.id}
              draggable
              onDragStart={e => {
                dragSrcRef.current = r.id
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragEnd={() => setDragOver(null)}
              onDragOver={e => {
                e.preventDefault()
                setDragOver(r.id)
              }}
              onDrop={e => {
                e.preventDefault()
                if (dragSrcRef.current) onMove(dragSrcRef.current, r.id)
                setDragOver(null)
              }}
              style={{
                display: 'grid',
                gridTemplateColumns: '32px 60px 1.6fr 1fr 1fr 1fr 0.8fr 1.1fr',
                gap: 10,
                alignItems: 'center',
                padding: '10px 12px',
                borderBottom: '1px solid var(--line-2)',
                cursor: 'grab',
                background: dragOver === r.id ? 'rgba(168,85,247,.08)' : 'transparent',
                borderLeft: dragOver === r.id ? '2px solid var(--brand-1)' : '2px solid transparent',
              }}
            >
              <span style={{ color: 'var(--text-3)' }}>
                <Icon name="grip" size={14} />
              </span>
              <span className="mono fs-12 t-brand fw-700">
                #{String(r.priority).padStart(2, '0')}
              </span>
              <div style={{ minWidth: 0 }}>
                <div
                  className="fw-600 text-0 fs-13"
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {r.name}
                  {r.builtin && (
                    <Tag kind="info" style={{ marginLeft: 8, fontSize: 9 }}>
                      内置
                    </Tag>
                  )}
                </div>
                <div className="muted fs-11 mono">
                  {r.scope} · {r.id}
                </div>
              </div>
              <div className="mono fs-11">{r.field}</div>
              <div className="fs-11">
                <Tag kind="def">{r.match}</Tag>
              </div>
              <div>
                <Tag
                  kind={
                    r.action === 'block'
                      ? 'danger'
                      : r.action === 'challenge'
                        ? 'warn'
                        : r.action === 'rate'
                          ? 'pink'
                          : r.action === 'allow'
                            ? 'ok'
                            : 'info'
                  }
                >
                  {r.action === 'block'
                    ? '拦截'
                    : r.action === 'challenge'
                      ? '挑战'
                      : r.action === 'rate'
                        ? '限速'
                        : r.action === 'allow'
                          ? '放行'
                          : '记录'}
                </Tag>
              </div>
              <div className="mono fs-12 t-pink">{r.hits.toLocaleString()}</div>
              <div className="flex items-center gap-2">
                <Toggle on={r.enabled} onChange={() => onToggle(r.id)} />
                <span className="tbl-link fs-11">编辑</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function AclPanel() {
  return (
    <div className="row r-1-1 gap-3">
      <Card title="IP 白名单" ico="check" meta="信任源">
        <div className="muted fs-12 mb-3">命中规则将立即放行，跳过其余检测。</div>
        <table>
          <tbody>
            {[
              ['10.0.0.0/8', '内部办公网络', '全部站点'],
              ['172.16.5.0/24', '运维堡垒机', '管理后台'],
              ['8.8.8.0/24', '可信合作伙伴', 'API 网关'],
              ['203.0.113.10', 'CTO 出口 IP', '全部站点'],
            ].map(([ip, label, scope]) => (
              <tr key={ip}>
                <td>
                  <Tag kind="ok">
                    <span className="dot" />
                    放行
                  </Tag>
                </td>
                <td className="mono">{ip}</td>
                <td>{label}</td>
                <td className="muted fs-12">{scope}</td>
                <td>
                  <span className="tbl-link">删除</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card title="IP 黑名单 / 地理屏蔽" ico="lock" meta="拒绝源">
        <div className="muted fs-12 mb-3">命中规则将直接 403 拦截。</div>
        <table>
          <tbody>
            {[
              ['185.156.0.0/16', '已知恶意 ASN', '全部站点'],
              ['IR', '国家 · 伊朗', '管理后台'],
              ['KP', '国家 · 朝鲜', '全部站点'],
              ['193.27.228.0/22', 'TOR 出口节点', '管理后台'],
            ].map(([ip, label, scope]) => (
              <tr key={ip + label}>
                <td>
                  <Tag kind="danger">
                    <span className="dot" />
                    拦截
                  </Tag>
                </td>
                <td className="mono">{ip}</td>
                <td>{label}</td>
                <td className="muted fs-12">{scope}</td>
                <td>
                  <span className="tbl-link">删除</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function BotPanel() {
  const [toggles, setToggles] = useState({ js: true, tls: true, dev: true, slider: false, behave: false })
  return (
    <div className="row r-2-1 gap-3">
      <Card title="Bot 风险分布" ico="crosshair" meta="近 24h">
        <Donut
          data={[
            { label: '搜索引擎 (可信)', value: 38, color: '#10b981' },
            { label: '商业 Bot', value: 18, color: '#22d3ee' },
            { label: '未知 / 可疑', value: 22, color: '#f59e0b' },
            { label: '恶意 Bot', value: 14, color: '#ef4444' },
            { label: '伪装真人', value: 8, color: '#ec4899' },
          ]}
          size={180}
          thickness={28}
          centerValue="62.4K"
          centerLabel="Bot 请求"
        />
      </Card>
      <Card title="挑战模式" ico="sparkles">
        <div className="stack" style={{ gap: 14 }}>
          {[
            { k: 'js', l: 'JS Challenge', d: '透明 JS 计算挑战' },
            { k: 'tls', l: 'TLS 指纹白名单', d: 'JA3 / JA4 指纹库' },
            { k: 'dev', l: '设备指纹', d: 'Canvas + WebGL' },
            { k: 'slider', l: '滑块验证码', d: '人机交互验证' },
            { k: 'behave', l: '行为分析', d: '鼠标 / 输入韵律' },
          ].map(x => (
            <div
              key={x.k}
              className="flex items-center gap-3"
              style={{ padding: '8px 0', borderBottom: '1px solid var(--line-2)' }}
            >
              <div style={{ flex: 1 }}>
                <div className="fw-600 text-0 fs-13">{x.l}</div>
                <div className="muted fs-11">{x.d}</div>
              </div>
              <Toggle
                on={(toggles as Record<string, boolean>)[x.k]}
                onChange={v => setToggles(t => ({ ...t, [x.k]: v }))}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function ApiSecurityPanel() {
  return (
    <div className="stack">
      <div className="row r-4">
        <div className="card kpi brand" style={{ padding: 16 }}>
          <div className="kpi-lbl muted fs-12">已注册 API</div>
          <div className="kpi-val fw-700 fs-20 mono">142</div>
        </div>
        <div className="card kpi danger" style={{ padding: 16 }}>
          <div className="kpi-lbl muted fs-12">未授权访问拦截</div>
          <div className="kpi-val fw-700 fs-20 mono">328</div>
        </div>
        <div className="card kpi warn" style={{ padding: 16 }}>
          <div className="kpi-lbl muted fs-12">JWT 重放阻断</div>
          <div className="kpi-val fw-700 fs-20 mono">64</div>
        </div>
        <div className="card kpi info" style={{ padding: 16 }}>
          <div className="kpi-lbl muted fs-12">敏感字段脱敏</div>
          <div className="kpi-val fw-700 fs-20 mono">2,840</div>
        </div>
      </div>
      <Card
        title="API 端点列表"
        ico="flow"
        meta="带 OpenAPI Schema 校验"
        actions={
          <Button variant="line" size="sm">
            <Icon name="plus" size={11} className="ico" />
            导入 Swagger
          </Button>
        }
      >
        <table>
          <thead>
            <tr>
              <th>方法</th>
              <th>路径</th>
              <th>认证</th>
              <th>速率限制</th>
              <th>Schema</th>
              <th>QPS</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['POST', '/api/v1/auth/login', 'None', '5/min/IP', '已导入', 124, 'ok'],
              ['GET', '/api/v1/users/{id}', 'JWT', '100/s', '已导入', 1840, 'ok'],
              ['POST', '/api/v1/orders', 'JWT', '50/s', '已导入', 920, 'ok'],
              ['POST', '/api/v1/upload', 'JWT', '5/s', '已导入', 32, 'warn'],
              ['GET', '/api/v1/admin/exports', 'JWT+MFA', '10/min', '已导入', 8, 'ok'],
              ['GET', '/api/internal/metrics', '内网', '—', '未导入', 240, 'warn'],
            ].map(r => (
              <tr key={(r[0] as string) + (r[1] as string)}>
                <td>
                  <Tag kind={r[0] === 'GET' ? 'info' : r[0] === 'POST' ? 'pink' : 'warn'}>
                    {r[0] as string}
                  </Tag>
                </td>
                <td className="mono fs-12">{r[1] as string}</td>
                <td>{r[2] as string}</td>
                <td className="mono">{r[3] as string}</td>
                <td>
                  <Tag kind={r[4] === '已导入' ? 'ok' : 'def'}>{r[4] as string}</Tag>
                </td>
                <td className="mono">{r[5] as number}</td>
                <td>
                  <Tag kind={r[6] === 'ok' ? 'ok' : 'warn'}>
                    <span className="dot" />
                    {r[6] === 'ok' ? '健康' : '提醒'}
                  </Tag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export default function PolicyRoutes() {
  return (
    <Routes>
      <Route index element={<PolicyPage />} />
      <Route path="rule/:id?" element={<RuleEdit />} />
      <Route path="*" element={<Navigate to="/policy" replace />} />
    </Routes>
  )
}
