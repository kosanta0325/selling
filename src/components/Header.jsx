import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const location = useLocation()

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <Link to="/" style={styles.logo}>
          <div style={styles.logoIcon}>
            <span style={styles.logoEmoji}>⬡</span>
          </div>
          <span style={styles.logoText}>AI<span style={styles.logoAccent}>Market</span></span>
        </Link>
        <nav style={styles.nav}>
          <Link to="/" style={{ ...styles.navLink, ...(location.pathname === '/' ? styles.navLinkActive : {}) }}>
            {location.pathname === '/' && <span style={styles.navDot} />}
            商品一覧
          </Link>
          <Link to="/my-products" style={{ ...styles.navLink, ...(location.pathname === '/my-products' ? styles.navLinkActive : {}) }}>
            {location.pathname === '/my-products' && <span style={styles.navDot} />}
            マイ商品
          </Link>
          <Link to="/transactions" style={{ ...styles.navLink, ...(location.pathname === '/transactions' ? styles.navLinkActive : {}) }}>
            {location.pathname === '/transactions' && <span style={styles.navDot} />}
            取引管理
          </Link>
          <Link to="/sell" style={{ ...styles.sellBtn, ...(location.pathname === '/sell' ? styles.sellBtnActive : {}) }}>
            + 出品する
          </Link>
        </nav>
      </div>
    </header>
  )
}

const styles = {
  header: {
    backgroundColor: 'rgba(5, 5, 15, 0.8)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(139, 92, 246, 0.12)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 32,
    height: 32,
    background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 16px rgba(139, 92, 246, 0.5)',
  },
  logoEmoji: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 900,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 800,
    color: '#e2e8f0',
    letterSpacing: '-0.5px',
  },
  logoAccent: {
    background: 'linear-gradient(90deg, #a78bfa, #22d3ee)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  navLink: {
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    color: '#94a3b8',
    transition: 'color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  navLinkActive: {
    color: '#a78bfa',
  },
  navDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    backgroundColor: '#8b5cf6',
    boxShadow: '0 0 6px #8b5cf6',
    display: 'inline-block',
  },
  sellBtn: {
    padding: '9px 20px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    color: '#e2e8f0',
    background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(34,211,238,0.1))',
    border: '1px solid rgba(139, 92, 246, 0.4)',
    transition: 'all 0.2s',
  },
  sellBtnActive: {
    background: 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(34,211,238,0.2))',
    borderColor: 'rgba(139, 92, 246, 0.8)',
    boxShadow: '0 0 16px rgba(139, 92, 246, 0.3)',
  },
}
