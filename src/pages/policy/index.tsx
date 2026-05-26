import { useEffect, useMemo, useState, useRef } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Card, Icon, type IconName, Tag, Button, Tabs, Toggle, Sparkline } from '@/components/ui'
import { Donut } from '@/components/charts'
import { type Rule, type Site } from '@/mocks/nebula'
import * as policyApi from '@/api/live/policy'
import * as siteApi from '@/api/live/site'
import * as aclApi from '@/api/live/acl'
import type { SiteModuleConfig } from '@/api/live/site'
import type { AclRule } from '@/api/live/acl'
import RuleEdit from './RuleEdit'

type TabKey = 'modules' | 'rules' | 'acl' | 'bot' | 'api'

function PolicyPage() {
  const nav = useNavigate()
  const [tab, setTab] = useState<TabKey>('rules')
  const [rules, setRules] = useState<Rule[]>([])
  const [rulesError, setRulesError] = useState<string | null>(null)
  const dragSrcRef = useRef<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  useEffect(() => {
    policyApi
      .listRules()
      .then(rs => {
        setRules(rs)
        setRulesError(null)
      })
      .catch(err => {
        setRulesError(err instanceof Error ? err.message : String(err))
      })
  }, [])

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
          <Button
            variant="line"
            onClick={async () => {
              try {
                const r = await policyApi.syncBuiltin()
                window.alert(
                  `已同步 ModSecurity 内置规则\n目录：${r.dir}\n新增 ${r.inserted} · 更新 ${r.updated} · 共 ${r.total}`,
                )
                const list = await policyApi.listRules()
                setRules(list)
              } catch (e: unknown) {
                window.alert(`同步失败：${e instanceof Error ? e.message : String(e)}`)
              }
            }}
          >
            <Icon name="refresh" size={13} className="ico" />
            同步内置规则
          </Button>
          <Button variant="pri" onClick={() => nav('/policy/rule')}>
            <Icon name="plus" size={13} className="ico" />
            新建规则
          </Button>
        </div>
      </div>

      {rulesError && (
        <div
          className="fs-12 mb-3"
          style={{
            padding: '8px 12px',
            background: 'var(--bg-danger-1, #fee2e2)',
            color: 'var(--text-danger, #b91c1c)',
            borderRadius: 6,
          }}
        >
          规则加载失败：{rulesError}
        </div>
      )}

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
          onEdit={id => nav(`/policy/rule/${id}`)}
          onToggle={async id => {
            const target = rules.find(x => x.id === id)
            if (!target) return
            const nextEnabled = !target.enabled
            // 乐观更新 + 失败回滚
            setRules(r =>
              r.map(x => (x.id === id ? { ...x, enabled: nextEnabled } : x)),
            )
            try {
              await policyApi.toggleRule(id, nextEnabled)
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err)
              window.alert(`切换失败：${msg}`)
              setRules(r =>
                r.map(x => (x.id === id ? { ...x, enabled: target.enabled } : x)),
              )
            }
          }}
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

// 模块元信息 —— id 与后端 site_modules.module + policies.category 一致
// （sqli/xss/rce/lfi-rfi/bot/rate-limit/ip-reputation/virtual-patches）
const MODULE_META: Record<
  string,
  { ico: IconName; title: string; desc: string }
> = {
  sqli: {
    ico: 'database',
    title: 'SQL / NoSQL 注入',
    desc: 'UNION SELECT / 注释绕过 / 盲注 / 元信息探测 / MongoDB',
  },
  xss: {
    ico: 'fire',
    title: 'XSS',
    desc: '脚本标签 / 事件处理器 / URI scheme / 模板注入 / DOM sink',
  },
  rce: {
    ico: 'crosshair',
    title: 'RCE / 反序列化',
    desc: 'Shell 命令 / PHP 危险函数 / Java 反序列化 / WebShell',
  },
  'lfi-rfi': {
    ico: 'flow',
    title: '路径遍历 / SSRF',
    desc: '../ 穿越 / system 文件 / PHP wrapper / RFI / SSRF 内网目标',
  },
  bot: {
    ico: 'eye',
    title: 'Bot / 扫描器',
    desc: 'sqlmap/nikto UA / 缺 UA / Headless / 行为评分',
  },
  'rate-limit': {
    ico: 'activity',
    title: '限速 / 爆破',
    desc: '全局 / 登录 / 注册 / API token / 支付接口',
  },
  'ip-reputation': {
    ico: 'lock',
    title: 'IP 信誉',
    desc: '黑名单 / TOR 出口 / 地理屏蔽 / 后台路径爆破计数',
  },
  'virtual-patches': {
    ico: 'shield',
    title: '虚拟补丁 CVE',
    desc: 'Log4Shell / Spring4Shell / ProxyShell / Confluence OGNL',
  },
}
const MODULE_ORDER = [
  'sqli',
  'xss',
  'rce',
  'lfi-rfi',
  'bot',
  'rate-limit',
  'ip-reputation',
  'virtual-patches',
]

