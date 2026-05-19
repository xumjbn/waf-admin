import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { Sparkline } from './Sparkline'

export type KpiKind = 'brand' | 'danger' | 'warn' | 'ok' | 'info'

export interface KpiProps {
  label: string
  value: ReactNode
  unit?: string
  ico: IconName
  kind?: KpiKind
  delta?: string
  deltaDir?: 'up' | 'down'
  sparkData?: number[]
  sparkColor?: string
  hint?: string
}

const KIND_BG: Record<KpiKind, string> = {
  brand: 'rgba(168,85,247,.12)',
  danger: 'rgba(239,68,68,.12)',
  warn: 'rgba(245,158,11,.12)',
  ok: 'rgba(16,185,129,.12)',
  info: 'rgba(34,211,238,.12)',
}

const KIND_FG: Record<KpiKind, string> = {
  brand: 'var(--brand-1)',
  danger: 'var(--danger)',
  warn: 'var(--warn)',
  ok: 'var(--ok)',
  info: 'var(--info)',
}

export function KPI({
  label,
  value,
  unit,
  ico,
  kind = 'brand',
  delta,
  deltaDir,
  sparkData,
  sparkColor,
  hint,
}: KpiProps) {
  return (
    <div className={`kpi ${kind}`}>
      <div className="kpi-top">
        <div className="kpi-lbl">{label}</div>
        <div className="kpi-ico" style={{ background: KIND_BG[kind], color: KIND_FG[kind] }}>
          <Icon name={ico} size={15} />
        </div>
      </div>
      <div className="kpi-val">
        {value}
        {unit && <span className="kpi-unit">{unit}</span>}
      </div>
      {sparkData && <Sparkline data={sparkData} color={sparkColor || KIND_FG[kind]} />}
      {delta && (
        <div className="kpi-foot">
          <span className={deltaDir === 'up' ? 'delta-up' : 'delta-down'}>
            <Icon name={deltaDir === 'up' ? 'arrow-up' : 'arrow-down'} size={11} /> {delta}
          </span>
          <span className="muted">{hint ?? '较昨日'}</span>
        </div>
      )}
    </div>
  )
}
