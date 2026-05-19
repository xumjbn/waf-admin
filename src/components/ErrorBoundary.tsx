import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            height: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div
            className="card glass bracketed"
            style={{ padding: '32px 28px', maxWidth: 460, textAlign: 'center' }}
          >
            <div className="t-pink fw-700 mono" style={{ letterSpacing: 1.5, fontSize: 11 }}>
              ● RUNTIME EXCEPTION
            </div>
            <h2
              style={{
                fontSize: 22,
                color: 'var(--text-0)',
                fontWeight: 700,
                margin: '12px 0 8px',
              }}
            >
              页面出错了
            </h2>
            <p className="muted fs-12" style={{ marginBottom: 22 }}>
              {import.meta.env.DEV && this.state.error
                ? this.state.error.message
                : '抱歉,页面遇到了一些问题'}
            </p>
            <button
              type="button"
              className="btn btn-pri"
              onClick={this.handleReset}
              style={{ justifyContent: 'center' }}
            >
              重新加载
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
