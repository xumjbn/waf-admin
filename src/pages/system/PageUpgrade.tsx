import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, Icon, Tag, Button, Toggle, Tabs, cn } from '@/components/ui'
import * as upgradeApi from '@/api/live/upgrade'

type Stage = 'idle' | 'preflight' | 'running' | 'done'

interface VersionEntry {
  v: string
  d: string
  t: 'minor' | 'rc' | 'patch' | 'major'
  k: 'pink' | 'def' | 'info' | 'warn'
  cur: boolean
  latest: boolean
  c: string
  size: string
  notes: string
}

const VERSIONS: VersionEntry[] = [
  {
    v: 'v3.1.0',
    d: '2026-05-17',
    t: 'minor',
    k: 'pink',
    cur: false,
    latest: true,
    c: '新功能 6 · 安全 4 · 优化 8',
    size: '842 MB',
    notes: 'AI 异常检测 · WASM 沙箱 · CVE-2026-3158 修复',
  },
  {
    v: 'v3.0.0-rc.2',
    d: '2026-05-15',
    t: 'rc',
    k: 'pink',
    cur: true,
    latest: false,
    c: 'WASM 引擎重写 · 性能 +3x',
    size: '836 MB',
    notes: '当前运行版本',
  },
  {
    v: 'v3.0.0-rc.1',
    d: '2026-05-08',
    t: 'rc',
    k: 'pink',
    cur: false,
    latest: false,
    c: '初次发布候选',
    size: '836 MB',
    notes: 'WASM 引擎初版',
  },
  {
    v: 'v2.4.1',
    d: '2026-04-22',
    t: 'patch',
    k: 'def',
    cur: false,
    latest: false,
    c: '修复 JWT 校验内存泄漏',
    size: '524 MB',
    notes: '紧急补丁',
  },
  {
    v: 'v2.4.0',
    d: '2026-04-01',
    t: 'minor',
    k: 'info',
    cur: false,
    latest: false,
    c: 'API 安全模块上线',
    size: '520 MB',
    notes: '新增 OpenAPI 校验 · JWT 验证',
  },
  {
    v: 'v2.3.0',
    d: '2026-03-01',
    t: 'minor',
    k: 'info',
    cur: false,
    latest: false,
    c: 'Bot 管理 + TLS 指纹',
    size: '498 MB',
    notes: '新增 JA3/JA4 指纹库',
  },
  {
    v: 'v2.2.0',
    d: '2026-02-01',
    t: 'minor',
    k: 'info',
    cur: false,
    latest: false,
    c: 'CC 防护重构',
    size: '486 MB',
    notes: '动态阈值 + 智能挑战',
  },
]

