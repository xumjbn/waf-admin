import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export interface CardProps {
  title?: ReactNode
  ico?: IconName
  actions?: ReactNode
  meta?: ReactNode
  children: ReactNode
  className?: string
  bodyClass?: string
  bracketed?: boolean
}

export function Card({
  title,
  ico,
  actions,
  meta,
  children,
  className = '',
  bodyClass = '',
  bracketed,
}: CardProps) {
  const cls = ['card', className, bracketed ? 'bracketed' : ''].filter(Boolean).join(' ')
  return (
    <div className={cls}>
      {(title || actions) && (
        <div className="card-hd">
          <h3>
            {ico && <Icon name={ico} size={14} className="ico" />}
            {title}
          </h3>
          <div className="hd-actions">
            {meta && <span className="hd-meta">{meta}</span>}
            {actions}
          </div>
        </div>
      )}
      <div className={`card-bd ${bodyClass}`}>{children}</div>
    </div>
  )
}
