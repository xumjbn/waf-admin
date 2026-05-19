import { Icon, type IconName } from './Icon'

export interface TabDef<T extends string = string> {
  value: T
  label: string
  ico?: IconName
  count?: number
  danger?: boolean
}

export interface TabsProps<T extends string = string> {
  tabs: ReadonlyArray<TabDef<T>>
  value: T
  onChange: (next: T) => void
}

export function Tabs<T extends string = string>({ tabs, value, onChange }: TabsProps<T>) {
  return (
    <div className="tabs">
      {tabs.map(t => {
        const on = value === t.value
        return (
          <div
            key={t.value}
            className={`tab${on ? ' on' : ''}`}
            onClick={() => onChange(t.value)}
            role="tab"
            tabIndex={0}
            aria-selected={on}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onChange(t.value)
              }
            }}
          >
            {t.ico && <Icon name={t.ico} size={13} />}
            {t.label}
            {t.count !== undefined && (
              <span className={t.count > 0 && t.danger ? 'cnt-dot' : 'cnt'}>{t.count}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