export default function PageUpgrade() {
  const [stage, setStage] = useState<Stage>('idle')
  const [progress, setProgress] = useState(0)
  const [logLines, setLogLines] = useState<{ t: number; l: string; k: 'info' | 'ok' | 'warn' | 'err' }[]>([])
  const [autoUpdate, setAutoUpdate] = useState(false)
  const [packages, setPackages] = useState<upgradeApi.UpgradePackage[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  // 拉真实升级包列表；当前 UI 版本时间轴仍按 VERSIONS 设计稿渲染，
  // 等设计稿调成『后端包列表』时切到 packages。
  useEffect(() => {
    upgradeApi
      .listUpgrades()
      .then(setPackages)
      .catch(err => {
        // eslint-disable-next-line no-console
        console.error('[upgrade api]', err)
      })
  }, [])
  // eslint-disable-next-line no-console
  if (packages.length > 0) console.debug('[upgrade] backend packages', packages)

  useEffect(() => {
    if (stage !== 'running') return
    const lines = [
      { t: 0, l: '[INIT] 创建升级会话 nbu-3.1.0-20260518', k: 'info' as const },
      { t: 600, l: '[1/8] 拉取镜像 nebulawaf:v3.1.0 (842 MB)…', k: 'info' as const },
      { t: 1800, l: '[1/8] ✓ 镜像校验通过 sha256:9a4f…b22c', k: 'ok' as const },
      { t: 2400, l: '[2/8] 备份当前配置至 /var/lib/waf/snap/…', k: 'info' as const },
      { t: 3200, l: '[2/8] ✓ 备份完成 · 28.4 MB', k: 'ok' as const },
      { t: 3800, l: '[3/8] HA 切换：主 waf-01 → 备 waf-02', k: 'warn' as const },
      { t: 4400, l: '[3/8] ✓ 流量已切走 · 无连接中断', k: 'ok' as const },
      { t: 5000, l: '[4/8] 滚动升级节点 waf-01…', k: 'info' as const },
      { t: 6200, l: '[4/8] ✓ waf-01 (1/8) 已升级 · 健康', k: 'ok' as const },
      { t: 7000, l: '[5/8] 滚动升级节点 waf-02 → waf-08…', k: 'info' as const },
      { t: 8200, l: '[5/8] ✓ 全部 8 节点已完成 · 全集群在线', k: 'ok' as const },
      { t: 8800, l: '[6/8] 应用迁移脚本 db_v23 → db_v24', k: 'info' as const },
      { t: 9400, l: '[6/8] ✓ 数据库 schema 升级完成', k: 'ok' as const },
      { t: 10000, l: '[7/8] 灰度回切流量 5% → 100%…', k: 'info' as const },
      { t: 11000, l: '[7/8] ✓ 流量回切完成 · 错误率 0.00%', k: 'ok' as const },
      { t: 11600, l: '[8/8] 系统健康巡检中…', k: 'info' as const },
      { t: 12400, l: '[8/8] ✓ 全部健康 · 升级成功', k: 'ok' as const },
      { t: 12800, l: '当前版本 v3.1.0 · 用时 12.8s', k: 'ok' as const },
    ]
    const timers = lines.map(line =>
      setTimeout(() => {
        setLogLines(prev => [...prev, line])
        setProgress(Math.round((line.t / 12800) * 100))
        if (line.t === 12800) setTimeout(() => setStage('done'), 600)
      }, line.t),
    )
    return () => timers.forEach(clearTimeout)
  }, [stage])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logLines])

  const startUpgrade = () => {
    setStage('running')
    setProgress(0)
    setLogLines([])
  }
  const reset = () => {
    setStage('idle')
    setProgress(0)
    setLogLines([])
  }

  return (
    <div style={{ paddingTop: 12 }}>
      <div className="row r-1-2 mb-4">
        <CurrentVersionCard />
        <UpdateBanner stage={stage} onStart={() => setStage('preflight')} />
      </div>

      {(stage === 'preflight' || stage === 'running' || stage === 'done') && (
        <UpgradeExecution
          stage={stage}
          progress={progress}
          logLines={logLines}
          logRef={logRef}
          onConfirm={startUpgrade}
          onCancel={reset}
          onClose={reset}
        />
      )}

      <Card
        title="版本历史"
        ico="logs"
        meta="可一键回滚至任一已发布版本"
        actions={
          <Tabs
            tabs={[
              { value: 'all', label: '全部' },
              { value: 'major', label: '主要版本' },
              { value: 'patch', label: '补丁' },
            ]}
            value="all"
            onChange={() => {}}
          />
        }
      >
        <VersionTimeline />
      </Card>

      <div className="row r-1-1 mt-4">
        <Card title="自动更新策略" ico="refresh" meta="安全补丁自动跟进">
          <UpdateSchedule autoUpdate={autoUpdate} setAutoUpdate={setAutoUpdate} />
        </Card>
        <Card title="维护窗口" ico="settings" meta="升级仅在窗口内执行">
          <MaintenanceWindow />
        </Card>
      </div>
    </div>
  )
}

