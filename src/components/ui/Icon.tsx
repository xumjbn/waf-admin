import type { CSSProperties, SVGProps } from 'react'

export type IconName =
  | 'shield'
  | 'grid'
  | 'globe'
  | 'activity'
  | 'pulse'
  | 'sites'
  | 'rules'
  | 'topology'
  | 'server'
  | 'logs'
  | 'reports'
  | 'settings'
  | 'users'
  | 'bell'
  | 'search'
  | 'menu'
  | 'plus'
  | 'filter'
  | 'download'
  | 'refresh'
  | 'play'
  | 'pause'
  | 'chevron-right'
  | 'chevron-down'
  | 'grip'
  | 'arrow-up'
  | 'arrow-down'
  | 'alert'
  | 'check'
  | 'x'
  | 'close-x'
  | 'eye'
  | 'edit'
  | 'trash'
  | 'cpu'
  | 'lock'
  | 'project'
  | 'theme'
  | 'lang'
  | 'sun'
  | 'moon'
  | 'sparkles'
  | 'crosshair'
  | 'fire'
  | 'database'
  | 'flow'
  | 'sliders'
  | 'expand'

export interface IconProps {
  name: IconName
  size?: number
  className?: string
  style?: CSSProperties
}

export function Icon({ name, size = 16, className, style }: IconProps) {
  const p: SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    style,
  }
  switch (name) {
    case 'shield':
      return (
        <svg {...p}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    case 'grid':
      return (
        <svg {...p}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    case 'globe':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
      )
    case 'activity':
      return (
        <svg {...p}>
          <path d="M3 12h4l3-8 4 16 3-8h4" />
        </svg>
      )
    case 'pulse':
      return (
        <svg {...p}>
          <path d="M3 12h4l2-3 4 6 2-3h6" />
        </svg>
      )
    case 'sites':
      return (
        <svg {...p}>
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M3 9h18M8 4v14" />
        </svg>
      )
    case 'rules':
      return (
        <svg {...p}>
          <path d="M9 4h11M9 12h11M9 20h11" />
          <circle cx="4" cy="4" r="1.5" />
          <circle cx="4" cy="12" r="1.5" />
          <circle cx="4" cy="20" r="1.5" />
        </svg>
      )
    case 'topology':
      return (
        <svg {...p}>
          <circle cx="6" cy="6" r="2.5" />
          <circle cx="18" cy="6" r="2.5" />
          <circle cx="12" cy="18" r="2.5" />
          <path d="M7.5 7.5l3 8M16.5 7.5l-3 8M8 6h8" />
        </svg>
      )
    case 'server':
      return (
        <svg {...p}>
          <rect x="3" y="4" width="18" height="6" rx="1.5" />
          <rect x="3" y="14" width="18" height="6" rx="1.5" />
          <circle cx="7" cy="7" r=".7" fill="currentColor" />
          <circle cx="7" cy="17" r=".7" fill="currentColor" />
        </svg>
      )
    case 'logs':
      return (
        <svg {...p}>
          <path d="M14 3H5v18h14V8z" />
          <path d="M14 3v5h5M9 13h6M9 17h6" />
        </svg>
      )
    case 'reports':
      return (
        <svg {...p}>
          <path d="M3 20V8l5-4 5 4v12" />
          <path d="M3 20h18M13 12h4M13 16h4" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    case 'users':
      return (
        <svg {...p}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 21v-1a6 6 0 0 1 12 0v1M16 11a3 3 0 1 0 0-6M21 21v-1a6 6 0 0 0-4-5.7" />
        </svg>
      )
    case 'bell':
      return (
        <svg {...p}>
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
      )
    case 'search':
      return (
        <svg {...p}>
          <circle cx="11" cy="11" r="7" />
          <path d="M16 16l5 5" />
        </svg>
      )
    case 'menu':
      return (
        <svg {...p}>
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...p}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case 'filter':
      return (
        <svg {...p}>
          <path d="M3 5h18l-7 8v6l-4 2v-8z" />
        </svg>
      )
    case 'download':
      return (
        <svg {...p}>
          <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
      )
    case 'refresh':
      return (
        <svg {...p}>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
        </svg>
      )
    case 'play':
      return (
        <svg {...p}>
          <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'pause':
      return (
        <svg {...p}>
          <rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none" />
          <rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'chevron-right':
      return (
        <svg {...p}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      )
    case 'chevron-down':
      return (
        <svg {...p}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      )
    case 'grip':
      return (
        <svg {...p}>
          <circle cx="9" cy="6" r="1" fill="currentColor" />
          <circle cx="15" cy="6" r="1" fill="currentColor" />
          <circle cx="9" cy="12" r="1" fill="currentColor" />
          <circle cx="15" cy="12" r="1" fill="currentColor" />
          <circle cx="9" cy="18" r="1" fill="currentColor" />
          <circle cx="15" cy="18" r="1" fill="currentColor" />
        </svg>
      )
    case 'arrow-up':
      return (
        <svg {...p}>
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      )
    case 'arrow-down':
      return (
        <svg {...p}>
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      )
    case 'alert':
      return (
        <svg {...p}>
          <path d="M12 9v4M12 17h.01M10.3 3.86l-8.6 14a2 2 0 0 0 1.73 3h17.14a2 2 0 0 0 1.73-3l-8.6-14a2 2 0 0 0-3.4 0z" />
        </svg>
      )
    case 'check':
      return (
        <svg {...p}>
          <path d="M5 12l5 5L20 7" />
        </svg>
      )
    case 'x':
      return (
        <svg {...p}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      )
    case 'close-x':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9l6 6M15 9l-6 6" />
        </svg>
      )
    case 'eye':
      return (
        <svg {...p}>
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    case 'edit':
      return (
        <svg {...p}>
          <path d="M11 4H4v16h16v-7" />
          <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      )
    case 'trash':
      return (
        <svg {...p}>
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
      )
    case 'cpu':
      return (
        <svg {...p}>
          <rect x="5" y="5" width="14" height="14" rx="1.5" />
          <rect x="9" y="9" width="6" height="6" />
          <path d="M3 9h2M3 15h2M19 9h2M19 15h2M9 3v2M15 3v2M9 19v2M15 19v2" />
        </svg>
      )
    case 'lock':
      return (
        <svg {...p}>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 1 1 8 0v4" />
        </svg>
      )
    case 'project':
      return (
        <svg {...p}>
          <path d="M3 7l9-4 9 4-9 4-9-4z" />
          <path d="M3 12l9 4 9-4M3 17l9 4 9-4" />
        </svg>
      )
    case 'theme':
      return (
        <svg {...p}>
          <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36A5.5 5.5 0 0 1 12 3z" />
        </svg>
      )
    case 'lang':
      return (
        <svg {...p}>
          <path d="M5 8h6M8 5v3M11 16l-2-6-2 6M7 14h4M14 16c2-4 4-8 4-8s2 4 4 8M15.5 13h5" />
        </svg>
      )
    case 'sun':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      )
    case 'moon':
      return (
        <svg {...p}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )
    case 'sparkles':
      return (
        <svg {...p}>
          <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
          <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
        </svg>
      )
    case 'crosshair':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M22 12h-4M6 12H2M12 6V2M12 22v-4" />
        </svg>
      )
    case 'fire':
      return (
        <svg {...p}>
          <path d="M12 22a7 7 0 0 1-7-7c0-4 4-5 4-9 0 0 5 1 6 6 1-1 2-2 2-4 3 2 4 5 4 8a7 7 0 0 1-9 6z" />
        </svg>
      )
    case 'database':
      return (
        <svg {...p}>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6" />
        </svg>
      )
    case 'flow':
      return (
        <svg {...p}>
          <rect x="2" y="9" width="6" height="6" rx="1" />
          <rect x="16" y="9" width="6" height="6" rx="1" />
          <path d="M8 12h8M11 9l-3 3 3 3M13 9l3 3-3 3" />
        </svg>
      )
    case 'sliders':
      return (
        <svg {...p}>
          <path d="M4 21V14M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
          <circle cx="4" cy="12" r="2" />
          <circle cx="12" cy="10" r="2" />
          <circle cx="20" cy="14" r="2" />
        </svg>
      )
    case 'expand':
      return (
        <svg {...p}>
          <path d="M3 3h7M3 3v7M21 3h-7M21 3v7M3 21h7M3 21v-7M21 21h-7M21 21v-7" />
        </svg>
      )
    default:
      return (
        <svg {...p}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      )
  }
}
