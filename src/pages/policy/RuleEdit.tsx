import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Icon, type IconName, Tag, Button, Toggle, Tabs, cn, KPI } from '@/components/ui'
import { AreaChart, BarChartH } from '@/components/charts'
import { RULES, SITES, mkAttack } from '@/mocks/nebula'
import { hexA } from '@/components/charts/canvasUtils'
import * as policyApi from '@/api/live/policy'

type Action = 'block' | 'challenge' | 'rate' | 'allow' | 'log' | 'redirect'
type Severity = 'low' | 'medium' | 'high'
type TabKey = 'builder' | 'dsl' | 'test' | 'hits' | 'history'

interface Cond {
  id: number
  field: string
  op: string
  value: string
  not: boolean
}
interface Chain {
  id: number
  op: 'WHEN' | 'AND' | 'OR'
  conditions: Cond[]
}
interface RuleData {
  id: string
  name: string
  scope: string
  action: Action
  enabled: boolean
  priority: number
  severity: Severity
  logSamples: boolean
  chains: Chain[]
}

const FIELDS = [
  { v: 'uri', l: '请求 URI', group: '请求' },
  { v: 'method', l: '方法', group: '请求' },
  { v: 'host', l: 'Host', group: '请求' },
  { v: 'query', l: '查询字符串', group: '请求' },
  { v: 'body', l: '请求体', group: '请求' },
  { v: 'header.UA', l: 'User-Agent', group: '请求头' },
  { v: 'header.Referer', l: 'Referer', group: '请求头' },
  { v: 'header.Authorization', l: 'Authorization', group: '请求头' },
  { v: 'header.Cookie', l: 'Cookie', group: '请求头' },
  { v: 'header.X-Forwarded-For', l: 'X-Forwarded-For', group: '请求头' },
  { v: 'client.ip', l: '客户端 IP', group: '客户端' },
  { v: 'geo.country', l: '国家', group: '客户端' },
  { v: 'tls.fingerprint', l: 'TLS 指纹', group: '客户端' },
]
const OPS = [
  { v: 'equals', l: '等于' },
  { v: 'not_equals', l: '不等于' },
  { v: 'contains', l: '包含' },
  { v: 'regex', l: '正则匹配' },
  { v: 'prefix', l: '前缀' },
  { v: 'cidr', l: 'CIDR 包含' },
  { v: 'in', l: '属于集合' },
  { v: 'gt', l: '大于' },
  { v: 'lt', l: '小于' },
]