function CurrentVersionCard() {
  return (
    <div
      className="card bracketed"
      style={{
        background:
          'linear-gradient(135deg, rgba(168,85,247,.10), rgba(236,72,153,.05) 60%, var(--bg-1))',
        borderColor: 'var(--line-strong)',
      }}
    >
      <div className="card-bd" style={{ padding: 20 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'var(--grad-brand)',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                boxShadow: '0 4px 18px -2px rgba(168,85,247,.5)',
              }}
            >
              <Icon name="shield" size={22} />
            </div>
            <div>
              <div className="muted fs-11" style={{ letterSpacing: 1.5, textTransform: 'uppercase' }}>
                当前版本
              </div>
              <div className="fw-700 text-0 fs-20 mono" style={{ marginTop: 2 }}>
                v3.0.0-rc.2
              </div>
            </div>
          </div>
          <Tag kind="ok" lg>
            <span className="dot" />
            运行中
          </Tag>
        </div>

        <div className="row r-1-1 gap-3 mt-3">
          <KV2 label="发布于" value="2026-05-15" mono />
          <KV2 label="构建号" value="#bd-58219" mono />
          <KV2 label="运行时长" value="2 天 18:42" mono />
          <KV2 label="发行通道" value={<Tag kind="pink">候选版</Tag>} />
        </div>

        <div className="divider-h" />

        <div className="flex items-center gap-2">
          <Icon name="sparkles" size={13} className="t-brand" />
          <span className="muted fs-12">基于 Apache-2.0 开源 · 控制面 + 引擎 + API 全开放</span>
        </div>
      </div>
    </div>
  )
}

function KV2({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div
        className="muted fs-11"
        style={{ letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 }}
      >
        {label}
      </div>
      <div className={cn(mono && 'mono', 'fw-700 text-0 fs-13')}>{value}</div>
    </div>
  )
}

