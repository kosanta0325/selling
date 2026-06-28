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
    backgroundColor: 'rgba(5, 5, 15, 0.9)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(139, 92, 246, 0.12)',
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
    background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 16px rgba(139, 92, 246, 0.5)',
    flexShrink: 0,
  },
  logoEmoji: { color: '#fff', fontSize: 16, fontWeight: 900 },
  logoText: { fontSize: 20, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.5px' },
  logoAccent: {
    background: 'linear-gradient(90deg, #a78bfa, #22d3ee)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  nav: { display: 'flex', alignItems: 'center', gap: 8 },
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
    textDecoration: 'none',
  },
  navLinkActive: { color: '#a78bfa' },
  navDot: {
    width: 5, height: 5, borderRadius: '50%',
    backgroundColor: '#8b5cf6', boxShadow: '0 0 6px #8b5cf6', display: 'inline-block',
  },
  sellBtn: {
    padding: '9px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
    color: '#e2e8f0',
    background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(34,211,238,0.1))',
    border: '1px solid rgba(139, 92, 246, 0.4)',
    transition: 'all 0.2s', textDecoration: 'none',
  },
  sellBtnActive: {
    background: 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(34,211,238,0.2))',
    borderColor: 'rgba(139, 92, 246, 0.8)',
    boxShadow: '0 0 16px rgba(139, 92, 246, 0.3)',
  },
  userArea: {
    display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4,
    paddingLeft: 12, borderLeft: '1px solid rgba(255,255,255,0.08)',
  },
  username: { fontSize: 13, color: '#64748b' },
  logoutBtn: {
    padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
    color: '#94a3b8', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
  },
  mobileRight: { display: 'flex', alignItems: 'center', gap: 10 },
  sellBtnMobile: {
    padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    color: '#e2e8f0',
    background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(34,211,238,0.1))',
    border: '1px solid rgba(139, 92, 246, 0.4)',
    textDecoration: 'none', whiteSpace: 'nowrap',
  },
  hamburger: {
    background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
    display: 'flex', flexDirection: 'column', gap: 5,
    alignItems: 'center', justifyContent: 'center', width: 36, height: 36,
  },
  bar: {
    display: 'block', width: 22, height: 2, backgroundColor: '#94a3b8',
    borderRadius: 2, transition: 'transform 0.25s, opacity 0.25s', transformOrigin: 'center',
  },
  mobileMenu: {
    position: 'sticky', top: 60, zIndex: 199,
    backgroundColor: 'rgba(5, 5, 15, 0.97)',
    borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
    overflow: 'hidden', transition: 'max-height 0.3s ease, opacity 0.25s ease',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
  },
  mobileNavLink: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '16px 24px', fontSize: 15, fontWeight: 500, color: '#94a3b8',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    textDecoration: 'none', position: 'relative',
  },
  mobileNavLinkActive: { color: '#a78bfa', backgroundColor: 'rgba(139,92,246,0.06)' },
  mobileNavIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  mobileActiveDot: {
    marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
    backgroundColor: '#8b5cf6', boxShadow: '0 0 8px #8b5cf6',
  },
  mobileLogoutBtn: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '16px 24px', fontSize: 15, fontWeight: 500, color: '#64748b',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    background: 'none', border: 'none', width: '100%', cursor: 'pointer',
    textAlign: 'left',
  },
  overlay: {
    position: 'fixed', inset: 0, zIndex: 198, backgroundColor: 'rgba(0,0,0,0.4)',
  },
}
