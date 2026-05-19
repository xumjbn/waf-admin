import { Icon, type IconName } from '@/components/ui'

export interface ComingSoonProps {
  title: string
  ord?: string
  ico?: IconName
  description?: string
}

export function ComingSoon({
  title,
  ord = 'NW · M2',
  ico = 'sparkles',
  description,
}: ComingSoonProps) {
  return (
    <>
      <div className="page-hd">
        <div>
          <h1>
            <span className="ord">{ord}</span>
            {title}
          </h1>
          <p>
            {description ?? '该模块正在按 NebulaWAF 设计规范重构,M2 阶段交付。'}
            <span className="t-amber" style={{ marginLeft: 12 }}>
              <span className="live-dot" />
              IN PROGRESS
            </span>
          </p>
        </div>
      </div>

      <div
        className="card glass bracketed"
        style={{
          padding: '56px 40px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: 'var(--grad-brand)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 10px 30px -8px rgba(168,85,247,.55)',
          }}
        >
          <Icon name={ico} size={32} style={{ color: '#fff' }} />
        </div>
        <div
          className="mono fw-700 t-brand"
          style={{ fontSize: 11, letterSpacing: 1.8, marginBottom: 6 }}
        >
          ● PLACEHOLDER · MILESTONE 2
        </div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-0)',
            letterSpacing: -0.3,
            marginBottom: 10,
          }}
        >
          {title}
        </h2>
        <p className="muted fs-13" style={{ maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
          M1 阶段优先交付了「安全总览」与「实时监控」两个旗舰大屏页面。
          其余模块的设计规范、组件与数据接入将在 M2 阶段完成。
        </p>
      </div>
    </>
  )
}
