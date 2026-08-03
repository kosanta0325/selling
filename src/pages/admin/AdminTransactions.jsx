import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'
import { STATUS_CONFIG, TIMELINE_STEPS } from '../../data/index.js'

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ])
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*, buyer:profiles!buyer_id(username), seller:profiles!seller_id(username)')
      .order('created_at', { ascending: false })
    if (!error && data) setTransactions(data)
    setLoading(false)
  }

  const filtered = transactions.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !t.product_title?.toLowerCase().includes(q) &&
        !t.buyer?.username?.toLowerCase().includes(q) &&
        !t.seller?.username?.toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  const counts = {}
  transactions.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1 })

  return (
    <div style={s.container}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>取引モニタリング</h1>
          <p style={s.pageSubtitle}>全ユーザーの取引状況を一括管理します（読み取り専用）</p>
        </div>
        <div style={s.totalBadge}>全{transactions.length}件</div>
      </div>

      {/* フィルター */}
      <div style={s.filterRow}>
        <input
          type="text"
          placeholder="商品名・購入者・販売者で検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={s.searchInput}
        />
        <div style={s.statusFilters}>
          {[['all', 'すべて'], ...Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              style={{
                ...s.filterBtn,
                ...(statusFilter === key ? s.filterBtnActive : {}),
                ...(key !== 'all' && statusFilter === key ? { color: STATUS_CONFIG[key]?.color, borderColor: STATUS_CONFIG[key]?.color, background: STATUS_CONFIG[key]?.bg } : {}),
              }}
            >
              {label}
              {key !== 'all' && counts[key] ? <span style={s.filterCount}>{counts[key]}</span> : null}
              {key === 'all' && <span style={s.filterCount}>{transactions.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={s.loadingText}>読み込み中...</div>
      ) : (
        <div style={s.layout}>
          {/* 一覧 */}
          <div style={s.listPanel}>
            {filtered.length === 0 ? (
              <div style={s.emptyList}>
                <div style={s.emptyIcon}>◎</div>
                <p>取引が見つかりません</p>
              </div>
            ) : filtered.map(txn => {
              const st = STATUS_CONFIG[txn.status] || STATUS_CONFIG.pending
              const isActive = selected?.id === txn.id
              return (
                <div
                  key={txn.id}
                  onClick={() => setSelected(txn)}
                  style={{ ...s.txnRow, ...(isActive ? s.txnRowActive : {}) }}
                >
                  <img
                    src={txn.product_image || 'https://placehold.co/52x40?text=No+Image'}
                    alt=""
                    style={s.txnThumb}
                    onError={e => { e.target.src = 'https://placehold.co/52x40?text=No+Image' }}
                  />
                  <div style={s.txnInfo}>
                    <div style={s.txnTitle}>{txn.product_title || '（商品名なし）'}</div>
                    <div style={s.txnMeta}>
                      購入: {txn.buyer?.username || '不明'} → 販売: {txn.seller?.username || '不明'}
                    </div>
                    <div style={s.txnDate}>{formatDate(txn.created_at)}</div>
                  </div>
                  <div style={s.txnRight}>
                    <div style={s.txnPrice}>¥{(txn.amount || 0).toLocaleString()}</div>
                    <span style={{ ...s.statusBadge, color: st.color, backgroundColor: st.bg, borderColor: st.border }}>
                      {st.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 詳細 */}
          {selected ? (
            <AdminTxnDetail
              txn={selected}
              onCancel={(id) => {
                setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'cancelled' } : t))
                setSelected(prev => prev?.id === id ? { ...prev, status: 'cancelled' } : prev)
              }}
            />
          ) : (
            <div style={s.detailEmpty}>
              <div style={s.detailEmptyIcon}>◈</div>
              <p>取引を選択してください</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AdminTxnDetail({ txn, onCancel }) {
  const st = STATUS_CONFIG[txn.status] || STATUS_CONFIG.pending
  const step = st.step
  const messages = Array.isArray(txn.messages) ? txn.messages : []
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [toast, setToast] = useState(null)
  const [cancelError, setCancelError] = useState(null)
  const [stage, setStage] = useState(null)

  const canCancel = !['cancelled', 'completed'].includes(txn.status)

  async function handleCancel() {
    setCancelling(true)
    setCancelError(null)
    try {
      setStage('セッション取得中...')
      console.log('[cancel] 1/4 セッション取得中...')
      const { data: { session } } = await withTimeout(
        supabase.auth.getSession(),
        8000,
        'セッション取得がタイムアウトしました。ページを再読み込みしてください。'
      )
      const token = session?.access_token
      if (!token) throw new Error('セッションが見つかりません。再ログインしてください。')

      setStage('API呼び出し中...')
      console.log('[cancel] 2/4 API呼び出し中... txnId =', txn.id)
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 25000)
      let res
      try {
        res = await fetch('/api/admin-cancel-transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ transactionId: txn.id }),
          signal: controller.signal,
        })
      } catch (e) {
        if (e.name === 'AbortError') {
          throw new Error('APIが25秒応答しませんでした。サーバー側の処理が停止しています。')
        }
        throw new Error(`API接続に失敗しました: ${e.message}`)
      } finally {
        clearTimeout(timer)
      }

      setStage(`応答受信 (${res.status})...`)
      console.log('[cancel] 3/4 レスポンス受信 status =', res.status)
      const raw = await res.text()
      let json = {}
      try { json = raw ? JSON.parse(raw) : {} } catch { /* JSON以外 */ }
      console.log('[cancel] 4/4 body =', raw.slice(0, 500))

      if (!res.ok) {
        throw new Error(json.error || `サーバーエラー (${res.status})${raw ? `: ${raw.slice(0, 200)}` : '（応答が空）'}`)
      }

      setCancelModal(false)
      setCancelReason('')
      onCancel(txn.id)
    } catch (err) {
      console.error('[cancel] error:', err)
      setCancelError(err.message || String(err))
      setToast({ msg: err.message, type: 'error' })
      setTimeout(() => setToast(null), 8000)
    } finally {
      setCancelling(false)
      setStage(null)
    }
  }

  return (
    <div style={s.detail}>
      {/* 商品バー */}
      <div style={s.detailProduct}>
        <img
          src={txn.product_image || 'https://placehold.co/68x50?text=No+Image'}
          alt=""
          style={s.detailImg}
          onError={e => { e.target.src = 'https://placehold.co/68x50?text=No+Image' }}
        />
        <div style={s.detailProductInfo}>
          <div style={s.detailProductTitle}>{txn.product_title || '（商品名なし）'}</div>
          <div style={s.detailProductMeta}>
            <span>購入者：<b>{txn.buyer?.username || '不明'}</b></span>
            <span>販売者：<b>{txn.seller?.username || '不明'}</b></span>
          </div>
        </div>
        <div style={s.detailPriceBlock}>
          <div style={s.detailPrice}>¥{(txn.amount || 0).toLocaleString()}</div>
          <span style={{ ...s.statusBadge, color: st.color, backgroundColor: st.bg, borderColor: st.border, fontSize: 11 }}>
            {st.label}
          </span>
        </div>
      </div>

      {/* 手数料情報 */}
      {txn.platform_fee_rate != null && (
        <div style={s.feeRow}>
          <span>手数料 {txn.platform_fee_rate}%：¥{(txn.platform_fee || 0).toLocaleString()}</span>
          <span style={s.feeDivider}>|</span>
          <span>販売者受取：¥{(txn.seller_payout || 0).toLocaleString()}</span>
          <span style={s.feeDivider}>|</span>
          <span style={{ color: txn.payout_status === 'paid' ? '#16a34a' : '#d97706', fontWeight: 700 }}>
            {txn.payout_status === 'paid' ? '振込済み' : '振込待ち'}
          </span>
        </div>
      )}

      {/* タイムライン */}
      <div style={s.timeline}>
        {TIMELINE_STEPS.map((tl, i) => {
          const done = step > i
          const current = step === i + 1
          return (
            <div key={tl.key} style={s.tlItem}>
              <div style={{ ...s.tlDot, ...(done || current ? s.tlDotActive : {}), ...(current ? s.tlDotCurrent : {}) }}>
                {done ? '✓' : tl.icon}
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div style={{ ...s.tlLine, ...(done ? s.tlLineActive : {}) }} />
              )}
              <div style={s.tlLabel}>{tl.label}</div>
            </div>
          )
        })}
      </div>

      {/* メッセージ履歴 */}
      <div style={s.messages}>
        <div style={s.messagesTitle}>取引メッセージ（{messages.length}件）</div>
        {messages.length === 0 ? (
          <div style={s.noMsg}>メッセージはありません</div>
        ) : (
          <div style={s.messagesList}>
            {messages.map((msg, i) => (
              <div key={msg.id || i} style={{ ...s.msgBubble, ...(msg.from === 'seller' ? s.msgBubbleSeller : s.msgBubbleBuyer) }}>
                <div style={s.msgMeta}>
                  <span style={{ ...s.msgFrom, color: msg.from === 'seller' ? '#2438A6' : '#E8542F' }}>
                    {msg.from === 'seller' ? '販売者' : '購入者'}
                  </span>
                  <span style={s.msgTime}>{msg.sentAt}</span>
                </div>
                {msg.type === 'delivery' ? (
                  <div style={s.deliveryCard}>
                    <div style={s.deliveryHeader}>
                      <span>📦</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#2438A6' }}>納品物</span>
                      {msg.fileName && <span style={{ fontSize: 11, color: '#5A6180' }}>{msg.fileName}</span>}
                    </div>
                    <div style={s.msgText}>{msg.content}</div>
                    {msg.deliveryNote && <div style={{ fontSize: 11, color: '#5A6180', borderTop: '1px solid #D8DCE9', paddingTop: 6 }}>{msg.deliveryNote}</div>}
                  </div>
                ) : (
                  <div style={s.msgText}>{msg.content}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* メタ情報 */}
      <div style={s.metaPanel}>
        <div style={s.metaRow}><span style={s.metaLabel}>取引ID</span><span style={s.metaVal}>{txn.id}</span></div>
        <div style={s.metaRow}><span style={s.metaLabel}>購入日時</span><span style={s.metaVal}>{formatDate(txn.created_at)}</span></div>
        {txn.payment_intent_id && <div style={s.metaRow}><span style={s.metaLabel}>Stripe ID</span><span style={s.metaVal}>{txn.payment_intent_id}</span></div>}
      </div>

      {/* 管理者キャンセルボタン */}
      {canCancel && (
        <div style={s.cancelPanel}>
          {toast && (
            <div style={{ ...s.toast, ...(toast.type === 'error' ? s.toastError : {}) }}>
              ⛔ {toast.msg}
            </div>
          )}
          <button onClick={() => setCancelModal(true)} style={s.cancelBtn}>
            ✕ 管理者権限でキャンセルする
          </button>
          <p style={s.cancelNote}>※ キャンセル後は元に戻せません。Stripeの返金は別途手動で行う必要があります。</p>
        </div>
      )}

      {txn.status === 'cancelled' && (
        <div style={s.cancelledBanner}>✕ この取引はキャンセル済みです</div>
      )}

      {/* キャンセル確認モーダル */}
      {cancelModal && (
        <div style={s.overlay} onClick={() => setCancelModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalIcon}>⚠</div>
            <h3 style={s.modalTitle}>取引をキャンセルしますか？</h3>
            <p style={s.modalDesc}>
              <b>{txn.product_title}</b><br />
              購入者：{txn.buyer?.username}　販売者：{txn.seller?.username}<br />
              金額：¥{(txn.amount || 0).toLocaleString()}
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={s.reasonLabel}>キャンセル理由（任意・記録用）</label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="例：規約違反のため、購入者からの申告により..."
                rows={3}
                style={s.reasonInput}
              />
            </div>
            <p style={s.modalWarn}>
              ⚠ Stripeへの返金は自動では行われません。必要な場合はStripeダッシュボードで別途処理してください。
            </p>

            {cancelError && (
              <div style={s.modalError}>
                <div style={s.modalErrorTitle}>⛔ キャンセルに失敗しました</div>
                <div style={s.modalErrorMsg}>{cancelError}</div>
              </div>
            )}

            <div style={s.modalActions}>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{ ...s.modalCancelBtn, opacity: cancelling ? 0.6 : 1, cursor: cancelling ? 'wait' : 'pointer' }}
              >
                {cancelling ? (stage || '処理中...') : 'キャンセルを実行する'}
              </button>
              <button onClick={() => setCancelModal(false)} style={s.modalBackBtn}>
                戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  container: { padding: '32px 32px 60px', maxWidth: 1200 },
  pageHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: 800, color: '#101B3E', letterSpacing: '-0.5px', fontFamily: "'Sora', sans-serif", marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#5A6180' },
  totalBadge: { fontSize: 13, color: '#5A6180', background: '#fff', border: '1px solid #D8DCE9', padding: '6px 14px', borderRadius: 8 },
  filterRow: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 },
  searchInput: { padding: '10px 14px', borderRadius: 9, border: '1px solid #D8DCE9', fontSize: 13, color: '#101B3E', outline: 'none', background: '#fff', width: '100%', maxWidth: 360, boxSizing: 'border-box' },
  statusFilters: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterBtn: { padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500, color: '#5A6180', background: '#fff', border: '1px solid #D8DCE9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 },
  filterBtnActive: { color: '#2438A6', borderColor: '#2438A6', background: 'rgba(36,56,166,0.07)', fontWeight: 700 },
  filterCount: { fontSize: 10, background: 'rgba(36,56,166,0.1)', color: '#2438A6', padding: '1px 5px', borderRadius: 4, fontWeight: 700 },
  loadingText: { padding: 40, color: '#8A90A8', fontSize: 13 },
  layout: { display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, alignItems: 'start' },
  listPanel: { background: '#fff', borderRadius: 14, border: '1px solid #D8DCE9', overflow: 'hidden', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' },
  txnRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid #D8DCE9', cursor: 'pointer', transition: 'background 0.12s' },
  txnRowActive: { background: 'rgba(36,56,166,0.04)', borderLeft: '2px solid #2438A6' },
  txnThumb: { width: 52, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0, background: '#EEEEF0' },
  txnInfo: { flex: 1, minWidth: 0 },
  txnTitle: { fontSize: 12, fontWeight: 600, color: '#101B3E', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  txnMeta: { fontSize: 10, color: '#8A90A8', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  txnDate: { fontSize: 10, color: '#8A90A8' },
  txnRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  txnPrice: { fontSize: 13, fontWeight: 700, color: '#101B3E' },
  statusBadge: { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, border: '1px solid' },
  emptyList: { padding: '48px 20px', textAlign: 'center', color: '#8A90A8', fontSize: 13 },
  emptyIcon: { fontSize: 28, opacity: 0.3, marginBottom: 8 },
  detailEmpty: { background: '#fff', borderRadius: 14, border: '1px solid #D8DCE9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, gap: 10, color: '#8A90A8', fontSize: 13 },
  detailEmptyIcon: { fontSize: 32, opacity: 0.3 },
  detail: { background: '#fff', borderRadius: 14, border: '1px solid #D8DCE9', overflow: 'hidden' },
  detailProduct: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #D8DCE9', background: '#F6F7F4' },
  detailImg: { width: 68, height: 50, borderRadius: 8, objectFit: 'cover', flexShrink: 0 },
  detailProductInfo: { flex: 1, minWidth: 0 },
  detailProductTitle: { fontSize: 14, fontWeight: 700, color: '#101B3E', marginBottom: 4 },
  detailProductMeta: { display: 'flex', gap: 12, fontSize: 11, color: '#8A90A8' },
  detailPriceBlock: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 },
  detailPrice: { fontSize: 18, fontWeight: 800, color: '#101B3E' },
  feeRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', background: 'rgba(36,56,166,0.03)', borderBottom: '1px solid #D8DCE9', fontSize: 11, color: '#5A6180' },
  feeDivider: { color: '#D8DCE9' },
  timeline: { display: 'flex', padding: '20px 24px', alignItems: 'flex-start', borderBottom: '1px solid #D8DCE9', overflowX: 'auto' },
  tlItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flex: 1, minWidth: 80 },
  tlDot: { width: 32, height: 32, borderRadius: '50%', background: '#F6F7F4', border: '2px solid #D8DCE9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#8A90A8', zIndex: 1, marginBottom: 8 },
  tlDotActive: { background: 'rgba(36,56,166,0.08)', borderColor: '#2438A6', color: '#2438A6' },
  tlDotCurrent: { borderColor: '#2438A6', color: '#2438A6', boxShadow: '0 0 0 3px rgba(36,56,166,0.15)' },
  tlLine: { position: 'absolute', top: 16, left: '50%', width: '100%', height: 2, background: '#D8DCE9', zIndex: 0 },
  tlLineActive: { background: '#2438A6' },
  tlLabel: { fontSize: 11, fontWeight: 600, color: '#5A6180', textAlign: 'center' },
  messages: { padding: '16px 20px', maxHeight: 320, overflowY: 'auto' },
  messagesTitle: { fontSize: 11, fontWeight: 700, color: '#8A90A8', letterSpacing: '0.05em', marginBottom: 10 },
  noMsg: { fontSize: 12, color: '#8A90A8', textAlign: 'center', padding: '20px 0' },
  messagesList: { display: 'flex', flexDirection: 'column', gap: 10 },
  msgBubble: { display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '85%' },
  msgBubbleSeller: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  msgBubbleBuyer: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  msgMeta: { display: 'flex', gap: 8, alignItems: 'center' },
  msgFrom: { fontSize: 10, fontWeight: 700 },
  msgTime: { fontSize: 9, color: '#8A90A8' },
  msgText: { padding: '10px 14px', borderRadius: 12, background: '#F6F7F4', border: '1px solid #D8DCE9', color: '#101B3E', fontSize: 13, lineHeight: 1.6 },
  deliveryCard: { padding: '12px 14px', borderRadius: 12, background: 'rgba(36,56,166,0.04)', border: '1px solid rgba(36,56,166,0.2)', display: 'flex', flexDirection: 'column', gap: 6 },
  deliveryHeader: { display: 'flex', alignItems: 'center', gap: 6 },
  metaPanel: { padding: '14px 20px', borderTop: '1px solid #D8DCE9', background: '#F6F7F4', display: 'flex', flexDirection: 'column', gap: 6 },
  metaRow: { display: 'flex', gap: 12, fontSize: 11, alignItems: 'flex-start' },
  metaLabel: { color: '#8A90A8', width: 80, flexShrink: 0 },
  metaVal: { color: '#5A6180', wordBreak: 'break-all' },
  cancelPanel: { padding: '16px 20px', borderTop: '1px solid #D8DCE9', display: 'flex', flexDirection: 'column', gap: 8 },
  cancelBtn: { padding: '10px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700, color: '#E8542F', background: 'rgba(232,84,47,0.06)', border: '1px solid rgba(232,84,47,0.3)', cursor: 'pointer', alignSelf: 'flex-start' },
  cancelNote: { fontSize: 11, color: '#8A90A8', margin: 0 },
  cancelledBanner: { padding: '12px 20px', background: 'rgba(248,113,113,0.08)', borderTop: '1px solid rgba(248,113,113,0.2)', fontSize: 13, fontWeight: 700, color: '#f87171', textAlign: 'center' },
  toast: { position: 'fixed', top: 24, right: 24, zIndex: 999, padding: '12px 20px', borderRadius: 10, background: 'rgba(36,56,166,0.08)', border: '1px solid rgba(36,56,166,0.25)', color: '#2438A6', fontSize: 13, fontWeight: 600 },
  toastError: { background: 'rgba(232,84,47,0.08)', border: '1px solid rgba(232,84,47,0.25)', color: '#E8542F' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(16,27,62,0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 20 },
  modal: { background: '#fff', borderRadius: 18, padding: '32px 28px', maxWidth: 420, width: '100%', border: '1px solid #D8DCE9', boxShadow: '0 8px 40px rgba(16,27,62,0.15)' },
  modalIcon: { fontSize: 36, textAlign: 'center', marginBottom: 12, color: '#E8542F' },
  modalTitle: { fontSize: 18, fontWeight: 800, color: '#101B3E', textAlign: 'center', marginBottom: 12, fontFamily: "'Sora', sans-serif" },
  modalDesc: { fontSize: 13, color: '#5A6180', lineHeight: 1.8, marginBottom: 16, padding: '12px 14px', background: '#F6F7F4', borderRadius: 10 },
  reasonLabel: { fontSize: 12, fontWeight: 600, color: '#5A6180', display: 'block', marginBottom: 6 },
  reasonInput: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #D8DCE9', fontSize: 13, color: '#101B3E', outline: 'none', resize: 'none', lineHeight: 1.6, boxSizing: 'border-box', fontFamily: 'inherit' },
  modalWarn: { fontSize: 11, color: '#d97706', background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 8, padding: '9px 12px', lineHeight: 1.6, marginBottom: 16 },
  modalError: { background: 'rgba(232,84,47,0.07)', border: '1px solid rgba(232,84,47,0.3)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 },
  modalErrorTitle: { fontSize: 12, fontWeight: 700, color: '#E8542F', marginBottom: 6 },
  modalErrorMsg: { fontSize: 12, color: '#101B3E', lineHeight: 1.7, wordBreak: 'break-word', fontFamily: 'ui-monospace, monospace' },
  modalActions: { display: 'flex', gap: 10 },
  modalCancelBtn: { flex: 1, padding: '12px', background: '#E8542F', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  modalBackBtn: { padding: '12px 20px', background: '#F6F7F4', color: '#5A6180', border: '1px solid #D8DCE9', borderRadius: 10, fontSize: 14, cursor: 'pointer' },
}
