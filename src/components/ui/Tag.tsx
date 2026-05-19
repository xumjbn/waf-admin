import type { CSSProperties, ReactNode } from 'react'

export type TagKind = 'def' | 'brand' | 'ok' | 'warn' | 'danger' | 'bad' | 'info' | 'pink'

export interface TagProps {
  kind?: TagKind
  children: ReactNode
  lg?: boolean
  dot?: boolean
  style?: CSSProperties
}

export function Tag({ kind = 'def', children, lg, dot, style }: TagProps) {
  return (
    <span className={`tag tag-${kind}${lg ? ' tag-lg' : ''}`} style={style}>
      {dot && <span className="dot" />}
      {children}
    </span>
  )
}
