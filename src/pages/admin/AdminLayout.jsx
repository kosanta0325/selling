import { Link, useLocation, Outlet } from 'react-router-dom'
import { ADMIN_STATS } from '../../data/adminData.js'

const NAV = [
  { path: '/admin', label: 'ダッシュボード', icon: '◈' },
  { path: '/admin/products', label: '商品審査', icon: '◉', badge: ADMIN_STATS.pendingReview },
  { path: '/admin/users', label: 'ユーザー管理', icon: '◎' },
]

export default function AdminLayout() {
  const location = useLocation()

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <div style={styles.logoMark}>⬡</div>
          <div>
            <div style={styles.logoTitle}>AI Market</div>
            <div style={styles.logoSub}>管理画面</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {NAV.map(item => {
            const active = item.path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path)
            return (
              <Link key={item.path} to={item.path} style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}>
                <span style={styles.navIcon}>{item.icon}</span>
                <span style={styles.navLabel}>{item.label}</span>
                {item.badge > 0 && (
                  <span style={styles.badge}>{item.badge}</span>
                )}
              </Link>
            )
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <Link to="/" style={styles.backToSite}>
            ← サイトに戻る
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
  },
  sidebar: {
    width: 220,
    backgroundColor: '#080814',
    borderRight: '1px solid rgba(139,92,246,0.12)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
  },
  sidebarLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '24px 20px 20px',
    borderBottom: '1px solid rgba(139,92,246,0.1)',
    marginBottom: 8,
  },
  logoMark: {
    width: 34,
    height: 34,
    background: 'linear-gradient(135deg, #7c3aed, #0891b2)',
    borderRadius: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    color: '#fff',
    flexShrink: 0,
    boxShadow: '0 0 14px rgba(124,58,237,0.4)',
  },
  logoTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: '#e2e8f0',
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: 10,
    color: '#475569',
    letterSpacing: '0.06em',
    fontWeight: 600,
  },
  nav: {
    padding: '8px 12px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 500,
    color: '#64748b',
    transition: 'all 0.15s',
    textDecoration: 'none',
    position: 'relative',
  },
  navItemActive: {
    background: 'rgba(139,92,246,0.12)',
    color: '#a78bfa',
    fontWeight: 700,
    borderLeft: '2px solid #8b5cf6',
  },
  navIcon: {
    fontSize: 15,
    width: 18,
    textAlign: 'center',
  },
  navLabel: {
    flex: 1,
  },
  badge: {
    backgroundColor: '#ef4444',
    color: '#fff',
    fontSize: 10,
    fontWeight: 800,
    padding: '2px 6px',
    borderRadius: 10,
    minWidth: 18,
    textAlign: 'center',
  },
  sidebarFooter: {
    padding: '16px 12px 20px',
    borderTop: '1px solid rgba(139,92,246,0.08)',
  },
  backToSite: {
    display: 'block',
    padding: '9px 12px',
    borderRadius: 8,
    fontSize: 12,
    color: '#475569',
    fontWeight: 500,
    transition: 'color 0.15s',
    textDecoration: 'none',
  },
  main: {
    flex: 1,
    overflowX: 'hidden',
    backgroundColor: '#05050f',
  },
}
