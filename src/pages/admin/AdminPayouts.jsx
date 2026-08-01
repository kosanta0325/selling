import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'

export default function AdminPayouts() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [marking, setMarking] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchPayouts() }, [filter])

  async function fetchPayouts() {
    setLoading(true)
    let query = supabase
      .from('transactions')
      .select(`
        id, amount, created_at, status, payout_status,
        product_title,
        seller:profiles!seller_id(id, username, bank_name, bank_branch, account_type, account_number, account_holder),
        buyer:profiles!buyer_id(username)
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (filter === 'pending') {
      query = query.or('payout_status.is.null,payout_status.eq.pending')
    } else {
      query = query.eq('payout_status', 'paid')
    }

    const { data, error } = await query
    if (!error) setRows(data || [])
    setLoading(false)
  }

  async function markAsPaid(txId) {
    setMarking(txId)
    const { error } = await supabase
      .from('transactions')
      .update({ payout_status: 'paid', payout_at: new Date().toISOString() })
      .eq('id', txId)

    if (error) {
      showToast('更新に失敗しました', 'error')
    } else {
      showToast('振込済みにしました')
      setRows(prev => prev.filter(r => r.id !== txId))
    }
    setMarking(null)
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const totalPending = rows.reduce((s, r) => s + (r.amount || 0), 0)

  return (
    <div style={s.container}>
      {toast && (
        <div style={{ ...s.toast, ...(toast.type === 'error' ? s.toastError : {}) }}>
          {toast.type === 'error' ? '⛔ ' : '✓ '}{toast.msg}
        </div>
      )}

      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>振込管理</h1>
          <p style={s.pageSubtitle}>取引完了後に販売者へ送金する一覧です</p>
        </div>
        {filter === 'pending' && rows.length > 0 && (
          <div style={s.totalBadge}>
            未振込合計：<strong>¥{totalPending.toLocaleString()}</strong>（{rows.length}件）
          </div>
        )}
      </div>

      <div style={s.tabs}>
        <button
          onClick={() => setFilter('pending')}
          style={{ ...s.tab, ...(filter === 'pending' ? s.tabActive : {}) }}
        >
          振込待ち
        </button>
        <button
          onClick={() => setFilter('paid')}
          style={{ ...s.tab, ...(filter === 'paid' ? s.tabActive : {}) }}
        >
          振込済み
        </button>
      </div>

      {loading ? (
        <div style={s.empty}>読み込み中...</div>
      ) : rows.length === 0 ? (
        <div style={s.emptyCard}>
          <div style={s.emptyIcon}>{filter === 'pending' ? '✅' : '📋'}</div>
          <p style={s.emptyText}>
            {filter === 'pending' ? '振込待ちの取引はありません' : '振込済みの取引はありません'}
          </p>
        </div>
      ) : (
        <div style={s.list}>
          {rows.map(row => {
            const bank = row.seller
            const hasBankInfo = bank?.bank_name && bank?.account_number
            return (
              <div key={row.id} style={s.card}>
                {/* 上段: 取引情報 */}
                <div style={s.cardTop}>
                  <div style={s.productInfo}>
                    <div style={s.productTitle}>{row.product_title || '（商品名なし）'}</div>
                    <div style={s.meta}>
                      購入者: {row.buyer?.username || '不明'} ／ 取引完了: {new Date(row.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                  <div style={s.amount}>¥{(row.amount || 0).toLocaleString()}</div>
                </div>

                {/* 下段: 販売者・口座情報 */}
                <div style={s.cardBottom}>
                  <div style={s.sellerInfo}>
                    <div style={s.sellerAvatar}>
                      {(bank?.username || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={s.sellerName}>{bank?.username || '不明'}</div>
                      {hasBankInfo ? (
                        <div style={s.bankInfo}>
                          🏦 {bank.bank_name} {bank.bank_branch}支店 ／ {bank.account_type} ／ {bank.account_number} ／ {bank.account_holder}
                        </div>
                      ) : (
                        <div style={s.noBankInfo}>⚠ 口座情報未登録</div>
                      )}
                    </div>
                  </div>

                  {filter === 'pending' ? (
                    <button
                      onClick={() => markAsPaid(row.id)}
                      disabled={marking === row.id || !hasBankInfo}
                      title={!hasBankInfo ? '口座情報が未登録のため振込できません' : ''}
                      style={{
                        ...s.paidBtn,
                        opacity: (marking === row.id || !hasBankInfo) ? 0.5 : 1,
                        cursor: !hasBankInfo ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {marking === row.id ? '更新中...' : '✓ 振込済みにする'}
                    </button>
                  ) : (
                    <div style={s.paidBadge}>振込済み</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const s = {
  container: { padding: '32px 32px 60px', maxWidth: 900 },
  toast: { position: 'fixed', top: 24, right: 24, zIndex: 999, padding: '12px 20px', borderRadius: 10, background: 'rgba(36,56,166,0.08)', border: '1px solid rgba(36,56,166,0.25)', color: '#2438A6', fontSize: 13, fontWeight: 600 },
  toastError: { background: 'rgba(232,84,47,0.08)', border: '1px solid rgba(232,84,47,0.25)', color: '#E8542F' },
  pageHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: 800, color: '#101B3E', letterSpacing: '-0.5px', fontFamily: "'Sora', sans-serif", marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#5A6180' },
  totalBadge: { background: 'rgba(232,84,47,0.08)', border: '1px solid rgba(232,84,47,0.25)', color: '#E8542F', fontSize: 13, padding: '10px 16px', borderRadius: 10, fontWeight: 500 },
  tabs: { display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #D8DCE9', paddingBottom: 0 },
  tab: { padding: '8px 20px', fontSize: 13, fontWeight: 500, color: '#5A6180', background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', marginBottom: -1 },
  tabActive: { color: '#2438A6', fontWeight: 700, borderBottomColor: '#2438A6' },
  empty: { padding: 40, color: '#8A90A8', fontSize: 13 },
  emptyCard: { background: '#fff', border: '1px solid #D8DCE9', borderRadius: 14, padding: '48px 24px', textAlign: 'center' },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyText: { fontSize: 13, color: '#8A90A8' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: '#fff', border: '1px solid #D8DCE9', borderRadius: 14, overflow: 'hidden' },
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px', borderBottom: '1px solid #F0F2F8' },
  productInfo: { flex: 1, minWidth: 0 },
  productTitle: { fontSize: 14, fontWeight: 700, color: '#101B3E', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  meta: { fontSize: 11, color: '#8A90A8' },
  amount: { fontSize: 20, fontWeight: 800, color: '#2438A6', flexShrink: 0 },
  cardBottom: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 20px', flexWrap: 'wrap' },
  sellerInfo: { display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  sellerAvatar: { width: 32, height: 32, borderRadius: '50%', background: '#2438A6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  sellerName: { fontSize: 12, fontWeight: 700, color: '#5A6180', marginBottom: 3 },
  bankInfo: { fontSize: 11, color: '#5A6180', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  noBankInfo: { fontSize: 11, color: '#d97706', fontWeight: 600 },
  paidBtn: { padding: '9px 18px', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#fff', background: '#2438A6', border: 'none', flexShrink: 0 },
  paidBadge: { padding: '6px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#16a34a', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', flexShrink: 0 },
}
