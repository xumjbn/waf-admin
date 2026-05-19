export type BarKind = 'brand' | 'ok' | 'warn' | 'danger'

export interface BarProps {
  value: number
  max?: number
  kind?: BarKind
  width?: number
  label?: string
}

export function Bar({ value, max = 100, kind = 'brand', width = 60, label }: BarProps) {
  const v = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span className="bar" style={{ width, display: 'inline-block' }}>
        <span className={`fill ${kind}`} style={{ width: `${v}%` }} />
      </span>
      {label !== undefined && (
        <span className="mono" style={{ fontSize: 11.5, minWidth: 30 }}>
          {label}
        </span>
      )}
    </span>
  )
}
