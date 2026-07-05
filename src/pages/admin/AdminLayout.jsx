import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const NAV = [
  { path: '/admin',          label: 'ダッシュボード', icon: '◈' },
  { path: '/admin/products', label: '商品審査',       icon: '◉' },
  { path: '/admin/users',    label: 'ユーザー管理',   icon: '◎' },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  function goToUserSite() {
    sessionStorage.setItem('adminUserView', 'true')
    navigate('/')
  }

  return (
    <div style={s.wrapper}>
      <aside style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <div style={s.logoMark}>⬡</div>
          <div>
            <div style={s.logoTitle}>AI Market</div>
            <div style={s.logoSub}>管理画面</div>
          </div>
        </div>

        <nav style={s.nav}>
          {NAV.map(item => {
            const active = item.path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path)
            return (
              <Link key={item.path} to={item.path} style={{ ...s.navItem, ...(active ? s.navItemActive : {}) }}>
                <span style={s.navIcon}>{item.icon}</span>
                <span style={s.navLabel}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div style={s.sidebarFooter}>
          {profile && (
            <div style={s.adminInfo}>
              <div style={s.adminAvatar}>{profile.username?.[0]?.toUpperCase()}</div>
              <div>
                <div style={s.adminName}>{profile.username}</div>
                <div style={s.adminRole}>管理者</div>
              </div>
            </div>
          )}
          <button onClick={goToUserSite} style={s.userSiteBtn}>↗ 一般サイトを見る</button>
          <button onClick={handleLogout} style={s.logoutBtn}>ログアウト</button>
        </div>
      </aside>

      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  )
}

const s = {
  wrapper: { display: 'flex', minHeight: '100vh' },
  sidebar: { width: 220, backgroundColor: '#080814', borderRight: '1px solid rgba(139,92,246,0.12)', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: 10, padding: '24px 20px 20px', borderBottom: '1px solid rgba(139,92,246,0.1)', marginBottom: 8 },
  logoMark: { width: 34, height: 34, background: 'linear-gradient(135deg, #7c3aed, #0891b2)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', flexShrink: 0, boxShadow: '0 0 14px rgba(124,58,237,0.4)' },
  logoTitle: { fontSize: 14, fontWeight: 800, color: '#e2e8f0', lineHeight: 1.2 },
  logoSub: { fontSize: 10, color: '#475569', letterSpacing: '0.06em', fontWeight: 600 },
  nav: { padding: '8px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, fontSize: 13, fontWeight: 500, color: '#64748b', transition: 'all 0.15s', textDecoration: 'none' },
  navItemActive: { background: 'rgba(139,92,246,0.12)', color: '#a78bfa', fontWeight: 700, borderLeft: '2px solid #8b5cf6' },
  navIcon: { fontSize: 15, width: 18, textAlign: 'center' },
  navLabel: { flex: 1 },
  sidebarFooter: { padding: '16px 12px 20px', borderTop: '1px solid rgba(139,92,246,0.08)', display: 'flex', flexDirection: 'column', gap: 8 },
  adminInfo: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px' },
  adminAvatar: { width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 },
  adminName: { fontSize: 12, fontWeight: 600, color: '#94a3b8' },
  adminRole: { fontSize: 10, color: '#8b5cf6', fontWeight: 600 },
  userSiteBtn: { padding: '8px 12px', borderRadius: 8, fontSize: 12, color: '#22d3ee', background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', cursor: 'pointer', textAlign: 'left', fontWeight: 500 },
  logoutBtn: { padding: '8px 12px', borderRadius: 8, fontSize: 12, color: '#f87171', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', cursor: 'pointer', textAlign: 'left', fontWeight: 500 },
  main: { flex: 1, overflowX: 'hidden', backgroundColor: '#05050f' },
}
