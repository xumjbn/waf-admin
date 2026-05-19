import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login } from '@/api/auth'
import { Icon } from '@/components/ui'

const LoginPage = () => {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/aggregation'
  const isMockMode = import.meta.env.MODE === 'development'

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      void remember
      await login({ username, password })
      navigate(from, { replace: true })
    } catch {
      setError(t('login.loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="nw-login">
      <div className="nw-login-card card glass bracketed">
        <div className="nw-login-brand">
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
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--text-0)',
                letterSpacing: 0.4,
              }}
            >
              NebulaWAF
            </h1>
            <p className="muted fs-12" style={{ marginTop: 2, letterSpacing: 1.4 }}>
              {t('login.title')}
            </p>
          </div>
        </div>

        {isMockMode && (
          <div className="nw-login-hint" role="status" aria-live="polite">
            <Icon name="sparkles" size={13} />
            <div>
              <div className="fw-600 fs-12">{t('login.mockMode')}</div>
              <div className="muted fs-11">
                {t('login.mockAccount')} <code className="mono">admin / admin</code>{' '}
                {t('common.or')} <code className="mono">auditor / auditor</code>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="nw-login-form" aria-label={t('login.title')}>
          <div className="field">
            <label htmlFor="login-username">{t('login.username')}</label>
            <input
              id="login-username"
              className="input"
              type="text"
              autoComplete="username"
              placeholder={t('login.usernamePlaceholder')}
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="login-password">{t('login.password')}</label>
            <input
              id="login-password"
              className="input"
              type="password"
              autoComplete="current-password"
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <label className="nw-login-remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
            <span>{t('login.remember')}</span>
          </label>

          {error && (
            <div className="nw-login-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-pri"
            disabled={loading}
            style={{ height: 42, justifyContent: 'center', width: '100%' }}
          >
            {loading ? t('login.loggingIn') : t('login.loginButton')}
          </button>
        </form>
      </div>

      <style>{`
        .nw-login {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 32px 16px;
          position: relative;
          z-index: 2;
        }
        .nw-login-card {
          width: 100%;
          max-width: 400px;
          padding: 32px 28px 28px;
          box-shadow: var(--shadow-pop);
        }
        .nw-login-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 22px;
        }
        .nw-login-hint {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 10px 12px;
          margin-bottom: 16px;
          border-radius: 8px;
          background: rgba(168, 85, 247, 0.07);
          border: 1px solid var(--line-strong);
          color: var(--text-1);
        }
        .nw-login-hint > svg {
          color: var(--brand-1);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .nw-login-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .nw-login-remember {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: var(--text-2);
          user-select: none;
          cursor: pointer;
        }
        .nw-login-remember input {
          accent-color: var(--brand-1);
        }
        .nw-login-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: var(--danger);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12.5px;
        }
      `}</style>
    </div>
  )
}

export default LoginPage
