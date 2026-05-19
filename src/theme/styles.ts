import type { CSSProperties } from 'react'

export const cardStyle: CSSProperties = {
  borderRadius: 10,
  boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}

export const cardHoverStyle: CSSProperties = {
  ...cardStyle,
  transform: 'translateY(-2px)',
  boxShadow: '0 4px 16px rgba(0, 102, 255, 0.12)',
}

export const statisticCardStyle: CSSProperties = {
  ...cardStyle,
  cursor: 'default',
}

export const pageContainerStyle: CSSProperties = {
  background: 'transparent',
}

export const tableStyle: CSSProperties = {
  borderRadius: 8,
}

export const modalStyle: CSSProperties = {
  borderRadius: 12,
}

export const buttonPrimaryStyle: CSSProperties = {
  fontWeight: 500,
  boxShadow: '0 2px 6px rgba(0, 102, 255, 0.25)',
}

export const tagStyle: CSSProperties = {
  borderRadius: 4,
  fontWeight: 500,
}