function UpdateBanner({ stage, onStart }: { stage: Stage; onStart: () => void }) {
  return (
    <div
      className="card"
      style={{
        background:
          'linear-gradient(135deg, rgba(245,158,11,.08), rgba(168,85,247,.06) 60%, var(--bg-1))',
        borderColor: 'rgba(245,158,11,.3)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="card-bd" style={{ padding: 20 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(245,158,11,.15)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--warn)',
              }}
            >
              <Icon name="arrow-up" size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="fw-700 text-0 fs-15">v3.1.0 可升级</span>
                <Tag kind="warn">稳定版</Tag>
                <Tag kind="info">推荐</Tag>
              </div>
              <div className="muted fs-12 mt-2">
                发布于 2026-05-17 · 距今 1 天 ·
                <span className="t-brand fw-600 mono" style={{ marginLeft: 6 }}>
                  +18 项变更
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost">
              <Icon name="logs" size={13} className="ico" />
              查看更新日志
            </Button>
            {stage === 'idle' && (
              <Button variant="pri" onClick={onStart}>
                <Icon name="arrow-up" size={13} className="ico" />
                立即升级
              </Button>
            )}
            {(stage === 'preflight' || stage === 'running') && (
              <Button variant="pri" disabled>
                <Icon name="refresh" size={13} className="ico" />
                升级进行中
              </Button>
            )}
            {stage === 'done' && (
              <Button
                variant="pri"
                disabled
                style={{ background: 'var(--ok)', boxShadow: '0 4px 14px -4px rgba(16,185,129,.55)' }}
              >
                <Icon name="check" size={13} className="ico" />
                已是最新
              </Button>
            )}
          </div>
        </div>

        <div className="row r-3 gap-3 mt-3">
          {[
            { l: '新增功能', v: '6', c: 'var(--brand-1)' },
            { l: '安全修复', v: '4', c: 'var(--danger)' },
            { l: '性能优化', v: '8', c: 'var(--warn)' },
          ].map(s => (
            <div
              key={s.l}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(255,255,255,.02)',
                border: '1px solid var(--line)',
              }}
            >
              <div className="fw-700 mono fs-20" style={{ color: s.c }}>
                +{s.v}
              </div>
              <div className="muted fs-11">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="divider-h" />

        <div className="muted fs-11 mb-2" style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
          亮点变更
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(
            [
              { ico: 'sparkles', kind: 'pink', t: 'AI 异常检测', d: '基于 LLM 的请求语义识别 (实验性)' },
              { ico: 'shield', kind: 'brand', t: 'WASM 沙箱', d: '自定义规则运行在隔离沙箱内' },
              { ico: 'crosshair', kind: 'danger', t: 'CVE-2026-3158', d: '修复 multipart 解析路径穿越 · 高危' },
              { ico: 'activity', kind: 'info', t: '吞吐 +18%', d: 'epoll 多路复用优化' },
            ] as const
          ).map((it, i) => (
            <li key={i} className="flex items-center gap-2">
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  background:
                    it.kind === 'danger'
                      ? 'rgba(239,68,68,.15)'
                      : it.kind === 'pink'
                        ? 'rgba(236,72,153,.15)'
                        : it.kind === 'brand'
                          ? 'rgba(168,85,247,.15)'
                          : 'rgba(34,211,238,.15)',
                  color:
                    it.kind === 'danger'
                      ? 'var(--danger)'
                      : it.kind === 'pink'
                        ? 'var(--brand-2)'
                        : it.kind === 'brand'
                          ? 'var(--brand-1)'
                          : 'var(--info)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name={it.ico} size={11} />
              </span>
              <span className="fw-600 fs-13 text-0">{it.t}</span>
              <span className="muted fs-12">— {it.d}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function UpgradeExecution({
  stage,
  progress,
  logLines,
  logRef,
  onConfirm,
  onCancel,
  onClose,
}: {
  stage: Stage
  progress: number
  logLines: { t: number; l: string; k: 'info' | 'ok' | 'warn' | 'err' }[]
  logRef: React.RefObject<HTMLDivElement>
  onConfirm: () => void
  onCancel: () => void
  onClose: () => void
}) {
  const checks = [
    { name: '磁盘空间', value: '剩余 124 GB / 500 GB', need: '≥ 5 GB', state: 'ok' },
    { name: 'HA 主备', value: '4 组 HA 全部正常', need: '至少 1 组', state: 'ok' },
    { name: '数据库版本', value: 'PostgreSQL 14.6', need: '≥ 13.0', state: 'ok' },
    { name: '快照空间', value: '可创建 2 GB 快照', need: '≥ 100 MB', state: 'ok' },
    { name: '维护窗口', value: '当前不在维护窗口', need: '建议启用', state: 'warn' },
    { name: '业务流量', value: '当前 56K QPS · 高峰', need: '建议低峰', state: 'warn' },
    { name: '在线节点', value: '7/8 节点在线 (waf-06 离线)', need: '全部在线', state: 'fail' },
  ]
  const okCount = checks.filter(c => c.state === 'ok').length
  const warnCount = checks.filter(c => c.state === 'warn').length
  const failCount = checks.filter(c => c.state === 'fail').length

  return (
    <Card
      title={stage === 'running' ? '升级执行中' : stage === 'done' ? '升级完成' : '升级前置检查'}
      ico={stage === 'done' ? 'check' : stage === 'running' ? 'refresh' : 'crosshair'}
      meta={
        stage === 'preflight'
          ? 'v3.0.0-rc.2 → v3.1.0'
          : stage === 'running'
            ? `进度 ${progress}%`
            : '12.8 秒内完成 · 零停机'
      }
      actions={
        stage === 'preflight' ? (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <Icon name="x" size={11} className="ico" />
            取消
          </Button>
        ) : stage === 'done' ? (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="x" size={11} className="ico" />
            关闭
          </Button>
        ) : (
          <Tag kind="warn" lg>
            <span className="live-dot" />
            EXECUTING
          </Tag>
        )
      }
      className="mb-4"
    >
      {stage === 'preflight' && (
        <>
          <div className="flex gap-3 mb-4">
            <Tag kind="ok" lg>
              {okCount} 项通过
            </Tag>
            {warnCount > 0 && (
              <Tag kind="warn" lg>
                {warnCount} 项警告
              </Tag>
            )}
            {failCount > 0 && (
              <Tag kind="danger" lg>
                {failCount} 项失败
              </Tag>
            )}
          </div>

          <table>
            <thead>
              <tr>
                <th>检查项</th>
                <th>当前状态</th>
                <th>要求</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {checks.map(c => (
                <tr key={c.name}>
                  <td className="fw-600 fs-13 text-0">{c.name}</td>
                  <td className="fs-12">{c.value}</td>
                  <td className="muted fs-12 mono">{c.need}</td>
                  <td>
                    <Tag kind={c.state === 'ok' ? 'ok' : c.state === 'warn' ? 'warn' : 'danger'}>
                      {c.state === 'ok' ? '通过' : c.state === 'warn' ? '注意' : '阻止'}
                    </Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              background: 'rgba(239,68,68,.05)',
              border: '1px solid rgba(239,68,68,.2)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon name="alert" size={13} className="t-danger" />
              <span className="fw-700 fs-12 t-danger">检测到阻止项</span>
            </div>
            <div className="muted fs-12" style={{ lineHeight: 1.6 }}>
              节点 <code className="mono">waf-06</code> 当前离线，无法参与滚动升级。请先恢复后再继续，或选择「忽略离线节点」以仅升级在线节点。
            </div>
          </div>

          <div className="divider-h" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="ack" />
              <label htmlFor="ack" className="fs-12">
                我已阅读 <span className="tbl-link">v3.1.0 升级文档</span> · 已确认数据已备份
              </label>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onCancel}>
                取消
              </Button>
              <Button variant="line">忽略离线节点</Button>
              <Button variant="pri" onClick={onConfirm}>
                <Icon name="play" size={13} className="ico" />
                开始升级
              </Button>
            </div>
          </div>
        </>
      )}

      {(stage === 'running' || stage === 'done') && (
        <>
          <div style={{ marginBottom: 16 }}>
            <div className="flex items-center justify-between mb-2">
              <span className="fw-700 fs-13 text-0">
                {stage === 'done' ? '升级流程已完成' : '执行中…'}
              </span>
              <span
                className="mono fs-13"
                style={{ color: stage === 'done' ? 'var(--ok)' : 'var(--brand-1)' }}
              >
                {progress}%
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 4,
                background: 'var(--bg-3)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: progress + '%',
                  background: stage === 'done' ? 'var(--ok)' : 'var(--grad-brand)',
                  boxShadow:
                    stage === 'done' ? '0 0 12px var(--ok)' : '0 0 12px var(--brand-1)',
                  transition: 'width .4s ease',
                }}
              />
            </div>
          </div>

          <div className="row r-4 gap-2 mb-4">
            {[
              { l: '镜像', th: 14 },
              { l: '备份', th: 28 },
              { l: '升级', th: 70 },
              { l: '验证', th: 100 },
            ].map((p, i) => {
              const active = progress >= p.th - 14
              const done = progress >= p.th
              return (
                <div
                  key={p.l}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: done
                      ? 'rgba(16,185,129,.08)'
                      : active
                        ? 'rgba(168,85,247,.08)'
                        : 'var(--bg-2)',
                    border:
                      '1px solid ' +
                      (done
                        ? 'rgba(16,185,129,.3)'
                        : active
                          ? 'var(--brand-1)'
                          : 'var(--line)'),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: done
                        ? 'var(--ok)'
                        : active
                          ? 'var(--brand-1)'
                          : 'transparent',
                      border:
                        '1px solid ' +
                        (done
                          ? 'var(--ok)'
                          : active
                            ? 'var(--brand-1)'
                            : 'var(--line)'),
                      display: 'grid',
                      placeItems: 'center',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: 'JetBrains Mono',
                    }}
                  >
                    {done ? <Icon name="check" size={10} /> : i + 1}
                  </span>
                  <span
                    className="fs-12 fw-600"
                    style={{
                      color: done || active ? 'var(--text-0)' : 'var(--text-3)',
                    }}
                  >
                    {p.l}
                  </span>
                </div>
              )
            })}
          </div>

          <div
            className="muted fs-11 mb-2"
            style={{ letterSpacing: 1, textTransform: 'uppercase' }}
          >
            执行日志 · LIVE
          </div>
          <div
            ref={logRef}
            style={{
              background: 'var(--bg-0)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: 14,
              fontFamily: 'JetBrains Mono',
              fontSize: 11.5,
              color: 'var(--text-1)',
              lineHeight: 1.8,
              height: 260,
              overflow: 'auto',
            }}
          >
            {logLines.length === 0 && <span className="muted">等待开始执行…</span>}
            {logLines.map((line, i) => (
              <div
                key={i}
                style={{
                  color:
                    line.k === 'ok'
                      ? 'var(--ok)'
                      : line.k === 'warn'
                        ? 'var(--warn)'
                        : line.k === 'err'
                          ? 'var(--danger)'
                          : 'var(--text-2)',
                }}
              >
                <span className="muted" style={{ marginRight: 6 }}>
                  {String(Math.floor(line.t / 1000)).padStart(2, '0')}.
                  {String(line.t % 1000)
                    .padStart(3, '0')
                    .slice(0, 1)}
                  s
                </span>
                {line.l}
              </div>
            ))}
          </div>

          {stage === 'done' && (
            <div
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 10,
                background:
                  'linear-gradient(135deg, rgba(16,185,129,.10), rgba(168,85,247,.04))',
                border: '1px solid rgba(16,185,129,.3)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'var(--ok)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#fff',
                    boxShadow: '0 0 16px rgba(16,185,129,.5)',
                  }}
                >
                  <Icon name="check" size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="fw-700 text-0 fs-15">v3.1.0 升级成功</div>
                  <div className="muted fs-12 mt-2">
                    全部 8 节点已在线 · 零请求丢失 · 控制面 / 引擎 / API 全部健康
                  </div>
                </div>
                <Button variant="pri">
                  <Icon name="logs" size={13} className="ico" />
                  查看变更详情
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

function VersionTimeline() {
  return (
    <div style={{ position: 'relative', paddingLeft: 30 }}>
      <div
        style={{
          position: 'absolute',
          left: 11,
          top: 12,
          bottom: 12,
          width: 2,
          background:
            'linear-gradient(180deg, var(--brand-1), var(--brand-2) 50%, var(--line) 100%)',
          borderRadius: 1,
        }}
      />
      {VERSIONS.map((v, i) => (
        <div
          key={v.v}
          style={{
            position: 'relative',
            padding: '12px 0',
            borderBottom: i < VERSIONS.length - 1 ? '1px solid var(--line-2)' : 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: -26,
              top: 18,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: v.cur
                ? 'var(--brand-1)'
                : v.latest
                  ? 'var(--warn)'
                  : 'var(--bg-1)',
              border:
                '2px solid ' +
                (v.cur
                  ? 'var(--brand-1)'
                  : v.latest
                    ? 'var(--warn)'
                    : 'var(--line-strong)'),
              boxShadow: v.cur
                ? '0 0 14px var(--brand-1)'
                : v.latest
                  ? '0 0 14px var(--warn)'
                  : 'none',
            }}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
              <span className="mono fw-700 fs-15 text-0">{v.v}</span>
              <Tag kind={v.k}>
                {v.t === 'rc'
                  ? '候选版'
                  : v.t === 'patch'
                    ? '补丁'
                    : v.t === 'major'
                      ? '主版本'
                      : '小版本'}
              </Tag>
              {v.cur && (
                <Tag kind="ok">
                  <span className="dot" />
                  当前运行
                </Tag>
              )}
              {v.latest && (
                <Tag kind="warn">
                  <span className="dot" />
                  最新可用
                </Tag>
              )}
              <span className="muted fs-12">{v.c}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="mono fs-11 muted">{v.size}</span>
              <span className="mono fs-12 muted">{v.d}</span>
              {!v.cur && !v.latest && (
                <Button variant="ghost" size="sm">
                  <Icon name="refresh" size={11} className="ico" />
                  回滚至此版本
                </Button>
              )}
              {v.latest && (
                <Button variant="line" size="sm">
                  <Icon name="logs" size={11} className="ico" />
                  更新日志
                </Button>
              )}
              {v.cur && <span className="muted fs-12 mono">— 当前 —</span>}
            </div>
          </div>

          {(v.cur || v.latest) && (
            <div className="muted fs-11 mt-2">{v.notes}</div>
          )}
        </div>
      ))}
    </div>
  )
}

function UpdateSchedule({
  autoUpdate,
  setAutoUpdate,
}: {
  autoUpdate: boolean
  setAutoUpdate: (v: boolean) => void
}) {
  const [policy, setPolicy] = useState('security')
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="fw-700 text-0 fs-14">自动应用安全补丁</div>
          <div className="muted fs-11 mt-2">
            仅自动安装标记为「安全补丁」的版本 · 不会自动升级到主版本
          </div>
        </div>
        <Toggle on={autoUpdate} onChange={setAutoUpdate} />
      </div>

      <div
        className="muted fs-11 mb-2 mt-3"
        style={{ letterSpacing: 1, textTransform: 'uppercase' }}
      >
        更新策略
      </div>
      <div className="stack" style={{ gap: 8 }}>
        {[
          { v: 'security', l: '仅安全补丁', d: '推荐 · 自动跟进 CVE 修复', c: 'var(--ok)' },
          { v: 'patch', l: '安全 + 补丁', d: '包含 Bug 修复', c: 'var(--brand-1)' },
          { v: 'minor', l: '稳定版小版本', d: '功能性更新需手动确认', c: 'var(--warn)' },
          { v: 'off', l: '关闭自动更新', d: '所有升级人工触发', c: 'var(--text-3)' },
        ].map(p => (
          <div
            key={p.v}
            onClick={() => setPolicy(p.v)}
            style={{
              padding: 10,
              borderRadius: 8,
              border: '1px solid ' + (policy === p.v ? p.c : 'var(--line)'),
              background: policy === p.v ? 'rgba(168,85,247,.04)' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border:
                  '2px solid ' + (policy === p.v ? p.c : 'var(--line-strong)'),
                background: policy === p.v ? p.c : 'transparent',
                boxShadow: policy === p.v ? 'inset 0 0 0 3px var(--bg-1)' : 'none',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                className="fw-600 fs-13"
                style={{ color: policy === p.v ? 'var(--text-0)' : 'var(--text-1)' }}
              >
                {p.l}
              </div>
              <div className="muted fs-11">{p.d}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function MaintenanceWindow() {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const matrix = useMemo(() => {
    return days.map((_, d) =>
      hours.map(h => {
        if (d >= 1 && d <= 5 && h >= 2 && h <= 4) return 1
        if ((d === 0 || d === 6) && (h >= 23 || h <= 4)) return 1
        return 0
      }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [onlyWindow, setOnlyWindow] = useState(true)

  return (
    <>
      <div className="muted fs-11 mb-3" style={{ letterSpacing: 0.4 }}>
        点击格子开启/关闭维护窗口 · 升级与重启仅在窗口内执行
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '24px repeat(24, 1fr)',
          gap: 2,
          marginBottom: 10,
        }}
      >
        <div />
        {hours.map(h => (
          <div key={h} className="muted mono fs-11" style={{ textAlign: 'center' }}>
            {h % 6 === 0 ? h : ''}
          </div>
        ))}
        {matrix.map((row, di) => (
          <DayRow key={di} dayLabel={days[di]} row={row} />
        ))}
      </div>

      <div className="divider-h" />

      <div className="row r-1-1 gap-3">
        <div className="field">
          <label>时区</label>
          <select className="select">
            <option>Asia/Shanghai (UTC+8)</option>
          </select>
        </div>
        <div className="field">
          <label>下次窗口</label>
          <div
            className="mono fs-13 text-0 fw-700"
            style={{ height: 34, display: 'flex', alignItems: 'center' }}
          >
            5/18 02:00 — 05:00
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <Toggle on={onlyWindow} onChange={setOnlyWindow} />
        <span className="fs-12">仅在维护窗口内执行升级</span>
      </div>
    </>
  )
}

function DayRow({ dayLabel, row }: { dayLabel: string; row: number[] }) {
  return (
    <>
      <div className="muted fs-11" style={{ display: 'grid', placeItems: 'center' }}>
        {dayLabel}
      </div>
      {row.map((v, hi) => (
        <div
          key={hi}
          style={{
            aspectRatio: '1',
            borderRadius: 3,
            background: v ? 'var(--brand-1)' : 'var(--bg-3)',
            border: '1px solid ' + (v ? 'var(--brand-1)' : 'transparent'),
            boxShadow: v ? '0 0 4px rgba(168,85,247,.5)' : 'none',
            cursor: 'pointer',
            transition: 'all .12s',
          }}
          title={`${dayLabel} ${hi}:00`}
        />
      ))}
    </>
  )
}
