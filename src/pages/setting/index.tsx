import { useState } from 'react'
import { Card, Icon, Tag, Button, Tabs, Toggle } from '@/components/ui'

type TabKey = 'profile' | 'security' | 'pref' | 'notify'

export default function SettingPage() {
  const [tab, setTab] = useState<TabKey>('profile')
  return (
    <>
      <div className="page-hd">
        <div>
          <h1>
            <span className="ord">NW · 11</span>
            个人设置
          </h1>
          <p>个人资料 · 安全 · 偏好 · 通知</p>
        </div>
      </div>

      <Tabs
        tabs={[
          { value: 'profile', label: '个人资料', ico: 'users' },
          { value: 'security', label: '账号安全', ico: 'lock' },
          { value: 'pref', label: '偏好设置', ico: 'sliders' },
          { value: 'notify', label: '通知中心', ico: 'bell' },
        ]}
        value={tab}
        onChange={v => setTab(v as TabKey)}
      />

      {tab === 'profile' && <ProfileTab />}
      {tab === 'security' && <SecurityTab />}
      {tab === 'pref' && <PreferenceTab />}
      {tab === 'notify' && <NotifyTab />}
    </>
  )
}

function ProfileTab() {
  return (
    <Card title="个人资料" ico="users" meta="登录身份与联系信息">
      <div className="flex items-center gap-3 mb-4">
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--grad-brand)',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 24,
          }}
        >
          A
        </div>
        <div>
          <div className="fw-700 text-0 fs-15">admin</div>
          <div className="muted fs-12">系统管理员</div>
        </div>
        <Button variant="line" size="sm" style={{ marginLeft: 'auto' }}>
          <Icon name="edit" size={11} className="ico" />
          更换头像
        </Button>
      </div>

      <div className="row r-1-1 gap-3">
        <div className="field">
          <label>显示名</label>
          <input className="input" defaultValue="管理员" />
        </div>
        <div className="field">
          <label>邮箱</label>
          <input className="input mono" defaultValue="admin@cloudwall.local" />
        </div>
        <div className="field">
          <label>手机</label>
          <input className="input mono" defaultValue="+86 138 0013 0000" />
        </div>
        <div className="field">
          <label>所在部门</label>
          <input className="input" defaultValue="平台安全组" />
        </div>
      </div>
      <Button variant="pri" style={{ alignSelf: 'flex-start', marginTop: 16 }}>
        <Icon name="check" size={13} className="ico" />
        保存修改
      </Button>
    </Card>
  )
}

