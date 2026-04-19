import { useState } from 'react'
import { USERS } from '../../data/adminData.js'

const STATUS_STYLES = {
  active: { color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)', label: 'アクティブ' },
  suspended: { color: '#fb923c', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.2)', label: '停止中' },
  banned: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', label: 'BAN' },
}

export default function AdminUsers() {
  const [users, setUsers] = useState(USERS)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const updateStatus = (id, status) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u))
    const user = users.find(u => u.id === id)
    setSelected(prev => prev?.id === id ? { ...prev, status } : prev)
    const labels = { active: 'アクティブに変更', suspended: '停止しました', banned: 'BANしました' }
    const types = { active: 'success', suspended: 'warning', banned: 'error' }
    showToast(`@${user.username} を${labels[status]}`, types[status])
  }

  const filtered = users.filter(u => {
    const matchSearch = u.username.includes(search) || u.email.includes(search) || u.name.includes(search)
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchStatus = statusFilter === 'all' || u.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  return (
    <div style={styles.container}>
      {toast && (
        <div style={{
          ...styles.toast,
          ...(toast.type === 'warning' ? styles.toastWarning : {}),
          ...(toast.type === 'error' ? styles.toastError : {}),
        }}>
          {toast.type === 'error' ? '⛔ ' : toast.type === 'warning' ? '⚠ ' : '✓ '}{toast.msg}
        </div>
      )}

      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>ユーザー管理</h1>
        <div style={styles.headerStats}>
          <span style={styles.headerStat}>総数 <b>{users.length}</b></span>
          <span style={styles.headerStat}>販売者 <b>{users.filter(u => u.role === 'seller').length}</b></span>
          <span style={{ ...styles.headerStat, color: '#f87171' }}>
            BAN <b>{users.filter(u => u.status === 'banned').length}</b>
          </span>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>⌕</span>
          <input
            type="text"
            placeholder="ユーザー名・メールで検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filterButtons}>
          {[['all', 'すべて'], ['seller', '販売者'], ['buyer', '購入者']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setRoleFilter(val)}
              style={{ ...styles.filterBtn, ...(roleFilter === val ? styles.filterBtnActive : {}) }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={styles.filterButtons}>
          {[['all', 'ステータス'], ['active', 'アクティブ'], ['suspended', '停止'], ['banned', 'BAN']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              style={{ ...styles.filterBtn, ...(statusFilter === val ? styles.filterBtnActive : {}) }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.layout}>
        {/* Table */}
        <div style={styles.tablePanel}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['ユーザー', 'ロール', '販売/購入', 'ステータス', '登録日'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const st = STATUS_STYLES[user.status]
                const isSelected = selected?.id === user.id
                return (
                  <tr
                    key={user.id}
                    onClick={() => setSelected(user)}
                    style={{ ...styles.tr, ...(isSelected ? styles.trActive : {}) }}
                  >
                    <td style={styles.td}>
                      <div style={styles.userCell}>
                        <div style={styles.userAvatar}>{user.name[0]}</div>
                        <div>
                          <div style={styles.userName}>
                            {user.name}
                            {user.verified && <span style={styles.verifiedBadge}>✓</span>}
                          </div>
                          <div style={styles.userEmail}>@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.roleBadge, ...(user.role === 'seller' ? styles.roleSeller : styles.roleBuyer) }}>
                        {user.role === 'seller' ? '販売者' : '購入者'}
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: '#64748b', fontSize: 12 }}>
                      {user.sales} / {user.purchases}
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.statusBadge, color: st.color, backgroundColor: st.bg, borderColor: st.border }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: '#475569', fontSize: 11 }}>{user.joinedAt}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={styles.emptyTable}>該当するユーザーが見つかりませんでした</div>
          )}
        </div>

        {/* Detail */}
        {selected && (
          <div style={styles.userDetail}>
            <div style={styles.detailAvatarSection}>
              <div style={styles.detailAvatar}>{selected.name[0]}</div>
              <div>
                <div style={styles.detailName}>
                  {selected.name}
                  {selected.verified && <span style={styles.verifiedLarge}>✓ 認証済み</span>}
                </div>
                <div style={styles.detailUsername}>@{selected.username}</div>
              </div>
            </div>

            <div style={styles.detailGrid}>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>メール</div>
                <div style={styles.detailValue}>{selected.email}</div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>ロール</div>
                <div style={styles.detailValue}>{selected.role === 'seller' ? '販売者' : '購入者'}</div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>登録日</div>
                <div style={styles.detailValue}>{selected.joinedAt}</div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>販売数</div>
                <div style={{ ...styles.detailValue, color: '#22d3ee' }}>{selected.sales}件</div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>購入数</div>
                <div style={{ ...styles.detailValue, color: '#a78bfa' }}>{selected.purchases}件</div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>ステータス</div>
                <div style={{ ...styles.detailValue, color: STATUS_STYLES[selected.status].color }}>
                  {STATUS_STYLES[selected.status].label}
                </div>
              </div>
            </div>

            <div style={styles.actionSection}>
              <div style={styles.actionLabel}>ステータス変更</div>
              <div style={styles.actionRow}>
                <button
                  onClick={() => updateStatus(selected.id, 'active')}
                  disabled={selected.status === 'active'}
                  style={{ ...styles.actionBtn, ...styles.actionBtnGreen, ...(selected.status === 'active' ? styles.actionBtnDisabled : {}) }}
                >
                  アクティブ
                </button>
                <button
                  onClick={() => updateStatus(selected.id, 'suspended')}
                  disabled={selected.status === 'suspended'}
                  style={{ ...styles.actionBtn, ...styles.actionBtnOrange, ...(selected.status === 'suspended' ? styles.actionBtnDisabled : {}) }}
                >
                  停止
                </button>
                <button
                  onClick={() => updateStatus(selected.id, 'banned')}
                  disabled={selected.status === 'banned'}
                  style={{ ...styles.actionBtn, ...styles.actionBtnRed, ...(selected.status === 'banned' ? styles.actionBtnDisabled : {}) }}
                >
                  BAN
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '32px 32px 60px',
    position: 'relative',
  },
  toast: {
    position: 'fixed',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(52,211,153,0.15)',
    color: '#34d399',
    border: '1px solid rgba(52,211,153,0.3)',
    padding: '12px 20px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    zIndex: 500,
    backdropFilter: 'blur(8px)',
  },
  toastWarning: {
    backgroundColor: 'rgba(251,146,60,0.15)',
    color: '#fb923c',
    borderColor: 'rgba(251,146,60,0.3)',
  },
  toastError: {
    backgroundColor: 'rgba(248,113,113,0.15)',
    color: '#f87171',
    borderColor: 'rgba(248,113,113,0.3)',
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: '#f1f5f9',
    letterSpacing: '-0.5px',
  },
  headerStats: {
    display: 'flex',
    gap: 16,
  },
  headerStat: {
    fontSize: 13,
    color: '#64748b',
  },
  filters: {
    display: 'flex',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchWrapper: {
    position: 'relative',
    flex: 1,
    minWidth: 200,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#475569',
    fontSize: 16,
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '9px 12px 9px 34px',
    borderRadius: 8,
    border: '1px solid rgba(139,92,246,0.15)',
    backgroundColor: '#0e0e20',
    color: '#e2e8f0',
    fontSize: 13,
    outline: 'none',
  },
  filterButtons: {
    display: 'flex',
    gap: 4,
  },
  filterBtn: {
    padding: '7px 12px',
    borderRadius: 7,
    border: '1px solid rgba(139,92,246,0.12)',
    backgroundColor: 'transparent',
    color: '#64748b',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  filterBtnActive: {
    borderColor: 'rgba(139,92,246,0.5)',
    backgroundColor: 'rgba(139,92,246,0.1)',
    color: '#a78bfa',
    fontWeight: 700,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: selected => selected ? '1fr 280px' : '1fr',
    gap: 16,
    alignItems: 'start',
  },
  tablePanel: {
    backgroundColor: '#0e0e20',
    borderRadius: 14,
    border: '1px solid rgba(139,92,246,0.1)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 700,
    color: '#475569',
    letterSpacing: '0.05em',
    borderBottom: '1px solid rgba(139,92,246,0.08)',
    backgroundColor: 'rgba(139,92,246,0.03)',
  },
  tr: {
    cursor: 'pointer',
    transition: 'background 0.12s',
    borderBottom: '1px solid rgba(139,92,246,0.05)',
  },
  trActive: {
    backgroundColor: 'rgba(139,92,246,0.08)',
  },
  td: {
    padding: '11px 14px',
    fontSize: 13,
    color: '#94a3b8',
    verticalAlign: 'middle',
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed, #0891b2)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
  },
  userName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  userEmail: {
    fontSize: 11,
    color: '#475569',
  },
  verifiedBadge: {
    fontSize: 9,
    color: '#22d3ee',
    backgroundColor: 'rgba(34,211,238,0.1)',
    border: '1px solid rgba(34,211,238,0.2)',
    padding: '1px 5px',
    borderRadius: 4,
    fontWeight: 700,
  },
  roleBadge: {
    fontSize: 11,
    padding: '3px 8px',
    borderRadius: 5,
    fontWeight: 600,
  },
  roleSeller: {
    color: '#a78bfa',
    backgroundColor: 'rgba(139,92,246,0.1)',
    border: '1px solid rgba(139,92,246,0.2)',
  },
  roleBuyer: {
    color: '#64748b',
    backgroundColor: 'rgba(100,116,139,0.08)',
    border: '1px solid rgba(100,116,139,0.15)',
  },
  statusBadge: {
    fontSize: 11,
    padding: '3px 9px',
    borderRadius: 5,
    fontWeight: 700,
    border: '1px solid',
  },
  emptyTable: {
    padding: '40px',
    textAlign: 'center',
    color: '#334155',
    fontSize: 13,
  },
  userDetail: {
    backgroundColor: '#0e0e20',
    borderRadius: 14,
    border: '1px solid rgba(139,92,246,0.1)',
    padding: '20px',
    position: 'sticky',
    top: 20,
  },
  detailAvatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: '1px solid rgba(139,92,246,0.08)',
  },
  detailAvatar: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed, #0891b2)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 700,
    flexShrink: 0,
    boxShadow: '0 0 14px rgba(124,58,237,0.3)',
  },
  detailName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  verifiedLarge: {
    fontSize: 10,
    color: '#22d3ee',
    backgroundColor: 'rgba(34,211,238,0.1)',
    border: '1px solid rgba(34,211,238,0.2)',
    padding: '2px 7px',
    borderRadius: 4,
    fontWeight: 700,
  },
  detailUsername: {
    fontSize: 12,
    color: '#475569',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 20,
  },
  detailItem: {
    padding: '10px 12px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.04)',
  },
  detailLabel: {
    fontSize: 10,
    color: '#475569',
    fontWeight: 600,
    letterSpacing: '0.05em',
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: 600,
    color: '#94a3b8',
  },
  actionSection: {
    borderTop: '1px solid rgba(139,92,246,0.08)',
    paddingTop: 16,
  },
  actionLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: 700,
    letterSpacing: '0.05em',
    marginBottom: 10,
  },
  actionRow: {
    display: 'flex',
    gap: 6,
  },
  actionBtn: {
    flex: 1,
    padding: '9px 6px',
    borderRadius: 7,
    border: '1px solid',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  actionBtnGreen: {
    backgroundColor: 'rgba(52,211,153,0.1)',
    color: '#34d399',
    borderColor: 'rgba(52,211,153,0.25)',
  },
  actionBtnOrange: {
    backgroundColor: 'rgba(251,146,60,0.1)',
    color: '#fb923c',
    borderColor: 'rgba(251,146,60,0.25)',
  },
  actionBtnRed: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    color: '#f87171',
    borderColor: 'rgba(248,113,113,0.25)',
  },
  actionBtnDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
}
