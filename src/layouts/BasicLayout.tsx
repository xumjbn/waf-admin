import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'
import { useThemeEffect } from '@/hooks/useThemeEffect'
import { usePermission } from '@/hooks/usePermission'
import { logout } from '@/api/auth'
import { Icon, type IconName } from '@/components/ui'
import { cn } from '@/components/ui/cn'

interface NavItem {
  id: string
  path: string
  i18nKey: string
  ico: IconName
  badge?: string
  badgeKind?: 'danger'
  module: string
}

interface NavGroup {
  i18nKey: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    i18nKey: 'nav.group.overview',
    items: [
      {
        id: 'dashboard',
        path: '/aggregation',
        i18nKey: 'nav.dashboard',
        ico: 'grid',
        module: 'aggregation',
      },
      {
        id: 'monitor',
        path: '/aggregation/monitor',
        i18nKey: 'nav.monitor',
        ico: 'pulse',
        badge: 'LIVE',
        module: 'aggregation',
      },
    ],
  },
  {
    i18nKey: 'nav.group.business',
    items: [
      { id: 'sites', path: '/site', i18nKey: 'nav.sites', ico: 'sites', module: 'site' },
      {
        id: 'protection',
        path: '/policy',
        i18nKey: 'nav.protection',
        ico: 'shield',
        module: 'policy',
      },
      {
        id: 'instances',
        path: '/instance',
        i18nKey: 'nav.instances',
        ico: 'server',
        module: 'instance',
      },
    ],
  },
  {
    i18nKey: 'nav.group.ops',
    items: [
      { id: 'logs', path: '/log', i18nKey: 'nav.logs', ico: 'logs', module: 'log' },
      {
        id: 'alerts',
        path: '/acl',
        i18nKey: 'nav.alerts',
        ico: 'alert',
        badge: '3',
        badgeKind: 'danger',
        module: 'acl',
      },
      { id: 'reports', path: '/report', i18nKey: 'nav.reports', ico: 'reports', module: 'report' },
    ],
  },
  {
    i18nKey: 'nav.group.admin',
    items: [
      { id: 'users', path: '/user', i18nKey: 'nav.users', ico: 'users', module: 'user' },
      { id: 'system', path: '/system', i18nKey: 'nav.system', ico: 'settings', module: 'system' },
    ],
  },
]

function isActive(pathname: string, target: string): boolean {
  if (target === '/aggregation/monitor') {
    return pathname.startsWith('/aggregation/monitor')
  }
  if (target === '/aggregation') {
    return pathname === '/aggregation' || pathname === '/aggregation/'
  }
  return pathname === target || pathname.startsWith(`${target}/`)
}

export const BasicLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore(s => s.user)
  const clear = useAuthStore(s => s.clear)
  const { canAccess } = usePermission()
  const isDark = useThemeStore(s => s.isDark)
  const toggleTheme = useThemeStore(s => s.toggle)
  const { t, i18n } = useTranslation()
  useThemeEffect()

  const visibleNav = useMemo(() => {
    return NAV.map(g => ({
      ...g,
      items: g.items.filter(i => canAccess(i.module)),
    })).filter(g => g.items.length > 0)
  }, [canAccess])

  const allItems = visibleNav.flatMap(g => g.items.map(it => ({ ...it, group: g.i18nKey })))
  const current = allItems.find(it => isActive(location.pathname, it.path)) ?? allItems[0]
  const currentGroupKey = current?.group ?? ''

  const onLogout = async () => {
    try {
      await logout()
    } catch {
      // swallow — logout API can be best-effort
    }
    clear()
    navigate('/login', { replace: true })
  }

  const toggleLanguage = () => {
    const next = i18n.language === 'zh-CN' ? 'en-US' : 'zh-CN'
    i18n.changeLanguage(next)
  }

  const initial = (user?.name ?? 'A').slice(0, 1).toUpperCase()

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        {t('layout.skipToContent')}
      </a>
      <div className="nw-app">
        <aside className="sidebar" aria-label="Primary">
          <div className="sidebar-brand">
            <div className="brand-mark" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div className="brand-text">
              <strong>NebulaWAF</strong>
              <small>OPEN · v3.0</small>
            </div>
          </div>

          <nav className="nav-scroll" aria-label={t('layout.mainContent')}>
            {visibleNav.map(group => (
              <div key={group.i18nKey}>
                <div className="nav-group-title">{t(group.i18nKey)}</div>
                {group.items.map(item => {
                  const active = isActive(location.pathname, item.path)
                  return (
                    <div
                      key={item.id}
                      role="link"
                      tabIndex={0}
                      className={cn('nav-item', active && 'active')}
                      onClick={() => navigate(item.path)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          navigate(item.path)
                        }
                      }}
                    >
                      <Icon name={item.ico} size={16} className="ico" />
                      <span className="label">{t(item.i18nKey)}</span>
                      {item.badge && (
                        <span className={cn('badge', item.badgeKind === 'danger' && 'danger')}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="status-info">
              <div className="status-dot" />
              <div>
                <div className="text-1" style={{ fontWeight: 600, fontSize: 11.5 }}>
                  {t('layout.controlPlaneOnline')}
                </div>
                <div className="mono fs-11" style={{ color: 'var(--text-3)' }}>
                  cp-master · 99.99%
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="main-col">
          <header className="topbar">
            <div className="crumb">
              <span style={{ color: 'var(--brand-1)' }} className="mono fs-11 fw-700">
                NW
              </span>
              <span className="sep">/</span>
              <span>{currentGroupKey ? t(currentGroupKey) : ''}</span>
              <span className="sep">/</span>
              <b>{current ? t(current.i18nKey) : ''}</b>
            </div>
            <div className="search-bar" style={{ margin: '0 12px' }}>
              <Icon name="search" size={14} />
              <input placeholder={t('layout.searchPlaceholder')} aria-label={t('common.search')} />
              <span className="kbd">⌘K</span>
            </div>
            <div className="tb-actions">
              <button
                type="button"
                className="tb-icon"
                title={t('layout.toggleLanguage')}
                onClick={toggleLanguage}
              >
                <Icon name="lang" size={16} />
              </button>
              <button
                type="button"
                className="tb-icon"
                title={t('layout.toggleTheme')}
                onClick={toggleTheme}
              >
                <Icon name={isDark ? 'sun' : 'moon'} size={16} />
              </button>
              <button type="button" className="tb-icon has-dot" title={t('nav.alerts')}>
                <Icon name="bell" size={16} />
              </button>
              <button
                type="button"
                className="avatar"
                title={user?.name ?? t('layout.notLoggedIn')}
                onClick={onLogout}
              >
                {initial}
              </button>
            </div>
          </header>

          <main id="main-content" className="content" role="main">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  )
}
