import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'pri' | 'ghost' | 'line'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: Variant
  size?: 'sm' | 'md'
  iconOnly?: boolean
  children?: ReactNode
}

export function Button({
  variant = 'ghost',
  size = 'md',
  iconOnly,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'sm' && 'btn-sm',
    iconOnly && 'btn-icon',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  )
}
