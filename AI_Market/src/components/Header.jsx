import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const location = useLocation()

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>🤖</span>
          <span style={styles.logoText}>AI Market</span>
        </Link>
        <nav style={styles.nav}>
          <Link to="/" style={{ ...styles.navLink, ...(location.pathname === '/' ? styles.navLinkActive : {}) }}>
            商品一覧
          </Link>
          <Link to="/sell" style={{ ...styles.navLink, ...(location.pathname === '/sell' ? styles.navLinkActive : {}) }}>
            出品する
          </Link>
        </nav>
      </div>
    </header>
  )
}

const styles = {
  header: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0e0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  inner: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 20px',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    fontSize: 28,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 700,
    color: '#6c47ff',
    letterSpacing: '-0.5px',
  },
  nav: {
    display: 'flex',
    gap: 8,
  },
  navLink: {
    padding: '8px 18px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    color: '#555',
    transition: 'background 0.15s',
  },
  navLinkActive: {
    backgroundColor: '#f0ebff',
    color: '#6c47ff',
    fontWeight: 700,
  },
}
