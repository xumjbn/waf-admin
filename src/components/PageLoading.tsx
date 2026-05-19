const PageLoading = () => (
  <div
    style={{
      height: '100vh',
      display: 'grid',
      placeItems: 'center',
      position: 'relative',
      zIndex: 2,
    }}
  >
    <div style={{ textAlign: 'center', color: 'var(--text-2)' }}>
      <div
        className="brand-mark"
        aria-hidden="true"
        style={{ margin: '0 auto 14px', width: 42, height: 42 }}
      >
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
      <div className="mono fs-11" style={{ letterSpacing: 1.4, color: 'var(--text-3)' }}>
        NEBULA · LOADING
      </div>
    </div>
  </div>
)

export default PageLoading