export default function RuleEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const seed = RULES.find(r => r.id === id) ?? RULES[0]
  const isNew = !id

  const [rule, setRule] = useState<RuleData>(() => ({
    id: isNew ? '' : seed.id,
    name: isNew ? '' : seed.name,
    scope: isNew ? '全部站点' : seed.scope,
    action: isNew ? 'block' : (seed.action as Action),
    enabled: isNew ? true : seed.enabled,
    priority: isNew ? 99 : seed.priority,
    severity: 'high',
    logSamples: true,
    chains: [
      {
        id: 1,
        op: 'WHEN',
        conditions: [
          {
            id: 11,
            field: isNew ? 'uri' : seed.field || 'uri',
            op: 'regex',
            value: isNew ? '' : '(union|select|drop)\\s',
            not: false,
          },
        ],
      },
    ],
  }))

  const [tab, setTab] = useState<TabKey>('builder')
  const [testInput, setTestInput] = useState({
    method: 'POST',
    url: "/api/v1/users?id=1' OR '1'='1",
    headers: 'User-Agent: sqlmap/1.7\nContent-Type: application/json',
    body: '{"username":"admin", "filter":"1=1"}',
  })
  const [testResult, setTestResult] = useState<null | {
    matched: boolean
    time: string
    hitConds: number[]
    action: Action | 'pass'
  }>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const setR = (patch: Partial<RuleData>) => {
    setRule(r => ({ ...r, ...patch }))
    setDirty(true)
  }
  const close = () => navigate('/policy')

  // chain → backend match 字符串：取第一个 condition 的 op:value，
  // 后端 match 是单值字符串（migration 000012）。完整 chain 表达式
  // 后续走 DSL 端点，先保证最小可用：能保存、能在列表里看到。
  const buildMatch = (): { field: string; match: string } => {
    const allConds = rule.chains.flatMap(c => c.conditions)
    const first = allConds.find(c => c.field && c.value)
    if (!first) return { field: rule.chains[0]?.conditions[0]?.field || '', match: '' }
    const prefix = first.not ? '!' : ''
    return { field: first.field, match: `${prefix}${first.op}:${first.value}` }
  }

  const save = async () => {
    if (!rule.name.trim()) {
      setSaveErr('规则名称必填')
      return
    }
    setSaving(true)
    setSaveErr(null)
    try {
      const { field, match } = buildMatch()
      // 后端 action enum 暂不含 redirect，先映射到 block（保留语义=拦截当前请求）。
      // 真正的 302 跳转放到 modsec rules 模板里实现，迁移后再扩 enum。
      const backendAction: 'block' | 'log' | 'allow' | 'rate' | 'challenge' =
        rule.action === 'redirect' ? 'block' : rule.action
      const payload = {
        name: rule.name.trim(),
        severity: rule.severity,
        action: backendAction,
        enabled: rule.enabled,
        scope: rule.scope,
        field,
        match,
        priority: rule.priority,
        builtin: false,
      }
      if (isNew) {
        await policyApi.createRule(payload)
      } else {
        await policyApi.updateRule(rule.id, payload)
      }
      setDirty(false)
      navigate('/policy')
    } catch (e: unknown) {
      setSaveErr(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  // 试运行：调后端 /policies/dry-run，结果格式化成 UI 已有的 testResult 形状。
  // 后端 evalRule 接受 field+match 单条；多 chain 的情况下，把『所有条件 AND』
  // 折叠成一条复合（仍只用第一条；多条件等后端支持 chain 时再扩）。
  const runTest = async () => {
    const allConds = rule.chains.flatMap(c => c.conditions)
    if (allConds.length === 0) {
      setTestResult({ matched: false, time: '0.000', hitConds: [], action: 'pass' })
      return
    }
    const first = allConds[0]
    const matchExpr = `${first.op}:${first.value || ''}`
    // 解析 headers 字符串 "Header-Name: value\nOther: x" → Record
    const headers: Record<string, string> = {}
    testInput.headers.split(/\r?\n/).forEach(line => {
      const idx = line.indexOf(':')
      if (idx > 0) {
        headers[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
      }
    })
    try {
      const backendAction: 'block' | 'log' | 'allow' | 'rate' | 'challenge' =
        rule.action === 'redirect' ? 'block' : rule.action
      const res = await policyApi.dryRunRule({
        rule: {
          id: isNew ? undefined : Number(rule.id) || undefined,
          name: rule.name,
          field: first.field,
          match: matchExpr,
          action: backendAction,
        },
        request: {
          method: testInput.method,
          url: testInput.url,
          headers,
          body: testInput.body,
        },
      })
      setTestResult({
        matched: res.matched !== first.not,
        time: res.time_ms.toFixed(3),
        hitConds: res.matched ? [first.id] : [],
        action: (res.matched !== first.not
          ? rule.action
          : 'pass') as 'block' | 'challenge' | 'rate' | 'allow' | 'log' | 'redirect' | 'pass',
      })
    } catch (e: unknown) {
      setTestResult({
        matched: false,
        time: '0.000',
        hitConds: [],
        action: 'pass',
      })
      window.alert(`试运行失败：${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <>
      <div className="page-hd">
        <div>
          <h1>
            <span className="ord">RULE</span>
            {isNew ? '新建规则' : rule.name || '<未命名规则>'}
          </h1>
          <p className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
            <span className="mono muted">{rule.id || 'r-new'}</span>
            <span className="muted">·</span>
            <span>{rule.scope}</span>
            <span className="muted">·</span>
            <span className="mono fs-12 t-pink">优先级 #{String(rule.priority).padStart(2, '0')}</span>
            {dirty && (
              <Tag kind="warn">
                <span className="dot" />
                未保存的变更
              </Tag>
            )}
            {!dirty && !isNew && (
              <Tag kind="ok">
                <span className="dot" />
                已保存
              </Tag>
            )}
          </p>
        </div>
        <div className="actions">
          <Button variant="ghost" onClick={close}>
            <Icon name="x" size={13} className="ico" />
            取消
          </Button>
          <Button variant="line" onClick={runTest}>
            <Icon name="play" size={13} className="ico" />
            试运行
          </Button>
          <Button
            variant="line"
            onClick={async () => {
              if (!rule.name.trim()) {
                window.alert('请先填入规则名再另存为副本')
                return
              }
              try {
                const { field, match } = buildMatch()
                const backendAction: 'block' | 'log' | 'allow' | 'rate' | 'challenge' =
                  rule.action === 'redirect' ? 'block' : rule.action
                await policyApi.createRule({
                  name: `${rule.name.trim()} - 副本`,
                  severity: rule.severity,
                  action: backendAction,
                  enabled: false, // 副本默认禁用，避免立刻生效
                  scope: rule.scope,
                  field,
                  match,
                  priority: rule.priority,
                  builtin: false,
                })
                window.alert('已创建副本，副本默认禁用。回到规则列表后启用即可。')
                navigate('/policy')
              } catch (e: unknown) {
                window.alert(`另存为副本失败：${e instanceof Error ? e.message : String(e)}`)
              }
            }}
          >
            <Icon name="logs" size={13} className="ico" />
            另存为副本
          </Button>
          <Button
            variant={dirty || isNew ? 'pri' : 'ghost'}
            disabled={(!dirty && !isNew) || saving}
            onClick={save}
          >
            <Icon name="check" size={13} className="ico" />
            {saving ? '保存中…' : '保存'}
          </Button>
        </div>
      </div>

      {saveErr && (
        <div
          className="card mb-3"
          style={{
            padding: '10px 14px',
            background: 'var(--bg-danger-1, #fee2e2)',
            color: 'var(--text-danger, #b91c1c)',
            fontSize: 13,
          }}
        >
          保存失败：{saveErr}
        </div>
      )}

      <div
        className="card mb-4"
        style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,.06), rgba(236,72,153,.03) 60%, var(--bg-1))',
        }}
      >
        <div className="card-bd" style={{ padding: '14px 18px' }}>
          <div className="row r-4 gap-3">
            <div className="field">
              <label>规则名称 *</label>
              <input
                className="input"
                value={rule.name}
                onChange={e => setR({ name: e.target.value })}
                placeholder="如：阻断 SQL UNION 注入"
              />
            </div>
            <div className="field">
              <label>适用站点</label>
              <select
                className="select"
                value={rule.scope}
                onChange={e => setR({ scope: e.target.value })}
              >
                <option>全部站点</option>
                {SITES.map(s => (
                  <option key={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>优先级</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="input"
                  value={rule.priority}
                  onChange={e => setR({ priority: +e.target.value })}
                  style={{ width: 80 }}
                />
                <span className="muted fs-11">小者优先</span>
              </div>
            </div>
            <div className="field">
              <label>规则状态</label>
              <div className="flex items-center gap-3" style={{ height: 34 }}>
                <Toggle on={rule.enabled} onChange={v => setR({ enabled: v })} />
                <span
                  className="fs-12"
                  style={{ color: rule.enabled ? 'var(--ok)' : 'var(--text-3)' }}
                >
                  {rule.enabled ? '● 已启用' : '○ 已停用'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs
        tabs={[
          { value: 'builder', label: '可视化构造', ico: 'sliders' },
          { value: 'dsl', label: 'DSL 代码', ico: 'logs' },
          { value: 'test', label: '测试与验证', ico: 'crosshair' },
          { value: 'hits', label: '命中分析', ico: 'activity' },
          { value: 'history', label: '版本历史', ico: 'refresh' },
        ]}
        value={tab}
        onChange={v => setTab(v as TabKey)}
      />

      <div className="row r-2-1">
        <div>
          {tab === 'builder' && <BuilderPane rule={rule} setR={setR} />}
          {tab === 'dsl' && <DslPane rule={rule} />}
          {tab === 'test' && (
            <TestPane
              input={testInput}
              setInput={setTestInput}
              result={testResult}
              onRun={runTest}
              rule={rule}
            />
          )}
          {tab === 'hits' && <HitsPane />}
          {tab === 'history' && <HistoryPane />}
        </div>

        <SidePanel rule={rule} testResult={testResult} />
      </div>
    </>
  )
}

function BuilderPane({
  rule,
  setR,
}: {
  rule: RuleData
  setR: (p: Partial<RuleData>) => void
}) {
  const addChain = () =>
    setR({
      chains: [
        ...rule.chains,
        {
          id: Date.now(),
          op: 'AND',
          conditions: [{ id: Date.now() + 1, field: 'uri', op: 'contains', value: '', not: false }],
        },
      ],
    })
  const updateChain = (id: number, patch: Partial<Chain>) =>
    setR({ chains: rule.chains.map(c => (c.id === id ? { ...c, ...patch } : c)) })
  const removeChain = (id: number) => setR({ chains: rule.chains.filter(c => c.id !== id) })
  const addCond = (chainId: number) => {
    const c = rule.chains.find(x => x.id === chainId)
    if (!c) return
    updateChain(chainId, {
      conditions: [
        ...c.conditions,
        { id: Date.now(), field: 'uri', op: 'contains', value: '', not: false },
      ],
    })
  }
  const updateCond = (chainId: number, condId: number, patch: Partial<Cond>) => {
    const c = rule.chains.find(x => x.id === chainId)
    if (!c) return
    updateChain(chainId, {
      conditions: c.conditions.map(cn => (cn.id === condId ? { ...cn, ...patch } : cn)),
    })
  }
  const removeCond = (chainId: number, condId: number) => {
    const c = rule.chains.find(x => x.id === chainId)
    if (!c) return
    updateChain(chainId, { conditions: c.conditions.filter(cn => cn.id !== condId) })
  }

  const grouped: Record<string, typeof FIELDS> = {}
  FIELDS.forEach(f => {
    if (!grouped[f.group]) grouped[f.group] = []
    grouped[f.group].push(f)
  })

  return (
    <>
      <Card
        title="匹配条件"
        ico="filter"
        meta={`${rule.chains.length} 个条件组 · 全部满足时触发`}
        actions={
          <Button variant="line" size="sm" onClick={addChain}>
            <Icon name="plus" size={11} className="ico" />
            添加条件组
          </Button>
        }
      >
        <div className="stack" style={{ gap: 8 }}>
          {rule.chains.map((chain, ci) => (
            <div
              key={chain.id}
              style={{
                padding: 14,
                borderRadius: 10,
                background: 'var(--bg-0)',
                border: '1px solid var(--line)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {ci === 0 ? (
                    <Tag kind="pink" lg>
                      WHEN
                    </Tag>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div style={{ display: 'inline-flex', borderRadius: 6, border: '1px solid var(--line)' }}>
                        {(['AND', 'OR'] as const).map(op => (
                          <button
                            key={op}
                            onClick={() => updateChain(chain.id, { op })}
                            style={{
                              padding: '4px 12px',
                              background: chain.op === op ? 'var(--grad-brand)' : 'transparent',
                              color: chain.op === op ? '#fff' : 'var(--text-2)',
                              border: 'none',
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: 1,
                              fontFamily: 'JetBrains Mono',
                              cursor: 'pointer',
                            }}
                          >
                            {op}
                          </button>
                        ))}
                      </div>
                      <span className="muted fs-11">连接前一组</span>
                    </div>
                  )}
                  <span className="muted fs-11">— 条件组 #{ci + 1}</span>
                </div>
                {ci > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => removeChain(chain.id)}>
                    <Icon name="trash" size={11} className="ico" />
                  </Button>
                )}
              </div>

              <div className="stack" style={{ gap: 6 }}>
                {chain.conditions.map((cond, condIdx) => (
                  <div
                    key={cond.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 60px 1fr 130px 1.5fr 28px',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
                    <span className="muted fs-10 mono" style={{ textAlign: 'center' }}>
                      {condIdx === 0 ? '' : 'AND'}
                    </span>
                    <button
                      onClick={() => updateCond(chain.id, cond.id, { not: !cond.not })}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: cond.not ? 'rgba(239,68,68,.12)' : 'transparent',
                        color: cond.not ? 'var(--danger)' : 'var(--text-3)',
                        border: '1px solid ' + (cond.not ? 'var(--danger)' : 'var(--line)'),
                        fontSize: 10.5,
                        fontWeight: 700,
                        fontFamily: 'JetBrains Mono',
                        cursor: 'pointer',
                      }}
                    >
                      {cond.not ? 'NOT' : 'IS'}
                    </button>
                    <select
                      className="select"
                      value={cond.field}
                      onChange={e => updateCond(chain.id, cond.id, { field: e.target.value })}
                    >
                      {Object.entries(grouped).map(([g, items]) => (
                        <optgroup key={g} label={g}>
                          {items.map(f => (
                            <option key={f.v} value={f.v}>
                              {f.l}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <select
                      className="select"
                      value={cond.op}
                      onChange={e => updateCond(chain.id, cond.id, { op: e.target.value })}
                    >
                      {OPS.map(op => (
                        <option key={op.v} value={op.v}>
                          {op.l}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input"
                      placeholder="值 / 表达式"
                      value={cond.value}
                      onChange={e => updateCond(chain.id, cond.id, { value: e.target.value })}
                      style={{
                        fontFamily: 'JetBrains Mono',
                        fontSize: 11.5,
                        color: cond.op === 'regex' ? 'var(--brand-2)' : undefined,
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCond(chain.id, cond.id)}
                      disabled={chain.conditions.length === 1}
                    >
                      <Icon name="trash" size={11} className="ico" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => addCond(chain.id)}
                style={{ width: '100%', justifyContent: 'center', borderStyle: 'dashed', marginTop: 12 }}
              >
                <Icon name="plus" size={11} className="ico" />
                添加条件
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <ActionPicker rule={rule} setR={setR} />

      <Card title="高级选项" ico="sliders" className="mt-4">
        <div className="stack" style={{ gap: 14 }}>
          <RowToggle
            label="记录匹配样本"
            hint="命中时保存原始请求 · 用于后续取证"
            value={rule.logSamples}
            onChange={v => setR({ logSamples: v })}
          />
          <RowToggle label="忽略大小写" hint="对字符串匹配应用 (?i)" value onChange={() => {}} />
          <RowToggle label="排除已知白名单" hint="若来源命中白名单则跳过此规则" value onChange={() => {}} />
          <div className="flex items-center gap-3">
            <div style={{ flex: 1 }}>
              <div className="fw-600 text-0 fs-13">速率限制</div>
              <div className="muted fs-11">每 IP 每秒最大请求数（达到后执行动作）</div>
            </div>
            <input className="input" defaultValue="100" style={{ width: 100 }} />
            <span className="muted fs-12">req/s</span>
          </div>
          <div className="flex items-center gap-3">
            <div style={{ flex: 1 }}>
              <div className="fw-600 text-0 fs-13">规则等级</div>
              <div className="muted fs-11">用于日志聚合与告警分级</div>
            </div>
            <div className="flex gap-2">
              {(
                [
                  { v: 'low', l: '低', c: 'var(--info)' },
                  { v: 'medium', l: '中', c: 'var(--warn)' },
                  { v: 'high', l: '高', c: 'var(--danger)' },
                ] as const
              ).map(s => (
                <button
                  key={s.v}
                  onClick={() => setR({ severity: s.v })}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 6,
                    border: '1px solid ' + (rule.severity === s.v ? s.c : 'var(--line)'),
                    background: rule.severity === s.v ? hexA('#a855f7', 0.12) : 'transparent',
                    color: rule.severity === s.v ? s.c : 'var(--text-2)',
                    fontWeight: 700,
                    fontSize: 11,
                    fontFamily: 'JetBrains Mono',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  {s.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </>
  )
}

function RowToggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <div style={{ flex: 1 }}>
        <div className="fw-600 text-0 fs-13">{label}</div>
        {hint && <div className="muted fs-11">{hint}</div>}
      </div>
      <Toggle on={value} onChange={onChange} />
    </div>
  )
}

function ActionPicker({
  rule,
  setR,
}: {
  rule: RuleData
  setR: (p: Partial<RuleData>) => void
}) {
  const ACTIONS: { v: Action; l: string; c: string; ico: IconName; d: string }[] = [
    { v: 'block', l: '阻断', c: '#ef4444', ico: 'shield', d: '返回 403 终止请求' },
    { v: 'challenge', l: '挑战', c: '#f59e0b', ico: 'crosshair', d: 'JS / 验证码 / 指纹' },
    { v: 'rate', l: '限速', c: '#a855f7', ico: 'activity', d: '滑动窗口令牌桶' },
    { v: 'allow', l: '放行', c: '#10b981', ico: 'check', d: '跳过后续规则' },
    { v: 'log', l: '仅记录', c: '#22d3ee', ico: 'logs', d: '观察模式 · 不阻断' },
    { v: 'redirect', l: '重定向', c: '#ec4899', ico: 'flow', d: '302 至安全 URL' },
  ]
  return (
    <Card title="执行动作" ico="crosshair" meta="THEN 子句" className="mt-4">
      <div className="row r-3 gap-2">
        {ACTIONS.map(a => (
          <div
            key={a.v}
            onClick={() => setR({ action: a.v })}
            style={{
              padding: 14,
              borderRadius: 10,
              border: '1px solid ' + (rule.action === a.v ? a.c : 'var(--line)'),
              background: rule.action === a.v ? hexA(a.c, 0.08) : 'transparent',
              cursor: 'pointer',
              transition: 'all .12s',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: rule.action === a.v ? a.c : hexA(a.c, 0.1),
                  color: rule.action === a.v ? '#fff' : a.c,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Icon name={a.ico} size={14} />
              </span>
              <span
                className="fw-700 fs-14"
                style={{ color: rule.action === a.v ? a.c : 'var(--text-0)' }}
              >
                {a.l}
              </span>
              {rule.action === a.v && (
                <span style={{ marginLeft: 'auto', color: a.c }}>
                  <Icon name="check" size={14} />
                </span>
              )}
            </div>
            <div className="muted fs-11" style={{ lineHeight: 1.5 }}>
              {a.d}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function DslPane({ rule }: { rule: RuleData }) {
  const dsl = useMemo(() => {
    const head = `rule "${rule.name || '<unnamed>'}" {`
    const meta = `  id           = "${rule.id || 'r-new'}"
  scope        = "${rule.scope}"
  priority     = ${rule.priority}
  severity     = "${rule.severity}"
  enabled      = ${rule.enabled}
  log_samples  = ${rule.logSamples}`
    const when = rule.chains
      .map((c, i) => {
        const conds = c.conditions
          .map((cn, ci) => {
            const prefix = ci === 0 ? '' : '       AND '
            const not = cn.not ? '!' : ''
            return `${prefix}${not}(${cn.field} ${cn.op} ${JSON.stringify(cn.value || '')})`
          })
          .join('\n')
        return `  ${i === 0 ? 'when ' : '   ' + c.op + ' '}{
${conds
  .split('\n')
  .map(l => '      ' + l)
  .join('\n')}
  }`
      })
      .join('\n')
    const then = `  then ${rule.action}`
    return `${head}
${meta}

${when}
${then}
}`
  }, [rule])

  return (
    <Card title="DSL 代码" ico="logs" meta="可视化构造与代码双向同步">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '38px 1fr',
          background: 'var(--bg-0)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          overflow: 'hidden',
          fontFamily: 'JetBrains Mono',
          fontSize: 12.5,
          lineHeight: 1.8,
        }}
      >
        <div
          style={{
            padding: '14px 0',
            textAlign: 'right',
            color: 'var(--text-3)',
            fontSize: 11,
            background: 'rgba(168,85,247,.04)',
            borderRight: '1px solid var(--line)',
            userSelect: 'none',
          }}
        >
          {dsl.split('\n').map((_, i) => (
            <div key={i} style={{ padding: '0 10px' }}>
              {i + 1}
            </div>
          ))}
        </div>
        <pre style={{ padding: '14px 16px', margin: 0, color: 'var(--text-1)', overflowX: 'auto' }}>
          {dsl}
        </pre>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <Tag kind="ok">
          <Icon name="check" size={11} /> 语法校验通过
        </Tag>
        <Tag kind="info">编译后 {Math.floor(120 + Math.random() * 60)} bytes</Tag>
        <Tag kind="pink">µs 级匹配</Tag>
        <span className="muted fs-11">在可视化构造区修改将自动同步到此处</span>
      </div>
    </Card>
  )
}

function TestPane({
  input,
  setInput,
  result,
  onRun,
  rule,
}: {
  input: { method: string; url: string; headers: string; body: string }
  setInput: (v: typeof input) => void
  result: { matched: boolean; time: string; hitConds: number[]; action: Action | 'pass' } | null
  onRun: () => void
  rule: RuleData
}) {
  return (
    <>
      <Card
        title="样本测试"
        ico="crosshair"
        meta="构造请求并模拟规则匹配"
        actions={
          <div className="flex gap-2">
            <select className="select" style={{ minWidth: 180 }}>
              <option>— 选择历史攻击样本 —</option>
              <option>SQL UNION 注入</option>
              <option>路径穿越 ../../etc/passwd</option>
              <option>XSS &lt;script&gt;</option>
            </select>
            <Button variant="pri" size="sm" onClick={onRun}>
              <Icon name="play" size={11} className="ico" />
              运行测试
            </Button>
          </div>
        }
      >
        <div className="row r-3 gap-3 mb-3">
          <div className="field">
            <label>方法</label>
            <select
              className="select"
              value={input.method}
              onChange={e => setInput({ ...input, method: e.target.value })}
            >
              {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].map(m => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ gridColumn: 'span 2' }}>
            <label>URL</label>
            <input
              className="input"
              value={input.url}
              style={{ fontFamily: 'JetBrains Mono', fontSize: 11.5 }}
              onChange={e => setInput({ ...input, url: e.target.value })}
            />
          </div>
        </div>

        <div className="field mb-3">
          <label>请求头</label>
          <textarea
            className="input"
            rows={3}
            value={input.headers}
            style={{
              height: 'auto',
              padding: 10,
              fontFamily: 'JetBrains Mono',
              fontSize: 11.5,
              resize: 'vertical',
            }}
            onChange={e => setInput({ ...input, headers: e.target.value })}
          />
        </div>

        <div className="field">
          <label>请求体</label>
          <textarea
            className="input"
            rows={4}
            value={input.body}
            style={{
              height: 'auto',
              padding: 10,
              fontFamily: 'JetBrains Mono',
              fontSize: 11.5,
              resize: 'vertical',
            }}
            onChange={e => setInput({ ...input, body: e.target.value })}
          />
        </div>
      </Card>

      {result && (
        <Card
          title="匹配结果"
          ico={result.matched ? 'crosshair' : 'check'}
          meta={`耗时 ${result.time} ms`}
          className="mt-4"
        >
          <div
            style={{
              padding: 16,
              borderRadius: 10,
              background: result.matched ? 'rgba(239,68,68,.06)' : 'rgba(16,185,129,.06)',
              border:
                '1px solid ' + (result.matched ? 'rgba(239,68,68,.25)' : 'rgba(16,185,129,.25)'),
              marginBottom: 14,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: result.matched ? 'var(--danger)' : 'var(--ok)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow:
                    '0 0 14px ' + (result.matched ? 'rgba(239,68,68,.6)' : 'rgba(16,185,129,.6)'),
                }}
              >
                <Icon name={result.matched ? 'shield' : 'check'} size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="fw-700 text-0 fs-15">
                  {result.matched
                    ? `规则命中 · 将执行 ${result.action === 'block' ? '阻断' : result.action}`
                    : '规则未命中 · 请求通过'}
                </div>
                <div className="muted fs-12 mt-2">
                  匹配 {result.hitConds.length} / {rule.chains.flatMap(c => c.conditions).length} 个条件 · 引擎耗时{' '}
                  {result.time} ms
                </div>
              </div>
              <Tag kind={result.matched ? 'danger' : 'ok'} lg>
                {result.matched ? 'BLOCK' : 'PASS'}
              </Tag>
            </div>
          </div>

          <div
            className="muted fs-11 mb-2"
            style={{ letterSpacing: 1, textTransform: 'uppercase' }}
          >
            条件命中明细
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>条件</th>
                <th>实际值</th>
                <th>结果</th>
              </tr>
            </thead>
            <tbody>
              {rule.chains.flatMap(c => c.conditions).map((cn, i) => {
                const hit = result.hitConds.includes(cn.id)
                return (
                  <tr key={cn.id}>
                    <td className="mono fs-11 muted">{i + 1}</td>
                    <td className="mono fs-12">
                      {cn.not ? <span className="t-danger">NOT </span> : ''}
                      <span className="t-brand">{cn.field}</span>{' '}
                      <span className="muted">{cn.op}</span>{' '}
                      <span className="t-pink">&quot;{cn.value || ''}&quot;</span>
                    </td>
                    <td
                      className="mono fs-11"
                      style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {cn.field === 'method' ? '(input method)' : cn.field === 'uri' ? '(input url)' : '...'}
                    </td>
                    <td>
                      <Tag kind={hit ? 'ok' : 'def'}>
                        {hit ? (
                          <>
                            <Icon name="check" size={10} /> 命中
                          </>
                        ) : (
                          '未命中'
                        )}
                      </Tag>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  )
}

function HitsPane() {
  const hourlyData = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) =>
        Math.floor(200 + Math.sin(i / 3) * 150 + Math.random() * 180),
      ),
    [],
  )
  return (
    <>
      <div className="row r-4 mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KPI label="今日命中" value="2,148" ico="crosshair" kind="brand" delta="+18%" deltaDir="up" />
        <KPI label="近 7 天" value="14.6K" ico="activity" kind="brand" />
        <KPI label="误报率" value="0.32" unit="%" ico="alert" kind="warn" />
        <KPI label="平均处置时延" value="0.07" unit="ms" ico="pulse" kind="info" />
      </div>

      <Card title="近 24 小时命中趋势" ico="activity" className="mb-4">
        <AreaChart
          height={220}
          labels={Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)}
          series={[{ label: '命中', data: hourlyData, color: '#a855f7' }]}
        />
      </Card>

      <div className="row r-1-1">
        <Card title="命中分布 · 站点" ico="sites">
          <BarChartH
            height={180}
            data={[
              { label: '官网主站', value: 842, color: '#a855f7' },
              { label: 'API 网关', value: 524, color: '#ec4899' },
              { label: '管理后台', value: 388, color: '#f59e0b' },
              { label: '支付服务', value: 210, color: '#22d3ee' },
              { label: '移动端网关', value: 184, color: '#10b981' },
            ]}
          />
        </Card>
        <Card title="近期触发样本" ico="logs" bodyClass="np">
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>IP</th>
                <th>站点</th>
                <th>动作</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }, () => mkAttack()).map(e => (
                <tr key={e.id}>
                  <td className="mono fs-11">{e.t}</td>
                  <td className="mono fs-12">
                    <span className="t-brand">{e.ip}</span>
                  </td>
                  <td className="fs-12">{e.site}</td>
                  <td>
                    <Tag kind="ok">BLOCK</Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  )
}

function HistoryPane() {
  const versions = [
    { v: 4, t: '今天 14:22', who: 'admin', msg: '将动作从 log 改为 block', diff: '+1 -1', curr: true },
    { v: 3, t: '昨天 10:08', who: 'admin', msg: '增加方法 POST/PUT 限制', diff: '+3 -0', curr: false },
    { v: 2, t: '5/14 16:30', who: 'zhangsan', msg: '修复正则边界 \\b', diff: '+1 -1', curr: false },
    { v: 1, t: '5/12 09:15', who: 'admin', msg: '初始创建', diff: '+12 -0', curr: false },
  ]
  return (
    <Card title="版本历史" ico="refresh" meta={`共 ${versions.length} 次变更`}>
      <div style={{ position: 'relative', paddingLeft: 26 }}>
        <div
          style={{
            position: 'absolute',
            left: 9,
            top: 12,
            bottom: 12,
            width: 2,
            background: 'linear-gradient(180deg, var(--brand-1), var(--line) 80%)',
            borderRadius: 1,
          }}
        />
        {versions.map(v => {
          const plus = v.diff.match(/\+(\d+)/)?.[1] ?? '0'
          const minus = v.diff.match(/-(\d+)/)?.[1] ?? '0'
          return (
            <div
              key={v.v}
              style={{
                position: 'relative',
                padding: '14px 0',
                borderBottom: '1px solid var(--line-2)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: -22,
                  top: 18,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: v.curr ? 'var(--brand-1)' : 'var(--bg-1)',
                  border: '2px solid ' + (v.curr ? 'var(--brand-1)' : 'var(--line-strong)'),
                  boxShadow: v.curr ? '0 0 12px var(--brand-1)' : 'none',
                }}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
                  <span className="mono fw-700 fs-13 text-0">v{v.v}</span>
                  {v.curr && (
                    <Tag kind="ok">
                      <span className="dot" />
                      当前
                    </Tag>
                  )}
                  <span className="fs-13">{v.msg}</span>
                  <Tag kind="def">
                    <span className="t-ok">+{plus}</span> <span className="t-danger">-{minus}</span>
                  </Tag>
                </div>
                <div className="flex items-center gap-3">
                  <span className="muted fs-11">{v.who}</span>
                  <span className="muted fs-11 mono">{v.t}</span>
                  {!v.curr && (
                    <Button variant="ghost" size="sm">
                      <Icon name="refresh" size={11} className="ico" />
                      回滚至此
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <Icon name="eye" size={11} className="ico" />
                    查看 Diff
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function SidePanel({
  rule,
  testResult,
}: {
  rule: RuleData
  testResult: { matched: boolean; time: string; hitConds: number[]; action: Action | 'pass' } | null
}) {
  const condCount = rule.chains.flatMap(c => c.conditions).length
  const actionLabel: Record<Action, string> = {
    block: '阻断',
    challenge: '挑战',
    rate: '限速',
    allow: '放行',
    log: '记录',
    redirect: '重定向',
  }
  return (
    <div className="stack">
      <Card title="规则摘要" ico="sparkles" bracketed>
        <div className="stack" style={{ gap: 10 }}>
          <RowKV
            k="规则状态"
            v={
              <Tag kind={rule.enabled ? 'ok' : 'def'}>
                <span className="dot" />
                {rule.enabled ? '已启用' : '已停用'}
              </Tag>
            }
          />
          <RowKV
            k="执行动作"
            v={
              <Tag
                kind={
                  rule.action === 'block'
                    ? 'danger'
                    : rule.action === 'challenge'
                      ? 'warn'
                      : rule.action === 'rate'
                        ? 'pink'
                        : rule.action === 'allow'
                          ? 'ok'
                          : 'info'
                }
              >
                {actionLabel[rule.action]}
              </Tag>
            }
          />
          <RowKV k="条件组数" v={<span className="mono fw-700 t-brand">{rule.chains.length}</span>} />
          <RowKV k="条件总数" v={<span className="mono fw-700">{condCount}</span>} />
          <RowKV
            k="优先级"
            v={<span className="mono fw-700 t-pink">#{String(rule.priority).padStart(2, '0')}</span>}
          />
          <RowKV k="影响站点" v={<span className="fs-12">{rule.scope}</span>} />
          <RowKV
            k="预计 QPS 影响"
            v={<span className="mono fw-600">~ {Math.floor(condCount * 240 + 800)}</span>}
          />
        </div>
      </Card>

      <Card title="冲突检测" ico="alert">
        {rule.chains.length === 0 ? (
          <div className="muted fs-12">未配置匹配条件 — 规则将不会命中任何请求</div>
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            <RowConflict kind="ok" msg="未发现与现有规则的优先级冲突" />
            <RowConflict kind="warn" msg="条件 `header.UA contains sqlmap` 与 r-1005 重叠 60%" />
            <RowConflict kind="info" msg="建议将此规则置于 #3-#6 优先级以提升性能" />
          </div>
        )}
      </Card>

      {testResult && (
        <Card title="最新测试" ico="check">
          <div className="flex items-center gap-3 mb-3">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: testResult.matched ? 'rgba(239,68,68,.15)' : 'rgba(16,185,129,.15)',
                color: testResult.matched ? 'var(--danger)' : 'var(--ok)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Icon name={testResult.matched ? 'shield' : 'check'} size={16} />
            </div>
            <div>
              <div className="fw-700 fs-13 text-0">{testResult.matched ? '命中' : '未命中'}</div>
              <div className="muted fs-11 mono">耗时 {testResult.time} ms</div>
            </div>
          </div>
        </Card>
      )}

      <Card title="变更影响预估" ico="activity">
        <div className="muted fs-11 mb-3">基于过去 7 天流量</div>
        <div className="stack" style={{ gap: 12 }}>
          <SimRow l="额外拦截" v="~ 2,148/天" hint="预计新增" tone="danger" />
          <SimRow l="可能误伤" v="~ 12/天" hint="估算" tone="warn" />
          <SimRow l="性能影响" v="+ 0.07 ms" hint="平均延迟" tone="info" />
        </div>
      </Card>
    </div>
  )
}

function RowKV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: '4px 0', borderBottom: '1px solid var(--line-2)' }}
    >
      <span className="muted fs-12">{k}</span>
      <span>{v}</span>
    </div>
  )
}

function RowConflict({ kind, msg }: { kind: 'ok' | 'warn' | 'info'; msg: string }) {
  return (
    <div className="flex items-start gap-2">
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          background:
            kind === 'ok'
              ? 'rgba(16,185,129,.15)'
              : kind === 'warn'
                ? 'rgba(245,158,11,.15)'
                : 'rgba(34,211,238,.15)',
          color: kind === 'ok' ? 'var(--ok)' : kind === 'warn' ? 'var(--warn)' : 'var(--info)',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <Icon
          name={kind === 'ok' ? 'check' : kind === 'warn' ? 'alert' : 'sparkles'}
          size={11}
        />
      </span>
      <span className="fs-12" style={{ lineHeight: 1.5 }}>
        {msg}
      </span>
    </div>
  )
}

function SimRow({
  l,
  v,
  hint,
  tone,
}: {
  l: string
  v: string
  hint: string
  tone: 'danger' | 'warn' | 'info'
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="muted fs-12">{l}</span>
        <span
          className={cn(
            'mono fw-700 fs-14',
            tone === 'danger' ? 't-danger' : tone === 'warn' ? 't-warn' : 't-info',
          )}
        >
          {v}
        </span>
      </div>
      <div className="muted fs-11">{hint}</div>
    </div>
  )
}