function ProtectionModules() {
  const [sites, setSites] = useState<Site[]>([])
  const [activeSiteId, setActiveSiteId] = useState<string>('')
  const [mods, setMods] = useState<SiteModuleConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null) // 当前在改的 module 名
  const [error, setError] = useState<string | null>(null)

  // 加载站点列表 + 默认选第一个
  useEffect(() => {
    let cancelled = false
    siteApi
      .listSites()
      .then(list => {
        if (cancelled) return
        setSites(list)
        if (list.length > 0) setActiveSiteId(prev => prev || list[0].id)
        else setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 切站点时拉模块配置
  useEffect(() => {
    if (!activeSiteId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    siteApi
      .listSiteModules(activeSiteId)
      .then(list => {
        if (cancelled) return
        // 按 MODULE_ORDER 排序
        const ordered = MODULE_ORDER.map(
          name =>
            list.find(m => m.module === name) ?? {
              site_id: Number(activeSiteId),
              module: name,
              enabled: true,
              level: 'medium' as const,
            },
        )
        setMods(ordered)
      })
      .catch(err => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
        setMods([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeSiteId])

  const updateModule = async (
    module: string,
    patch: { enabled?: boolean; level?: 'low' | 'medium' | 'high' },
  ) => {
    if (!activeSiteId) return
    // 乐观更新
    const prevMods = mods
    setMods(prev => prev.map(m => (m.module === module ? { ...m, ...patch } : m)))
    setSavingKey(module)
    try {
      await siteApi.updateSiteModule(activeSiteId, module, patch)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      window.alert(`保存失败：${msg}`)
      setMods(prevMods)
    } finally {
      setSavingKey(null)
    }
  }
  const activeSite = sites.find(s => s.id === activeSiteId)

  if (sites.length === 0 && !loading) {
    return (
      <div
        className="muted fs-13"
        style={{ padding: 40, textAlign: 'center', lineHeight: 1.8 }}
      >
        还没有站点。请到『站点接入』新建一个站点后再来配置防护模块。
      </div>
    )
  }

  return (
    <div>
      {/* 应用范围：每个站点独立的模块配置 */}
      <div className="flex items-center justify-between mb-3">
        <div className="muted fs-12">
          应用范围：
          <span className="text-0 fw-600">
            {activeSite ? `${activeSite.name} (${activeSite.domain})` : '—'}
          </span>
        </div>
        <select
          className="select"
          value={activeSiteId}
          onChange={e => setActiveSiteId(e.target.value)}
          style={{ minWidth: 220 }}
        >
          {sites.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.domain}
            </option>
          ))}
        </select>
      </div>

      {/* 模型说明条 —— 让用户一眼看出『模块 → 等级 → 规则』关系 */}
      <div
        className="muted fs-11 mb-3"
        style={{
          padding: 10,
          background: 'var(--bg-2)',
          borderRadius: 6,
          lineHeight: 1.7,
          border: '1px solid var(--line-2)',
        }}
      >
        🛈 每个站点独立配置 8 个防护模块。模块开关与等级（低/中/高）写入
        <code> site_modules </code>表；级别决定加载哪些 severity 的规则：
        <b style={{ color: 'var(--info)' }}>低</b>=仅 critical ·
        <b style={{ color: 'var(--warn)' }}>中</b>=critical + high ·
        <b style={{ color: 'var(--danger)' }}>高</b>=critical + high + medium。
        规则本身在『规则引擎』Tab 维护（来自 deploy/modsec/rules.d/）。
      </div>

      {error && (
        <div
          className="fs-12 mb-3"
          style={{
            padding: '8px 12px',
            background: 'var(--bg-danger-1, #fee2e2)',
            color: 'var(--text-danger, #b91c1c)',
            borderRadius: 6,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="muted fs-13" style={{ padding: 32, textAlign: 'center' }}>
          加载模块配置…
        </div>
      ) : (
        <div className="row r-3 gap-3">
          {mods.map(m => {
            const meta = MODULE_META[m.module] ?? {
              ico: 'sparkles' as IconName,
              title: m.module,
              desc: '',
            }
            const isSaving = savingKey === m.module
            return (
              <div
                key={m.module}
                className="card"
                style={{ padding: 18, opacity: isSaving ? 0.6 : 1, transition: 'opacity .15s' }}
              >
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
                      <Icon name={meta.ico} size={18} />
                    </div>
                    <div>
                      <div className="fw-700 text-0 fs-13">{meta.title}</div>
                      <div className="muted fs-11">{meta.desc}</div>
                    </div>
                  </div>
                  <Toggle
                    on={m.enabled}
                    onChange={v => updateModule(m.module, { enabled: v })}
                  />
                </div>
                <div
                  className="flex items-center justify-between"
                  style={{ marginTop: 14 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="muted fs-11">等级</span>
                    {(['low', 'medium', 'high'] as const).map(L => {
                      const active = m.level === L
                      const color =
                        L === 'high'
                          ? 'var(--danger)'
                          : L === 'medium'
                            ? 'var(--warn)'
                            : 'var(--info)'
                      const bg =
                        L === 'high'
                          ? 'rgba(239,68,68,.15)'
                          : L === 'medium'
                            ? 'rgba(245,158,11,.15)'
                            : 'rgba(34,211,238,.15)'
                      return (
                        <button
                          key={L}
                          onClick={() => !active && updateModule(m.module, { level: L })}
                          disabled={isSaving || !m.enabled}
                          style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 10.5,
                            fontWeight: 700,
                            fontFamily: 'JetBrains Mono',
                            background: active ? bg : 'transparent',
                            color: active ? color : 'var(--text-3)',
                            border: active
                              ? '1px solid currentColor'
                              : '1px solid var(--line)',
                            cursor:
                              isSaving || !m.enabled || active ? 'default' : 'pointer',
                          }}
                        >
                          {L.toUpperCase()}
                        </button>
                      )
                    })}
                  </div>
                  <span
                    className="mono fs-11"
                    style={{ color: m.enabled ? 'var(--text-2)' : 'var(--text-3)' }}
                  >
                    {m.enabled ? '✓ 启用' : '○ 禁用'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// 防护模块字符串 → UI 元数据。category 字段来自 modsec 规则目录名 + 'custom'。
const CATEGORY_META: Record<
  string,
  { label: string; ico: IconName; color: string }
> = {
  sqli: { label: 'SQL 注入', ico: 'database', color: '#ef4444' },
  xss: { label: 'XSS', ico: 'fire', color: '#f59e0b' },
  rce: { label: 'RCE / 反序列化', ico: 'crosshair', color: '#a855f7' },
  'lfi-rfi': { label: '路径遍历 / SSRF', ico: 'flow', color: '#22d3ee' },
  bot: { label: 'Bot / 扫描器', ico: 'eye', color: '#ec4899' },
  'rate-limit': { label: '限速 / 爆破', ico: 'activity', color: '#10b981' },
  'ip-reputation': { label: 'IP 信誉', ico: 'lock', color: '#3b82f6' },
  'virtual-patches': { label: '虚拟补丁 CVE', ico: 'shield', color: '#dc2626' },
  custom: { label: '自定义', ico: 'sparkles', color: '#8e84a3' },
}
const CATEGORY_ORDER = [
  'sqli',
  'xss',
  'rce',
  'lfi-rfi',
  'bot',
  'rate-limit',
  'ip-reputation',
  'virtual-patches',
  'custom',
]
function categoryMeta(c?: string) {
  return CATEGORY_META[c || 'custom'] ?? CATEGORY_META.custom
}

function RuleEngine({
  rules,
  onMove,
  onToggle,
  onEdit,
  dragSrcRef,
  dragOver,
  setDragOver,
}: {
  rules: Rule[]
  onMove: (fromId: string, toId: string) => void
  onToggle: (id: string) => void
  onEdit: (id: string) => void
  dragSrcRef: React.MutableRefObject<string | null>
  dragOver: string | null
  setDragOver: (id: string | null) => void
}) {
  const [activeCat, setActiveCat] = useState<string>('all')
  const [keyword, setKeyword] = useState('')

  // 按分类聚合数量；保持 CATEGORY_ORDER 序，没规则的分类也展示（chip 显示 0）
  const countByCat = useMemo(() => {
    const m: Record<string, number> = {}
    for (const r of rules) {
      const c = r.category || 'custom'
      m[c] = (m[c] ?? 0) + 1
    }
    return m
  }, [rules])

  const visibleCats = useMemo(
    () => CATEGORY_ORDER.filter(c => (countByCat[c] ?? 0) > 0),
    [countByCat],
  )

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return rules.filter(r => {
      if (activeCat !== 'all' && (r.category || 'custom') !== activeCat) return false
      if (kw) {
        const hay =
          r.name.toLowerCase() + ' ' + r.id + ' ' + (r.field || '').toLowerCase()
        if (!hay.includes(kw)) return false
      }
      return true
    })
  }, [rules, activeCat, keyword])

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
        meta={`${filtered.length} / ${rules.length} 条 · 拖拽调整优先级`}
        actions={
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="搜索规则名 / ID / 字段"
              style={{ width: 240 }}
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
            <select className="select">
              <option>全部站点</option>
            </select>
          </div>
        }
      >
        {/* 防护模块过滤 chip bar */}
        <div
          className="flex"
          style={{
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: 12,
            padding: '8px 0',
            borderBottom: '1px dashed var(--line-2)',
          }}
        >
          <CatChip
            active={activeCat === 'all'}
            label="全部"
            count={rules.length}
            color="var(--brand-1)"
            ico="grid"
            onClick={() => setActiveCat('all')}
          />
          {visibleCats.map(c => {
            const meta = categoryMeta(c)
            return (
              <CatChip
                key={c}
                active={activeCat === c}
                label={meta.label}
                count={countByCat[c] ?? 0}
                color={meta.color}
                ico={meta.ico}
                onClick={() => setActiveCat(c)}
              />
            )
          })}
        </div>

        <div>
          <div
            style={{
              display: 'grid',
              // 与设计稿 docs/ui/pages/protection.jsx 对齐：
              // 把『匹配模式』收窄到 minmax(0, 180px)，长 regex 在单元格内 ellipsis，
              // 后面列固定宽度，再也不会被推歪
              gridTemplateColumns:
                '28px 56px minmax(0, 1.4fr) 130px minmax(0, 180px) 100px 90px 130px',
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
          {filtered.length === 0 && (
            <div
              className="muted fs-12"
              style={{ padding: '40px 0', textAlign: 'center' }}
            >
              该分类下暂无规则{keyword && `（关键字 "${keyword}"）`}
            </div>
          )}
          {filtered.map(r => (
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
                gridTemplateColumns:
                  '28px 56px minmax(0, 1.4fr) 130px minmax(0, 180px) 100px 90px 130px',
                gap: 10,
                alignItems: 'center',
                padding: '10px 12px',
                borderBottom: '1px solid var(--line-2)',
                cursor: 'grab',
                background: dragOver === r.id ? 'rgba(168,85,247,.08)' : 'transparent',
                borderLeft:
                  dragOver === r.id ? '2px solid var(--brand-1)' : '2px solid transparent',
              }}
            >
              <span style={{ color: 'var(--text-3)' }}>
                <Icon name="grip" size={14} />
              </span>
              <span
                className="mono fs-11 fw-700"
                style={{
                  textAlign: 'center',
                  color: 'var(--brand-1)',
                  background: 'rgba(168,85,247,.10)',
                  padding: '3px 6px',
                  borderRadius: 4,
                }}
              >
                #{String(r.priority).padStart(2, '0')}
              </span>
              <div style={{ minWidth: 0 }}>
                <div
                  className="fw-600 text-0 fs-13 flex items-center gap-2"
                  style={{
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                  title={r.name}
                >
                  {/* 分类色点 */}
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: categoryMeta(r.category).color,
                      flexShrink: 0,
                    }}
                    title={categoryMeta(r.category).label}
                  />
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.name}
                  </span>
                  {r.builtin && (
                    <Tag kind="info" style={{ marginLeft: 4, fontSize: 9 }}>
                      内置
                    </Tag>
                  )}
                </div>
                <div
                  className="muted fs-11 mono"
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {categoryMeta(r.category).label} · {r.scope} · {r.id}
                </div>
              </div>
              <div
                className="mono fs-11"
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
                title={r.field}
              >
                {r.field}
              </div>
              <div
                className="mono fs-11"
                style={{
                  minWidth: 0,
                  padding: '3px 8px',
                  background: 'var(--bg-2)',
                  border: '1px solid var(--line)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--text-1)',
                }}
                title={r.match}
              >
                {r.match}
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
                <span
                  className="tbl-link fs-11"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onEdit(r.id)}
                >
                  编辑
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function CatChip({
  active,
  label,
  count,
  color,
  ico,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  color: string
  ico: IconName
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 10px',
        borderRadius: 999,
        border: '1px solid ' + (active ? color : 'var(--line)'),
        background: active ? color + '22' : 'transparent',
        color: active ? color : 'var(--text-2)',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: active ? 600 : 500,
        transition: 'all .15s',
      }}
    >
      <Icon name={ico} size={12} />
      <span>{label}</span>
      <span
        style={{
          padding: '1px 6px',
          borderRadius: 999,
          background: active ? color : 'var(--bg-2)',
          color: active ? '#fff' : 'var(--text-2)',
          fontSize: 10.5,
          fontFamily: 'JetBrains Mono',
          fontWeight: 700,
          minWidth: 18,
          textAlign: 'center',
        }}
      >
        {count}
      </span>
    </button>
  )
}

function AclPanel() {
  const [rules, setRules] = useState<AclRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState<'allow' | 'deny' | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      setRules(await aclApi.listAclRules())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setRules([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const allowRules = useMemo(() => rules.filter(r => r.action === 'allow'), [rules])
  const denyRules = useMemo(() => rules.filter(r => r.action === 'deny'), [rules])

  const onDelete = async (id: number, label: string) => {
    if (!window.confirm(`确认删除 ACL 规则『${label}』？`)) return
    try {
      await aclApi.deleteAclRule(id)
      await refresh()
    } catch (e: unknown) {
      window.alert(`删除失败：${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const onToggle = async (rule: AclRule) => {
    const next = !rule.is_enabled
    setRules(prev =>
      prev.map(r => (r.id === rule.id ? { ...r, is_enabled: next } : r)),
    )
    try {
      await aclApi.toggleAclRule(rule.id, next)
    } catch (e: unknown) {
      window.alert(`切换失败：${e instanceof Error ? e.message : String(e)}`)
      setRules(prev =>
        prev.map(r => (r.id === rule.id ? { ...r, is_enabled: rule.is_enabled } : r)),
      )
    }
  }

  return (
    <>
      {error && (
        <div
          className="fs-12 mb-3"
          style={{
            padding: '8px 12px',
            background: 'var(--bg-danger-1, #fee2e2)',
            color: 'var(--text-danger, #b91c1c)',
            borderRadius: 6,
          }}
        >
          加载 ACL 规则失败：{error}
        </div>
      )}
      <div className="row r-1-1 gap-3">
        <Card
          title="IP 白名单"
          ico="check"
          meta={`${allowRules.length} 条 · 信任源`}
          actions={
            <Button variant="line" size="sm" onClick={() => setAddOpen('allow')}>
              <Icon name="plus" size={11} className="ico" /> 添加白名单
            </Button>
          }
        >
          <div className="muted fs-12 mb-3">命中规则将立即放行，跳过其余检测。</div>
          <AclTable
            rules={allowRules}
            loading={loading}
            kind="allow"
            onDelete={onDelete}
            onToggle={onToggle}
          />
        </Card>

        <Card
          title="IP 黑名单 / 地理屏蔽"
          ico="lock"
          meta={`${denyRules.length} 条 · 拒绝源`}
          actions={
            <Button variant="line" size="sm" onClick={() => setAddOpen('deny')}>
              <Icon name="plus" size={11} className="ico" /> 添加黑名单
            </Button>
          }
        >
          <div className="muted fs-12 mb-3">命中规则将直接 403 拦截。</div>
          <AclTable
            rules={denyRules}
            loading={loading}
            kind="deny"
            onDelete={onDelete}
            onToggle={onToggle}
          />
        </Card>
      </div>

      {addOpen && (
        <AclCreateModal
          kind={addOpen}
          onCancel={() => setAddOpen(null)}
          onSubmit={async payload => {
            await aclApi.createAclRule({ ...payload, action: addOpen })
            setAddOpen(null)
            await refresh()
          }}
        />
      )}
    </>
  )
}

function AclTable({
  rules,
  loading,
  kind,
  onDelete,
  onToggle,
}: {
  rules: AclRule[]
  loading: boolean
  kind: 'allow' | 'deny'
  onDelete: (id: number, label: string) => void
  onToggle: (r: AclRule) => void
}) {
  if (loading) {
    return (
      <div className="muted fs-12" style={{ padding: '16px 0', textAlign: 'center' }}>
        加载中…
      </div>
    )
  }
  if (rules.length === 0) {
    return (
      <div className="muted fs-12" style={{ padding: '20px 0', textAlign: 'center' }}>
        暂无{kind === 'allow' ? '白名单' : '黑名单'}规则。点右上按钮添加第一条。
      </div>
    )
  }
  return (
    <table>
      <thead>
        <tr>
          <th style={{ width: 60 }}>动作</th>
          <th>IP / CIDR</th>
          <th>名称</th>
          <th>启用</th>
          <th style={{ width: 60 }}>操作</th>
        </tr>
      </thead>
      <tbody>
        {rules.map(r => (
          <tr key={r.id}>
            <td>
              <Tag kind={kind === 'allow' ? 'ok' : 'danger'}>
                <span className="dot" />
                {kind === 'allow' ? '放行' : '拦截'}
              </Tag>
            </td>
            <td className="mono fs-12">{r.src_ip}</td>
            <td>
              <div className="fs-13 text-0">{r.name}</div>
              {r.description && <div className="muted fs-11">{r.description}</div>}
            </td>
            <td>
              <Toggle on={r.is_enabled} onChange={() => onToggle(r)} />
            </td>
            <td>
              <span
                className="tbl-link"
                style={{ cursor: 'pointer', color: 'var(--danger)' }}
                onClick={() => onDelete(r.id, r.name)}
              >
                删除
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function AclCreateModal(props: {
  kind: 'allow' | 'deny'
  onCancel: () => void
  onSubmit: (payload: { name: string; src_ip: string; description: string }) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [srcIp, setSrcIp] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const onConfirm = async () => {
    if (!name.trim() || !srcIp.trim()) {
      setErr('名称和 IP/CIDR 都必填')
      return
    }
    setSubmitting(true)
    setErr(null)
    try {
      await props.onSubmit({
        name: name.trim(),
        src_ip: srcIp.trim(),
        description: description.trim(),
      })
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
      setSubmitting(false)
    }
  }

  const isAllow = props.kind === 'allow'
  return (
    <div
      onClick={props.onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13,10,24,.62)',
        backdropFilter: 'blur(4px)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width: 460,
          maxWidth: 'calc(100vw - 32px)',
          background: 'var(--bg-1)',
          border: '1px solid var(--line-strong)',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div className="mb-3">
          <div className="fw-700 text-0 fs-16">
            {isAllow ? '添加 IP 白名单' : '添加 IP 黑名单'}
          </div>
          <div className="muted fs-12 mt-1">
            {isAllow
              ? '命中后立即放行，跳过所有 modsec 检测'
              : '命中后直接 403 拦截，先于 modsec 规则生效'}
          </div>
        </div>

        <div className="mb-3">
          <label
            className="fs-12 fw-600"
            style={{ display: 'block', marginBottom: 6, color: 'var(--text-0)' }}
          >
            名称 <span style={{ color: 'var(--brand-1)' }}>*</span>
          </label>
          <input
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={isAllow ? '如 内部办公网络' : '如 已知恶意 ASN'}
            autoFocus
          />
        </div>
        <div className="mb-3">
          <label
            className="fs-12 fw-600"
            style={{ display: 'block', marginBottom: 6, color: 'var(--text-0)' }}
          >
            IP / CIDR <span style={{ color: 'var(--brand-1)' }}>*</span>
          </label>
          <input
            className="input"
            value={srcIp}
            onChange={e => setSrcIp(e.target.value)}
            placeholder="如 10.0.0.0/8 或 203.0.113.10"
          />
          <div className="muted fs-11" style={{ marginTop: 4 }}>
            支持单 IP、IPv4/IPv6 CIDR；国家代码（IR / KP 等）通过 ip-reputation 模块处理
          </div>
        </div>
        <div className="mb-3">
          <label
            className="fs-12 fw-600"
            style={{ display: 'block', marginBottom: 6, color: 'var(--text-0)' }}
          >
            备注
          </label>
          <textarea
            className="input"
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        {err && (
          <div
            className="fs-12"
            style={{
              padding: '8px 12px',
              marginBottom: 10,
              background: 'var(--bg-danger-1, #fee2e2)',
              color: 'var(--text-danger, #b91c1c)',
              borderRadius: 6,
            }}
          >
            {err}
          </div>
        )}

        <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="ghost" onClick={props.onCancel}>
            取消
          </Button>
          <Button variant="pri" onClick={onConfirm} disabled={submitting}>
            {submitting ? '创建中…' : `创建${isAllow ? '白名单' : '黑名单'}`}
          </Button>
        </div>
      </div>
    </div>
  )
}

function BotPanel() {
  // 5 种挑战模式由 bot_challenges 表持久化（migration 000022）。
  // Bot 风险分布留装饰，需 metrics-history 落地后才能换真值。
  const CHALLENGE_META: Array<{ k: policyApi.ChallengeKind; l: string; d: string }> = [
    { k: 'js', l: 'JS Challenge', d: '透明 JS 计算挑战' },
    { k: 'tls', l: 'TLS 指纹白名单', d: 'JA3 / JA4 指纹库' },
    { k: 'dev', l: '设备指纹', d: 'Canvas + WebGL' },
    { k: 'slider', l: '滑块验证码', d: '人机交互验证' },
    { k: 'behave', l: '行为分析', d: '鼠标 / 输入韵律' },
  ]

  const [sites, setSites] = useState<Site[]>([])
  const [siteId, setSiteId] = useState<string>('')
  const [items, setItems] = useState<policyApi.BotChallengeConfig[]>([])
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    siteApi
      .listSites()
      .then(list => {
        setSites(list)
        if (list.length > 0) setSiteId(prev => prev || list[0].id)
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.warn('[bot] sites', err)
      })
  }, [])

  useEffect(() => {
    if (!siteId) return
    policyApi
      .listBotChallenges(siteId)
      .then(setItems)
      .catch(err => {
        // eslint-disable-next-line no-console
        console.warn('[bot] challenges', err)
      })
  }, [siteId])

  const toggle = async (ch: policyApi.ChallengeKind, v: boolean) => {
    if (!siteId) return
    const prev = items
    setItems(items.map(i => (i.challenge === ch ? { ...i, enabled: v } : i)))
    setSaving(ch)
    try {
      await policyApi.updateBotChallenge(siteId, ch, { enabled: v })
    } catch (err: unknown) {
      window.alert(`切换失败：${err instanceof Error ? err.message : String(err)}`)
      setItems(prev)
    } finally {
      setSaving(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="muted fs-12">
          应用范围：
          <span className="text-0 fw-600">
            {sites.find(s => s.id === siteId)?.name || '请选择站点'}
          </span>
        </div>
        <select
          className="select"
          value={siteId}
          onChange={e => setSiteId(e.target.value)}
          style={{ minWidth: 220 }}
        >
          {sites.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.domain}
            </option>
          ))}
        </select>
      </div>

      <div className="row r-2-1 gap-3">
        <Card title="Bot 风险分布" ico="crosshair" meta="近 24h · 装饰示例">
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
          <div
            className="muted fs-11 mt-2"
            style={{
              padding: 8,
              background: 'var(--bg-2)',
              borderRadius: 6,
              lineHeight: 1.6,
            }}
          >
            🛈 风险分类统计需 bot 识别管线（agent 上报）+ metrics-history 落地。
            当前为装饰示例，挑战开关已接真后端。
          </div>
        </Card>
        <Card title="挑战模式" ico="sparkles" meta={`${items.filter(i => i.enabled).length}/${items.length} 启用`}>
          <div className="stack" style={{ gap: 14 }}>
            {CHALLENGE_META.map(x => {
              const cur = items.find(i => i.challenge === x.k)
              return (
                <div
                  key={x.k}
                  className="flex items-center gap-3"
                  style={{
                    padding: '8px 0',
                    borderBottom: '1px solid var(--line-2)',
                    opacity: saving === x.k ? 0.6 : 1,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div className="fw-600 text-0 fs-13">{x.l}</div>
                    <div className="muted fs-11">{x.d}</div>
                  </div>
                  <Toggle on={cur?.enabled ?? false} onChange={v => toggle(x.k, v)} />
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

function ApiSecurityPanel() {
  const [sites, setSites] = useState<Site[]>([])
  const [siteId, setSiteId] = useState<string>('')
  const [endpoints, setEndpoints] = useState<policyApi.APIEndpoint[]>([])
  const [kpi, setKpi] = useState<policyApi.APIKPI | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    siteApi
      .listSites()
      .then(list => {
        setSites(list)
        if (list.length > 0) setSiteId(prev => prev || list[0].id)
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.warn('[api panel] sites', err)
      })
  }, [])

  const refresh = async () => {
    if (!siteId) return
    setLoading(true)
    const [eRes, kRes] = await Promise.allSettled([
      policyApi.listAPIEndpoints(siteId),
      policyApi.getAPIKPI(siteId),
    ])
    if (eRes.status === 'fulfilled') setEndpoints(eRes.value)
    if (kRes.status === 'fulfilled') setKpi(kRes.value)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId])

  const [showAddEndpoint, setShowAddEndpoint] = useState(false)

  // 之前用 4 个连串 window.prompt() —— Firefox/Safari 第二次会弹『阻止此页面继续显示对话框』，
  // iframe 中直接被屏蔽返回 null，且无字段校验。改成 Modal 表单。

  const removeEndpoint = async (e: policyApi.APIEndpoint) => {
    if (!window.confirm(`确认删除 ${e.method} ${e.path}？`)) return
    try {
      await policyApi.deleteAPIEndpoint(e.id)
      await refresh()
    } catch (err: unknown) {
      window.alert(`删除失败：${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return (
    <div className="stack">
      <div className="flex items-center justify-between mb-3">
        <div className="muted fs-12">
          应用范围：
          <span className="text-0 fw-600">
            {sites.find(s => s.id === siteId)?.name || '请选择站点'}
          </span>
        </div>
        <select
          className="select"
          value={siteId}
          onChange={e => setSiteId(e.target.value)}
          style={{ minWidth: 220 }}
        >
          {sites.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.domain}
            </option>
          ))}
        </select>
      </div>

      <div className="row r-4">
        <div className="card kpi brand" style={{ padding: 16 }}>
          <div className="kpi-lbl muted fs-12">已注册 API</div>
          <div className="kpi-val fw-700 fs-20 mono">{kpi?.registered ?? '—'}</div>
        </div>
        <div className="card kpi danger" style={{ padding: 16 }}>
          <div className="kpi-lbl muted fs-12">未授权访问拦截</div>
          <div className="kpi-val fw-700 fs-20 mono">
            {kpi?.unauthorized_blocks_24h ?? 0}
          </div>
        </div>
        <div className="card kpi warn" style={{ padding: 16 }}>
          <div className="kpi-lbl muted fs-12">JWT 重放阻断</div>
          <div className="kpi-val fw-700 fs-20 mono">{kpi?.jwt_replay_blocks_24h ?? 0}</div>
        </div>
        <div className="card kpi info" style={{ padding: 16 }}>
          <div className="kpi-lbl muted fs-12">敏感字段脱敏</div>
          <div className="kpi-val fw-700 fs-20 mono">{kpi?.sensitive_masked_24h ?? 0}</div>
        </div>
      </div>
      <Card
        title="API 端点列表"
        ico="flow"
        meta={loading ? '加载中…' : `${endpoints.length} 个端点`}
        actions={
          <Button variant="line" size="sm" onClick={() => setShowAddEndpoint(true)}>
            <Icon name="plus" size={11} className="ico" />
            登记端点
          </Button>
        }
      >
        {endpoints.length === 0 && !loading ? (
          <div
            className="muted fs-12"
            style={{ padding: '24px 0', textAlign: 'center', lineHeight: 1.7 }}
          >
            暂无已登记的 API 端点。
            <br />
            点右上『登记端点』手工添加，或导入 Swagger（待落地）。
          </div>
        ) : (
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
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map(e => (
                <tr key={e.id}>
                  <td>
                    <Tag kind={e.method === 'GET' ? 'info' : e.method === 'POST' ? 'pink' : 'warn'}>
                      {e.method}
                    </Tag>
                  </td>
                  <td className="mono fs-12">{e.path}</td>
                  <td>{e.auth_type}</td>
                  <td className="mono">{e.rate_limit || '—'}</td>
                  <td>
                    <Tag kind={e.schema_status === 'imported' ? 'ok' : 'def'}>
                      {e.schema_status === 'imported'
                        ? '已导入'
                        : e.schema_status === 'failed'
                          ? '失败'
                          : '待导入'}
                    </Tag>
                  </td>
                  <td className="mono">{e.qps}</td>
                  <td>
                    <Tag kind={e.status === 'ok' ? 'ok' : e.status === 'warn' ? 'warn' : 'danger'}>
                      <span className="dot" />
                      {e.status === 'ok' ? '健康' : e.status === 'warn' ? '提醒' : '故障'}
                    </Tag>
                  </td>
                  <td className="fs-12">
                    <span
                      className="tbl-link"
                      style={{ cursor: 'pointer', color: 'var(--danger)' }}
                      onClick={() => removeEndpoint(e)}
                    >
                      删除
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showAddEndpoint && siteId && (
        <AddEndpointModal
          siteId={siteId}
          onCancel={() => setShowAddEndpoint(false)}
          onSubmit={async payload => {
            await policyApi.createAPIEndpoint(siteId, payload)
            setShowAddEndpoint(false)
            await refresh()
          }}
        />
      )}
    </div>
  )
}

// API 端点登记弹窗 —— 替代之前 4 串 window.prompt（Firefox 第二次会被屏蔽）
function AddEndpointModal(props: {
  siteId: string | number
  onCancel: () => void
  onSubmit: (
    payload: Partial<policyApi.APIEndpoint> & { method: string; path: string },
  ) => Promise<void>
}) {
  const [method, setMethod] = useState<string>('POST')
  const [path, setPath] = useState<string>('')
  const [authType, setAuthType] = useState<string>('JWT')
  const [rateLimit, setRateLimit] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const onConfirm = async () => {
    if (!path.trim()) {
      setErr('路径必填')
      return
    }
    if (!path.trim().startsWith('/')) {
      setErr('路径必须以 / 开头')
      return
    }
    setSubmitting(true)
    setErr(null)
    try {
      await props.onSubmit({
        method: method.toUpperCase().trim(),
        path: path.trim(),
        auth_type: authType.trim() || 'JWT',
        rate_limit: rateLimit.trim(),
        description: description.trim(),
        schema_status: 'pending',
        status: 'ok',
      })
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
      setSubmitting(false)
    }
  }

  return (
    <div
      onClick={props.onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13,10,24,.62)',
        backdropFilter: 'blur(4px)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width: 480,
          maxWidth: 'calc(100vw - 32px)',
          background: 'var(--bg-1)',
          border: '1px solid var(--line-strong)',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div className="fw-700 text-0 fs-16 mb-3">登记 API 端点</div>
        <div className="row r-1-1 gap-3 mb-3">
          <div className="field">
            <label>方法 *</label>
            <select className="select" value={method} onChange={e => setMethod(e.target.value)}>
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
              <option>PATCH</option>
              <option>OPTIONS</option>
            </select>
          </div>
          <div className="field">
            <label>认证</label>
            <select
              className="select"
              value={authType}
              onChange={e => setAuthType(e.target.value)}
            >
              <option>None</option>
              <option>JWT</option>
              <option>JWT+MFA</option>
              <option>OAuth</option>
              <option>APIKey</option>
            </select>
          </div>
        </div>
        <div className="field mb-3">
          <label>路径 *</label>
          <input
            className="input"
            placeholder="/api/v1/login"
            value={path}
            onChange={e => setPath(e.target.value)}
            autoFocus
          />
        </div>
        <div className="field mb-3">
          <label>速率限制（可选）</label>
          <input
            className="input"
            placeholder="如 100/s 或 5/min/IP"
            value={rateLimit}
            onChange={e => setRateLimit(e.target.value)}
          />
        </div>
        <div className="field mb-3">
          <label>备注</label>
          <textarea
            className="input"
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>
        {err && (
          <div
            className="fs-12 mb-3"
            style={{
              padding: '8px 12px',
              background: 'var(--bg-danger-1, #fee2e2)',
              color: 'var(--text-danger, #b91c1c)',
              borderRadius: 6,
            }}
          >
            {err}
          </div>
        )}
        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={props.onCancel}>
            取消
          </Button>
          <Button variant="pri" onClick={onConfirm} disabled={submitting}>
            {submitting ? '登记中…' : '登记端点'}
          </Button>
        </div>
      </div>
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
