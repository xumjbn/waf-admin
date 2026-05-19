import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export interface SectionHdProps {
  title: ReactNode
  ico?: IconName
  right?: ReactNode
  hint?: ReactNode
}

export function SectionHd({ title, ico, right, hint }: SectionHdProps) {
  return (
    <div className="flex items-center justify-between mb-3" style={{ marginTop: 8 }}>
      <div className="flex items-center gap-2">
        {ico && (
          <span className="t-brand">
            <Icon name={ico} size={14} />
          </span>
        )}
        <span className="fs-13 fw-700 text-0" style={{ letterSpacing: 0.3 }}>
          {title}
        </span>
        {hint && <span className="fs-11 muted">· {hint}</span>}
      </div>
      {right}
    </div>
  )
}