function SecurityTab() {
  return (
    <div className="row r-1-1">
      <Card title="修改密码" ico="lock">
        <div className="stack">
          <div className="field">
            <label>当前密码</label>
            <input className="input" type="password" />
          </div>
          <div className="field">
            <label>新密码</label>
            <input className="input" type="password" />
          </div>
          <div className="field">
            <label>确认新密码</label>
            <input className="input" type="password" />
          </div>
          <div
            className="muted fs-11"
            style={{
              padding: 10,
              borderRadius: 8,
              background: 'rgba(168,85,247,.05)',
              border: '1px solid var(--line-2)',
              lineHeight: 1.6,
            }}
          >
            密码要求：≥ 12 位，包含大写字母、小写字母、数字与符号
          </div>
          <Button variant="pri" style={{ alignSelf: 'flex-start' }}>
            <Icon name="check" size={13} className="ico" />
            更新密码
          </Button>
        </div>
      </Card>

      <Card title="双因素 & 会话" ico="shield">
        <div className="stack">
          <div className="flex items-center justify-between">
            <div>
              <div className="fw-600 text-0 fs-13">双因素认证 (TOTP)</div>
              <div className="muted fs-11">使用 Authenticator App 生成动态码</div>
            </div>
            <Tag kind="warn">未启用</Tag>
          </div>
          <Button variant="line" size="sm">启用 2FA</Button>

          <div className="divider-h" />

          <div className="fw-700 fs-13 text-0 mb-2">活跃会话</div>
          {[
            { ua: 'Chrome 124 · macOS', ip: '10.0.0.1', t: '当前', cur: true },
            { ua: 'Safari · iOS 17', ip: '120.5.32.18', t: '2026-05-16', cur: false },
          ].map(s => (
            <div
              key={s.ua}
              className="flex items-center"
              style={{ padding: '8px 0', borderBottom: '1px solid var(--line-2)' }}
            >
              <div style={{ flex: 1 }}>
                <div className="fw-600 fs-12 text-0">{s.ua}</div>
                <div className="muted fs-11 mono">
                  {s.ip} · {s.t}
                </div>
              </div>
              {s.cur ? (
                <Tag kind="ok">当前</Tag>
              ) : (
                <span className="tbl-link fs-12">注销</span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function PreferenceTab() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [density, setDensity] = useState<'comfy' | 'compact'>('comfy')
  const [lang, setLang] = useState<'zh-CN' | 'en-US'>('zh-CN')
  return (
    <div className="row r-1-1">
      <Card title="界面偏好" ico="sliders">
        <div className="stack">
          <div className="field">
            <label>主题</label>
            <div className="flex gap-2">
              {(
                [
                  { v: 'dark', l: '深色', i: 'moon' as const },
                  { v: 'light', l: '浅色', i: 'sun' as const },
                ] as const
              ).map(t => (
                <button
                  key={t.v}
                  onClick={() => setTheme(t.v)}
                  className="btn"
                  style={{
                    background: theme === t.v ? 'rgba(168,85,247,.12)' : 'var(--bg-2)',
                    border:
                      '1px solid ' + (theme === t.v ? 'var(--brand-1)' : 'var(--line)'),
                    color: theme === t.v ? 'var(--brand-1)' : 'var(--text-1)',
                  }}
                >
                  <Icon name={t.i} size={13} className="ico" />
                  {t.l}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>密度</label>
            <div className="flex gap-2">
              {(
                [
                  { v: 'comfy', l: '舒适' },
                  { v: 'compact', l: '紧凑' },
                ] as const
              ).map(t => (
                <button
                  key={t.v}
                  onClick={() => setDensity(t.v)}
                  className="btn"
                  style={{
                    background: density === t.v ? 'rgba(168,85,247,.12)' : 'var(--bg-2)',
                    border:
                      '1px solid ' + (density === t.v ? 'var(--brand-1)' : 'var(--line)'),
                    color: density === t.v ? 'var(--brand-1)' : 'var(--text-1)',
                  }}
                >
                  {t.l}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>语言</label>
            <select
              className="select"
              value={lang}
              onChange={e => setLang(e.target.value as 'zh-CN' | 'en-US')}
            >
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
        </div>
      </Card>

      <Card title="工作偏好" ico="settings">
        <div className="stack">
          <div className="field">
            <label>默认首页</label>
            <select className="select">
              <option>安全态势总览</option>
              <option>实时监控</option>
              <option>站点列表</option>
            </select>
          </div>
          <div className="field">
            <label>表格行数</label>
            <select className="select">
              <option>20</option>
              <option>50</option>
              <option>100</option>
            </select>
          </div>
          <div className="field">
            <label>时间格式</label>
            <select className="select">
              <option>2026-05-17 15:30:12</option>
              <option>2026/05/17 15:30</option>
              <option>05/17/2026 3:30 PM</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  )
}

function NotifyTab() {
  const [opts, setOpts] = useState({
    critical: true,
    warn: true,
    info: false,
    digest: true,
    quiet: false,
  })
  return (
    <Card title="通知中心" ico="bell" meta="哪些事件你愿意被打扰">
      <div className="stack">
        {(
          [
            { k: 'critical', l: '严重告警', d: '攻击突增 · 实例离线 · 高危事件' },
            { k: 'warn', l: '警告事件', d: '证书到期 · 资源告警 · 限速触发' },
            { k: 'info', l: '信息事件', d: '常规变更 · 规则更新 · 报表生成' },
            { k: 'digest', l: '每日摘要', d: '每天上午 9 点发送昨日运营情况' },
            { k: 'quiet', l: '免打扰', d: '22:00 - 08:00 仅发送严重级别通知' },
          ] as const
        ).map(o => (
          <div
            key={o.k}
            className="flex items-center"
            style={{ padding: '12px 0', borderBottom: '1px solid var(--line-2)' }}
          >
            <div style={{ flex: 1 }}>
              <div className="fw-600 text-0 fs-13">{o.l}</div>
              <div className="muted fs-11">{o.d}</div>
            </div>
            <Toggle
              on={(opts as Record<string, boolean>)[o.k]}
              onChange={v => setOpts(s => ({ ...s, [o.k]: v }))}
            />
          </div>
        ))}
      </div>
    </Card>
  )
}
