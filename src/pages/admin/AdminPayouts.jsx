import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'

export default function AdminPayouts() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [marking, setMarking] = useState(null)
  const [toast, setToast] = useState(null)

  // 手数料率設定
  const [feeRate, setFeeRate] = useState('')
  const [feeRateInput, setFeeRateInput] = useState('')
  const [savingFee, setSavingFee] = useState(false)
  const [editingFee, setEditingFee] = useState(false)

  useEffect(() => {
    fetchPayouts()
    fetchFeeRate()
  }, [filter])

  async function fetchFeeRate() {
    const { data } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'fee_rate')
      .single()
    if (data) {
      setFeeRate(data.value)
      setFeeRateInput(data.value)
    }
  }

  async function saveFeeRate() {
    const val = parseFloat(feeRateInput)
    if (isNaN(val) || val < 0 || val > 100) {
      showToast('0〜100の数値を入力してください', 'error')
      return
    }
    setSavingFee(true)
    const { error } = await supabase
      .from('platform_settings')
      .update({ value: String(val), updated_at: new Date().toISOString() })
      .eq('key', 'fee_rate')
    setSavingFee(false)
    if (error) { showToast('保存に失敗しました', 'error'); return }
    setFeeRate(String(val))
    setEditingFee(false)
    showToast(`手数料率を${val}%に変更しました`)
  }

  async function fetchPayouts() {
    setLoading(true)
    let query = supabase
      .from('transactions')
      .select(`
        id, amount, platform_fee_rate, platform_fee, seller_payout,
        created_at, status, payout_status,
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

  const totalPayout = rows.reduce((s, r) => s + (r.seller_payout ?? r.amount ?? 0), 0)
  const totalFee = rows.reduce((s, r) => s + (r.platform_fee ?? 0), 0)

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
      </div>

      {/* 手数料率設定カード */}
      <div style={s.feeCard}>
        <div style={s.feeCardLeft}>
          <span style={s.feeIcon}>⚙</span>
          <div>
            <div style={s.feeTitle}>プラットフォーム手数料率</div>
            <div style={s.feeSub}>決済時に自動計算されます。変更は次の決済から適用されます。</div>
          </div>
        </div>
        <div style={s.feeCardRight}>
          {editingFee ? (
            <div style={s.feeEditRow}>
              <input
                type="number"
                value={feeRateInput}
                onChange={e => setFeeRateInput(e.target.value)}
                min="0" max="100" step="0.5"
                style={s.feeInput}
              />
              <span style={s.feePct}>%</span>
              <button onClick={saveFeeRate} disabled={savingFee} style={s.feeSaveBtn}>
                {savingFee ? '保存中...' : '保存'}
              </button>
              <button onClick={() => { setEditingFee(false); setFeeRateInput(feeRate) }} style={s.feeCancelBtn}>
                キャンセル
              </button>
            </div>
          ) : (
            <div style={s.feeDisplayRow}>
              <span style={s.feeValue}>{feeRate}%</span>
              <button onClick={() => setEditingFee(true)} style={s.feeEditBtn}>変更</button>
            </div>
          )}
        </div>
      </div>

      {/* 集計バッジ */}
      {filter === 'pending' && rows.length > 0 && (
        <div style={s.summaryRow}>
          <div style={s.summaryBadge}>
            振込待ち合計（販売者受取）：<strong>¥{totalPayout.toLocaleString()}</strong>（{rows.length}件）
          </div>
          <div style={s.summaryBadgeFee}>
            うちプラットフォーム収益：<strong>¥{totalFee.toLocaleString()}</strong>
          </div>
        </div>
      )}

      <div style={s.tabs}>
        <button onClick={() => setFilter('pending')} style={{ ...s.tab, ...(filter === 'pending' ? s.tabActive : {}) }}>
          振込待ち
        </button>
        <button onClick={() => setFilter('paid')} style={{ ...s.tab, ...(filter === 'paid' ? s.tabActive : {}) }}>
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
            const payout = row.seller_payout ?? row.amount ?? 0
            const fee = row.platform_fee ?? 0
            const rate = row.platform_fee_rate ?? feeRate ?? 5
            return (
              <div key={row.id} style={s.card}>
                <div style={s.cardTop}>
                  <div style={s.productInfo}>
                    <div style={s.productTitle}>{row.product_title || '（商品名なし）'}</div>
                    <div style={s.meta}>
                      購入者: {row.buyer?.username || '不明'} ／ {new Date(row.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                  <div style={s.amountCol}>
                    <div style={s.payoutAmount}>¥{payout.toLocaleString()}</div>
                    <div style={s.feeDetail}>
                      販売額 ¥{(row.amount || 0).toLocaleString()} − 手数料{rate}% (¥{fee.toLocaleString()})
                    </div>
                  </div>
                </div>

                <div style={s.cardBottom}>
                  <div style={s.sellerInfo}>
                    <div style={s.sellerAvatar}>{(bank?.username || '?')[0].toUpperCase()}</div>
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
  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: 800, color: '#101B3E', letterSpacing: '-0.5px', fontFamily: "'Sora', sans-serif", marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#5A6180' },
  feeCard: { background: '#fff', border: '1px solid #D8DCE9', borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 16 },
  feeCardLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  feeIcon: { fontSize: 20, color: '#5A6180' },
  feeTitle: { fontSize: 14, fontWeight: 700, color: '#101B3E', marginBottom: 3 },
  feeSub: { fontSize: 11, color: '#8A90A8' },
  feeCardRight: {},
  feeDisplayRow: { display: 'flex', alignItems: 'center', gap: 12 },
  feeValue: { fontSize: 28, fontWeight: 800, color: '#2438A6' },
  feeEditBtn: { padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#2438A6', background: 'rgba(36,56,166,0.07)', border: '1px solid rgba(36,56,166,0.2)', cursor: 'pointer' },
  feeEditRow: { display: 'flex', alignItems: 'center', gap: 8 },
  feeInput: { width: 70, padding: '8px 10px', borderRadius: 8, border: '1px solid #D8DCE9', fontSize: 18, fontWeight: 700, color: '#101B3E', textAlign: 'center', outline: 'none' },
  feePct: { fontSize: 18, fontWeight: 700, color: '#5A6180' },
  feeSaveBtn: { padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#fff', background: '#2438A6', border: 'none', cursor: 'pointer' },
  feeCancelBtn: { padding: '8px 12px', borderRadius: 8, fontSize: 13, color: '#5A6180', background: 'transparent', border: '1px solid #D8DCE9', cursor: 'pointer' },
  summaryRow: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 },
  summaryBadge: { background: 'rgba(232,84,47,0.08)', border: '1px solid rgba(232,84,47,0.25)', color: '#E8542F', fontSize: 13, padding: '10px 16px', borderRadius: 10, fontWeight: 500 },
  summaryBadgeFee: { background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', color: '#16a34a', fontSize: 13, padding: '10px 16px', borderRadius: 10, fontWeight: 500 },
  tabs: { display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #D8DCE9' },
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
  amountCol: { textAlign: 'right', flexShrink: 0 },
  payoutAmount: { fontSize: 20, fontWeight: 800, color: '#2438A6' },
  feeDetail: { fontSize: 11, color: '#8A90A8', marginTop: 2 },
  cardBottom: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 20px', flexWrap: 'wrap' },
  sellerInfo: { display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  sellerAvatar: { width: 32, height: 32, borderRadius: '50%', background: '#2438A6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  sellerName: { fontSize: 12, fontWeight: 700, color: '#5A6180', marginBottom: 3 },
  bankInfo: { fontSize: 11, color: '#5A6180', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  noBankInfo: { fontSize: 11, color: '#d97706', fontWeight: 600 },
  paidBtn: { padding: '9px 18px', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#fff', background: '#2438A6', border: 'none', flexShrink: 0 },
  paidBadge: { padding: '6px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#16a34a', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', flexShrink: 0 },
}
