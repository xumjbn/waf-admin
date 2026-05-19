import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/components/ui'

const NotFound = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 2,
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
        padding: 32,
      }}
    >
      <div
        className="card glass bracketed"
        style={{ padding: '40px 36px', textAlign: 'center', maxWidth: 460 }}
      >
        <div
          className="mono fw-700 t-pink"
          style={{ letterSpacing: 1.8, fontSize: 11, marginBottom: 6 }}
        >
          ● 404 / PATH NOT FOUND
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: 'var(--text-0)',
            letterSpacing: -2,
            lineHeight: 1,
            marginBottom: 12,
            fontFamily: 'Space Grotesk',
          }}
        >
          {t('notFound.title')}
        </div>
        <p className="muted fs-13" style={{ marginBottom: 22 }}>
          {t('notFound.subtitle')}
        </p>
        <button
          type="button"
          className="btn btn-pri"
          onClick={() => navigate('/aggregation')}
          style={{ justifyContent: 'center', margin: '0 auto' }}
        >
          <Icon name="grid" size={13} className="ico" />
          {t('notFound.backHome')}
        </button>
      </div>
    </div>
  )
}

export default NotFound
