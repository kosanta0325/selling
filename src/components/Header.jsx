import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { to: '/', label: '商品一覧', icon: '🏪' },
  { to: '/my-products', label: 'マイ商品', icon: '📦' },
  { to: '/transactions', label: '取引管理', icon: '📋' },
]

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  function goToAdmin() {
    sessionStorage.removeItem('adminUserView')
    navigate('/admin')
  }

  return (
    <>
      <header style={styles.header}>
        <div style={styles.inner}>
          {/* Logo */}
          <Link to="/" style={styles.logo}>
            <div style={styles.logoIcon}>
              <span style={styles.logoEmoji}>⬡</span>
            </div>
            <span style={styles.logoText}>AI<span style={styles.logoAccent}>Market</span></span>
          </Link>

          {/* Desktop nav */}
          {!isMobile && (
            <nav style={styles.nav}>
              {NAV_LINKS.map(({ to, label }) => {
                const active = location.pathname === to
                return (
                  <Link key={to} to={to} style={{ ...styles.navLink, ...(active ? styles.navLinkActive : {}) }}>
                    {active && <span style={styles.navDot} />}
                    {label}
                  </Link>
                )
              })}
              <Link to="/sell" style={{ ...styles.sellBtn, ...(location.pathname === '/sell' ? styles.sellBtnActive : {}) }}>
                + 出品する
              </Link>
              {profile && (
                <div style={styles.userArea}>
                  {profile.role === 'admin' && (
                    <button style={styles.adminBtn} onClick={goToAdmin}>管理者画面</button>
                  )}
                  <span style={styles.username}>👤 {profile.username}</span>
                  <button style={styles.logoutBtn} onClick={handleSignOut}>ログアウト</button>
                </div>
              )}
            </nav>
          )}

          {/* Mobile: 出品ボタン + ハンバーガー */}
          {isMobile && (
            <div style={styles.mobileRight}>
              <Link to="/sell" style={{ ...styles.sellBtnMobile, ...(location.pathname === '/sell' ? styles.sellBtnActive : {}) }}>
                + 出品
              </Link>
              <button
                style={styles.hamburger}
                onClick={() => setMenuOpen(v => !v)}
                aria-label="メニュー"
              >
                <span style={{ ...styles.bar, transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
                <span style={{ ...styles.bar, opacity: menuOpen ? 0 : 1 }} />
                <span style={{ ...styles.bar, transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {isMobile && (
        <div style={{
          ...styles.mobileMenu,
          maxHeight: menuOpen ? '400px' : '0',
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
        }}>
          {NAV_LINKS.map(({ to, label, icon }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                style={{ ...styles.mobileNavLink, ...(active ? styles.mobileNavLinkActive : {}) }}
              >
                <span style={styles.mobileNavIcon}>{icon}</span>
                {label}
                {active && <span style={styles.mobileActiveDot} />}
              </Link>
            )
          })}
          {profile && (
            <button style={styles.mobileLogoutBtn} onClick={handleSignOut}>
              <span style={styles.mobileNavIcon}>🚪</span>
              ログアウト（{profile.username}）
            </button>
          )}
        </div>
      )}

      {/* Overlay to close menu */}
      {isMobile && menuOpen && (
        <div style={styles.overlay} onClick={() => setMenuOpen(false)} />
      )}
    </>
  )
}

const styles = {
  header: {
    backgroundColor: 'rgba(246,247,244,0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid #D8DCE9',
    position: 'sticky',
    top: 0,
    zIndex: 200,
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 16px',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
  },
  logoIcon: {
    width: 32,
    height: 32,
    background: '#2438A6',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoEmoji: { color: '#fff', fontSize: 16, fontWeight: 900 },
  logoText: { fontSize: 20, fontWeight: 800, color: '#101B3E', letterSpacing: '-0.5px', fontFamily: "'Sora', sans-serif" },
  logoAccent: { color: '#2438A6' },
  nav: { display: 'flex', alignItems: 'center', gap: 8 },
  navLink: {
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    color: '#5A6180',
    transition: 'color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    textDecoration: 'none',
  },
  navLinkActive: { color: '#2438A6', fontWeight: 600 },
  navDot: {
    width: 5, height: 5, borderRadius: '50%',
    backgroundColor: '#2438A6', display: 'inline-block',
  },
  sellBtn: {
    padding: '9px 20px', borderRadius: 20, fontSize: 14, fontWeight: 600,
    color: '#fff',
    background: '#2438A6',
    border: 'none',
    transition: 'all 0.2s', textDecoration: 'none',
  },
  sellBtnActive: {
    background: '#1a2b80',
  },
  userArea: {
    display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4,
    paddingLeft: 12, borderLeft: '1px solid #D8DCE9',
  },
  adminBtn: {
    padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    color: '#E8542F', background: 'rgba(232,84,47,0.08)',
    border: '1px solid rgba(232,84,47,0.3)', cursor: 'pointer',
  },
  username: { fontSize: 13, color: '#5A6180' },
  logoutBtn: {
    padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
    color: '#5A6180', background: 'transparent',
    border: '1px solid #D8DCE9', cursor: 'pointer',
  },
  mobileRight: { display: 'flex', alignItems: 'center', gap: 10 },
  sellBtnMobile: {
    padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
    color: '#fff',
    background: '#2438A6',
    border: 'none',
    textDecoration: 'none', whiteSpace: 'nowrap',
  },
  hamburger: {
    background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
    display: 'flex', flexDirection: 'column', gap: 5,
    alignItems: 'center', justifyContent: 'center', width: 36, height: 36,
  },
  bar: {
    display: 'block', width: 22, height: 2, backgroundColor: '#5A6180',
    borderRadius: 2, transition: 'transform 0.25s, opacity 0.25s', transformOrigin: 'center',
  },
  mobileMenu: {
    position: 'sticky', top: 60, zIndex: 199,
    backgroundColor: 'rgba(246,247,244,0.98)',
    borderBottom: '1px solid #D8DCE9',
    overflow: 'hidden', transition: 'max-height 0.3s ease, opacity 0.25s ease',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
  },
  mobileNavLink: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '16px 24px', fontSize: 15, fontWeight: 500, color: '#5A6180',
    borderBottom: '1px solid #D8DCE9',
    textDecoration: 'none', position: 'relative',
  },
  mobileNavLinkActive: { color: '#2438A6', backgroundColor: 'rgba(36,56,166,0.04)', fontWeight: 600 },
  mobileNavIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  mobileActiveDot: {
    marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
    backgroundColor: '#2438A6',
  },
  mobileLogoutBtn: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '16px 24px', fontSize: 15, fontWeight: 500, color: '#8A90A8',
    borderBottom: '1px solid #D8DCE9',
    background: 'none', border: 'none', width: '100%', cursor: 'pointer',
    textAlign: 'left',
  },
  overlay: {
    position: 'fixed', inset: 0, zIndex: 198, backgroundColor: 'rgba(16,27,62,0.25)',
  },
}
