import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'

const STATUS_STYLES = {
  active:    { color: '#16a34a', bg: 'rgba(22,163,74,0.08)',   border: 'rgba(22,163,74,0.22)',   label: 'アクティブ' },
  suspended: { color: '#d97706', bg: 'rgba(217,119,6,0.08)',  border: 'rgba(217,119,6,0.22)',  label: '停止中' },
  banned:    { color: '#E8542F', bg: 'rgba(232,84,47,0.08)',  border: 'rgba(232,84,47,0.22)',  label: 'BAN' },
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function updateStatus(id, status) {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', id)
    if (error) { showToast('更新に失敗しました', 'error'); return }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u))
    setSelected(prev => prev?.id === id ? { ...prev, status } : prev)
    const labels = { active: 'アクティブに変更', suspended: '停止しました', banned: 'BANしました' }
    const types  = { active: 'success', suspended: 'warning', banned: 'error' }
    const u = users.find(u => u.id === id)
    showToast(`@${u?.username} を${labels[status]}`, types[status])
  }

  async function updateRole(id, role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (error) { showToast('更新に失敗しました', 'error'); return }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
    setSelected(prev => prev?.id === id ? { ...prev, role } : prev)
    showToast(`ロールを "${role}" に変更しました`)
  }

  const filtered = users.filter(u => {
    const matchSearch = (u.username || '').includes(search) || (u.email || '').includes(search)
    const matchRole   = roleFilter === 'all' || u.role === roleFilter
    const matchStatus = statusFilter === 'all' || (u.status || 'active') === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  const st = selected ? (STATUS_STYLES[selected.status || 'active']) : null

  return (
    <div style={s.container}>
      {toast && (
        <div style={{ ...s.toast, ...(toast.type === 'warning' ? s.toastWarn : toast.type === 'error' ? s.toastError : {}) }}>
          {toast.type === 'error' ? '⛔ ' : toast.type === 'warning' ? '⚠ ' : '✓ '}{toast.msg}
        </div>
      )}

      <div style={s.pageHeader}>
        <h1 style={s.pageTitle}>ユーザー管理</h1>
        <div style={s.headerStats}>
          <span style={s.stat}>総数 <b>{users.length}</b></span>
          <span style={s.stat}>管理者 <b>{users.filter(u => u.role === 'admin').length}</b></span>
          <span style={{ ...s.stat, color: '#E8542F' }}>停止/BAN <b>{users.filter(u => u.status === 'suspended' || u.status === 'banned').length}</b></span>
        </div>
      </div>

      <div style={s.layout}>
        {/* 左：一覧 */}
        <div style={s.listPanel}>
          <div style={s.filters}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ユーザー名 / メールで検索" style={s.searchInput} />
            <div style={s.filterRow}>
              {['all','user','admin'].map(r => (
                <button key={r} onClick={() => setRoleFilter(r)} style={{ ...s.filterBtn, ...(roleFilter === r ? s.filterBtnActive : {}) }}>
                  {r === 'all' ? '全員' : r === 'admin' ? '管理者' : '一般'}
                </button>
              ))}
              <div style={s.filterSep} />
              {['all','active','suspended','banned'].map(st => (
                <button key={st} onClick={() => setStatusFilter(st)} style={{ ...s.filterBtn, ...(statusFilter === st ? s.filterBtnActive : {}) }}>
                  {st === 'all' ? '全状態' : STATUS_STYLES[st]?.label || st}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={s.emptyState}>読み込み中...</div>
          ) : filtered.length === 0 ? (
            <div style={s.emptyState}>該当ユーザーなし</div>
          ) : (
            <div style={s.list}>
              {filtered.map(u => {
                const uSt = STATUS_STYLES[u.status || 'active']
                return (
                  <div key={u.id} onClick={() => setSelected(u)} style={{ ...s.userRow, ...(selected?.id === u.id ? s.userRowActive : {}) }}>
                    <div style={s.avatar}>{(u.username || '?')[0].toUpperCase()}</div>
                    <div style={s.userInfo}>
                      <div style={s.username}>@{u.username}</div>
                      <div style={s.userMeta}>
                        <span style={{ ...s.rolePill, color: u.role === 'admin' ? '#2438A6' : '#5A6180', background: u.role === 'admin' ? 'rgba(36,56,166,0.08)' : 'rgba(90,97,128,0.07)' }}>
                          {u.role === 'admin' ? '管理者' : '一般'}
                        </span>
                      </div>
                    </div>
                    <span style={{ ...s.statusPill, color: uSt.color, background: uSt.bg, borderColor: uSt.border }}>
                      {uSt.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 右：詳細 */}
        {selected ? (
          <div style={s.detail}>
            <div style={s.detailHeader}>
              <div style={s.detailAvatar}>{(selected.username || '?')[0].toUpperCase()}</div>
              <div>
                <div style={s.detailName}>@{selected.username}</div>
                <span style={{ ...s.statusPill, color: st.color, background: st.bg, borderColor: st.border }}>{st.label}</span>
              </div>
            </div>

            <div style={s.detailBody}>
              <div style={s.detailRow}><span style={s.detailLabel}>ロール</span><span style={s.detailVal}>{selected.role === 'admin' ? '管理者' : '一般ユーザー'}</span></div>
              <div style={s.detailRow}><span style={s.detailLabel}>登録日</span><span style={s.detailVal}>{selected.created_at ? new Date(selected.created_at).toLocaleDateString('ja-JP') : '—'}</span></div>
            </div>

            <div style={s.actionSection}>
              <div style={s.actionTitle}>ステータス変更</div>
              <div style={s.actionRow}>
                <button onClick={() => updateStatus(selected.id, 'active')}    disabled={selected.status === 'active' || !selected.status}    style={{ ...s.actionBtn, ...s.actionBtnGreen }}>アクティブ</button>
                <button onClick={() => updateStatus(selected.id, 'suspended')} disabled={selected.status === 'suspended'} style={{ ...s.actionBtn, ...s.actionBtnOrange }}>停止</button>
                <button onClick={() => updateStatus(selected.id, 'banned')}    disabled={selected.status === 'banned'}    style={{ ...s.actionBtn, ...s.actionBtnRed }}>BAN</button>
              </div>
            </div>

            <div style={s.actionSection}>
              <div style={s.actionTitle}>ロール変更</div>
              <div style={s.actionRow}>
                <button onClick={() => updateRole(selected.id, 'user')}  disabled={selected.role === 'user'}  style={{ ...s.actionBtn, ...s.actionBtnGray }}>一般ユーザー</button>
                <button onClick={() => updateRole(selected.id, 'admin')} disabled={selected.role === 'admin'} style={{ ...s.actionBtn, ...s.actionBtnPurple }}>管理者に昇格</button>
              </div>
            </div>
          </div>
        ) : (
          <div style={s.detailEmpty}>
            <div style={s.emptyIcon}>◎</div>
            <p>ユーザーを選択してください</p>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  container: { padding: '32px 36px', maxWidth: 1100, margin: '0 auto' },
  toast: { position: 'fixed', top: 24, right: 24, zIndex: 999, padding: '12px 20px', borderRadius: 10, background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)', color: '#16a34a', fontSize: 13, fontWeight: 600 },
  toastWarn: { background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.25)', color: '#d97706' },
  toastError: { background: 'rgba(232,84,47,0.1)', border: '1px solid rgba(232,84,47,0.25)', color: '#E8542F' },
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  pageTitle: { fontSize: 24, fontWeight: 800, color: '#101B3E', fontFamily: "'Sora', sans-serif" },
  headerStats: { display: 'flex', gap: 16 },
  stat: { fontSize: 13, color: '#5A6180' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' },
  listPanel: { background: '#fff', border: '1px solid #D8DCE9', borderRadius: 16, overflow: 'hidden' },
  filters: { padding: '16px', borderBottom: '1px solid #F6F7F4', display: 'flex', flexDirection: 'column', gap: 10 },
  searchInput: { width: '100%', padding: '9px 12px', background: '#F6F7F4', border: '1px solid #D8DCE9', borderRadius: 8, fontSize: 13, color: '#101B3E', outline: 'none', boxSizing: 'border-box' },
  filterRow: { display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  filterBtn: { padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid #D8DCE9', background: 'transparent', color: '#5A6180', cursor: 'pointer' },
  filterBtnActive: { background: 'rgba(36,56,166,0.08)', border: '1px solid rgba(36,56,166,0.25)', color: '#2438A6' },
  filterSep: { width: 1, height: 16, background: '#D8DCE9', margin: '0 2px' },
  list: { maxHeight: 520, overflowY: 'auto' },
  emptyState: { padding: '40px', textAlign: 'center', color: '#8A90A8', fontSize: 13 },
  userRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #F6F7F4', cursor: 'pointer', transition: 'background 0.15s' },
  userRowActive: { background: 'rgba(36,56,166,0.05)' },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: '#2438A6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 },
  userInfo: { flex: 1, minWidth: 0 },
  username: { fontSize: 13, fontWeight: 600, color: '#101B3E' },
  userMeta: { display: 'flex', gap: 6, marginTop: 2 },
  rolePill: { fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4 },
  statusPill: { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: '1px solid', flexShrink: 0 },
  detail: { background: '#fff', border: '1px solid #D8DCE9', borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 },
  detailEmpty: { background: '#F6F7F4', border: '1px solid #D8DCE9', borderRadius: 16, padding: '60px 24px', textAlign: 'center', color: '#8A90A8', fontSize: 13 },
  emptyIcon: { fontSize: 32, marginBottom: 12, color: '#D8DCE9' },
  detailHeader: { display: 'flex', alignItems: 'center', gap: 14 },
  detailAvatar: { width: 52, height: 52, borderRadius: '50%', background: '#2438A6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' },
  detailName: { fontSize: 16, fontWeight: 700, color: '#101B3E', marginBottom: 6 },
  detailBody: { display: 'flex', flexDirection: 'column', gap: 8, padding: '12px', background: '#F6F7F4', borderRadius: 10 },
  detailRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13 },
  detailLabel: { color: '#5A6180' },
  detailVal: { color: '#5A6180', fontWeight: 600 },
  actionSection: { display: 'flex', flexDirection: 'column', gap: 8 },
  actionTitle: { fontSize: 11, fontWeight: 700, color: '#5A6180', letterSpacing: '0.05em' },
  actionRow: { display: 'flex', gap: 8 },
  actionBtn: { flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid', transition: 'opacity 0.15s' },
  actionBtnGreen:  { color: '#16a34a', background: 'rgba(22,163,74,0.08)',  borderColor: 'rgba(22,163,74,0.25)' },
  actionBtnOrange: { color: '#d97706', background: 'rgba(217,119,6,0.08)', borderColor: 'rgba(217,119,6,0.25)' },
  actionBtnRed:    { color: '#E8542F', background: 'rgba(232,84,47,0.08)', borderColor: 'rgba(232,84,47,0.25)' },
  actionBtnGray:   { color: '#5A6180', background: 'rgba(90,97,128,0.06)', borderColor: '#D8DCE9' },
  actionBtnPurple: { color: '#2438A6', background: 'rgba(36,56,166,0.08)', borderColor: 'rgba(36,56,166,0.25)' },
}
