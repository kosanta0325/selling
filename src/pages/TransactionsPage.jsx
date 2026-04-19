import { useState } from 'react'
import { MOCK_TRANSACTIONS, STATUS_CONFIG, TIMELINE_STEPS } from '../data/transactionData.js'

// デモ用の現在ユーザー（購入者・出品者両方の取引を確認できるよう切り替え可能）
const CURRENT_USER = 'hanako_s'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS)
  const [tab, setTab] = useState('buyer')   // 'buyer' | 'seller'
  const [selected, setSelected] = useState(null)

  const buyerTxns  = transactions.filter(t => t.buyer.username  === CURRENT_USER)
  const sellerTxns = transactions.filter(t => t.seller.username === CURRENT_USER)
  const list = tab === 'buyer' ? buyerTxns : sellerTxns

  const updateTxn = (id, patch) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
    setSelected(prev => prev?.id === id ? { ...prev, ...patch } : prev)
  }

  const addMessage = (id, msg) => {
    setTransactions(prev => prev.map(t =>
      t.id === id ? { ...t, messages: [...t.messages, msg] } : t
    ))
    setSelected(prev => prev?.id === id ? { ...prev, messages: [...prev.messages, msg] } : prev)
  }

  return (
    <div style={s.container}>
      <div style={s.pageHeader}>
        <h1 style={s.pageTitle}>取引管理</h1>
        <p style={s.pageSubtitle}>購入・販売した商品の取引状況を確認・管理できます</p>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <button onClick={() => { setTab('buyer'); setSelected(null) }} style={{ ...s.tab, ...(tab === 'buyer' ? s.tabActive : {}) }}>
          購入した取引
          {buyerTxns.length > 0 && <span style={s.tabCount}>{buyerTxns.length}</span>}
        </button>
        <button onClick={() => { setTab('seller'); setSelected(null) }} style={{ ...s.tab, ...(tab === 'seller' ? s.tabActive : {}) }}>
          販売した取引
          {sellerTxns.length > 0 && <span style={s.tabCount}>{sellerTxns.length}</span>}
        </button>
      </div>

      <div style={s.layout}>
        {/* ── 取引一覧 ── */}
        <div style={s.listPanel}>
          {list.length === 0 ? (
            <div style={s.emptyList}>
              <div style={s.emptyIcon}>◎</div>
              <p>{tab === 'buyer' ? '購入した取引はありません' : '販売した取引はありません'}</p>
            </div>
          ) : (
            list.map(txn => {
              const st = STATUS_CONFIG[txn.status]
              const isActive = selected?.id === txn.id
              return (
                <div key={txn.id} onClick={() => setSelected(txn)} style={{ ...s.txnRow, ...(isActive ? s.txnRowActive : {}) }}>
                  <img src={txn.productImage} alt="" style={s.txnThumb} onError={e => { e.target.src = 'https://via.placeholder.com/56x42' }} />
                  <div style={s.txnInfo}>
                    <div style={s.txnTitle}>{txn.productTitle}</div>
                    <div style={s.txnMeta}>
                      {tab === 'buyer' ? `販売者：${txn.seller.username}` : `購入者：${txn.buyer.username}`}
                    </div>
                    <div style={s.txnDate}>{txn.purchasedAt}</div>
                  </div>
                  <div style={s.txnRight}>
                    <div style={s.txnPrice}>¥{txn.price.toLocaleString()}</div>
                    <span style={{ ...s.statusBadge, color: st.color, backgroundColor: st.bg, borderColor: st.border }}>
                      {st.label}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ── 取引詳細 ── */}
        {selected ? (
          <TransactionDetail
            txn={selected}
            role={tab === 'buyer' ? 'buyer' : 'seller'}
            onUpdateTxn={updateTxn}
            onAddMessage={addMessage}
          />
        ) : (
          <div style={s.detailEmpty}>
            <div style={s.detailEmptyIcon}>◈</div>
            <p>取引を選択してください</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════
   取引詳細コンポーネント
══════════════════════════════ */
function TransactionDetail({ txn, role, onUpdateTxn, onAddMessage }) {
  const st = STATUS_CONFIG[txn.status]
  const step = st.step

  const [msgText, setMsgText] = useState('')
  const [deliveryUrl, setDeliveryUrl] = useState('')
  const [deliveryNote, setDeliveryNote] = useState('')
  const [showDeliveryForm, setShowDeliveryForm] = useState(false)
  const [confirmModal, setConfirmModal] = useState(false)

  const now = new Date().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-')

  // 出品者：納品する
  const handleDeliver = () => {
    if (!deliveryUrl.trim()) return
    const msg = {
      id: `m-${Date.now()}`,
      from: 'seller',
      type: 'delivery',
      content: '納品が完了しました。以下をご確認ください。',
      deliveryUrl: deliveryUrl.trim(),
      deliveryNote: deliveryNote.trim(),
      sentAt: now,
    }
    onAddMessage(txn.id, msg)
    onUpdateTxn(txn.id, { status: 'delivered', deliveredAt: now })
    setDeliveryUrl('')
    setDeliveryNote('')
    setShowDeliveryForm(false)
  }

  // 購入者：受け取り確認
  const handleConfirm = () => {
    const msg = {
      id: `m-${Date.now()}`,
      from: 'buyer',
      type: 'text',
      content: '受け取りを確認しました。ありがとうございました！',
      sentAt: now,
    }
    onAddMessage(txn.id, msg)
    onUpdateTxn(txn.id, { status: 'confirmed', confirmedAt: now })
    setConfirmModal(false)
  }

  // メッセージ送信
  const handleSendMsg = () => {
    if (!msgText.trim()) return
    const msg = {
      id: `m-${Date.now()}`,
      from: role,
      type: 'text',
      content: msgText.trim(),
      sentAt: now,
    }
    onAddMessage(txn.id, msg)
    setMsgText('')
  }

  return (
    <div style={s.detail}>
      {/* 商品情報 */}
      <div style={s.detailProduct}>
        <img src={txn.productImage} alt="" style={s.detailImg} onError={e => { e.target.src = 'https://via.placeholder.com/80x60' }} />
        <div style={s.detailProductInfo}>
          <div style={s.detailProductTitle}>{txn.productTitle}</div>
          <div style={s.detailProductMeta}>
            <span>購入者：<b>{txn.buyer.username}</b></span>
            <span>販売者：<b>{txn.seller.username}</b></span>
            <span>支払：{txn.paymentMethod}</span>
          </div>
        </div>
        <div style={s.detailPriceBlock}>
          <div style={s.detailPrice}>¥{txn.price.toLocaleString()}</div>
          <span style={{ ...s.statusBadge, color: st.color, backgroundColor: st.bg, borderColor: st.border, fontSize: 11 }}>
            {st.label}
          </span>
        </div>
      </div>

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
              <div style={s.tlDate}>
                {i === 0 && txn.purchasedAt}
                {i === 1 && (txn.deliveredAt || `期限：${txn.deliveryDeadline}`)}
                {i === 2 && txn.confirmedAt}
                {i === 3 && txn.completedAt}
              </div>
            </div>
          )
        })}
      </div>

      {/* エスクロー説明 */}
      <div style={s.escrowNote}>
        <span style={s.escrowIcon}>🔒</span>
        <span>お支払い金額は購入者が「受け取り確認」をするまで安全にお預かりします（エスクロー）</span>
      </div>

      {/* メッセージ履歴 */}
      <div style={s.messages}>
        <div style={s.messagesTitle}>取引メッセージ</div>
        <div style={s.messagesList}>
          {txn.messages.map(msg => (
            <div key={msg.id} style={{ ...s.msgBubble, ...(msg.from === role ? s.msgBubbleSelf : s.msgBubbleOther) }}>
              <div style={s.msgMeta}>
                <span style={s.msgFrom}>{msg.from === 'seller' ? '販売者' : '購入者'}</span>
                <span style={s.msgTime}>{msg.sentAt}</span>
              </div>
              {msg.type === 'delivery' ? (
                <div style={s.deliveryCard}>
                  <div style={s.deliveryCardHeader}>
                    <span style={s.deliveryIcon}>📦</span>
                    <span style={s.deliveryLabel}>納品物</span>
                  </div>
                  <p style={s.deliveryText}>{msg.content}</p>
                  <a href={msg.deliveryUrl} target="_blank" rel="noreferrer" style={s.deliveryLink}>
                    🔗 {msg.deliveryUrl}
                  </a>
                  {msg.deliveryNote && (
                    <p style={s.deliveryNote}>{msg.deliveryNote}</p>
                  )}
                </div>
              ) : (
                <div style={s.msgText}>{msg.content}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* アクションエリア */}
      <div style={s.actionArea}>
        {/* 出品者：納品ボタン */}
        {role === 'seller' && txn.status === 'pending' && (
          <>
            {!showDeliveryForm ? (
              <button onClick={() => setShowDeliveryForm(true)} style={s.deliverBtn}>
                📦 納品する
              </button>
            ) : (
              <div style={s.deliveryForm}>
                <div style={s.deliveryFormTitle}>納品情報を入力</div>
                <input
                  value={deliveryUrl}
                  onChange={e => setDeliveryUrl(e.target.value)}
                  placeholder="納品URL（Google Drive / GitHub / ダウンロードリンク等）"
                  style={s.deliveryInput}
                />
                <textarea
                  value={deliveryNote}
                  onChange={e => setDeliveryNote(e.target.value)}
                  placeholder="購入者へのメモ（使い方・注意事項など）"
                  rows={3}
                  style={s.deliveryTextarea}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleDeliver} disabled={!deliveryUrl.trim()} style={{ ...s.deliverBtn, flex: 1, opacity: deliveryUrl.trim() ? 1 : 0.4 }}>
                    納品を完了する
                  </button>
                  <button onClick={() => setShowDeliveryForm(false)} style={s.cancelSmallBtn}>
                    キャンセル
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* 購入者：受け取り確認ボタン */}
        {role === 'buyer' && txn.status === 'delivered' && (
          <button onClick={() => setConfirmModal(true)} style={s.confirmBtn}>
            ✔ 受け取りを確認する
          </button>
        )}

        {/* ステータス表示（操作不要な場合） */}
        {((role === 'seller' && txn.status !== 'pending') ||
          (role === 'buyer' && txn.status !== 'delivered')) && (
          <div style={{ ...s.statusNote, color: st.color, borderColor: st.border, backgroundColor: st.bg }}>
            {txn.status === 'pending' && role === 'buyer' && '販売者からの納品をお待ちください'}
            {txn.status === 'delivered' && role === 'seller' && '購入者の受け取り確認待ちです。確認後に入金されます'}
            {txn.status === 'confirmed' && '受取確認済み。入金処理中です（1〜3営業日）'}
            {txn.status === 'completed' && '取引が完了しました'}
          </div>
        )}

        {/* テキストメッセージ入力 */}
        <div style={s.msgInput}>
          <input
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            placeholder="メッセージを入力..."
            style={s.msgInputField}
            onKeyDown={e => e.key === 'Enter' && handleSendMsg()}
          />
          <button onClick={handleSendMsg} disabled={!msgText.trim()} style={{ ...s.sendBtn, opacity: msgText.trim() ? 1 : 0.4 }}>
            送信
          </button>
        </div>
      </div>

      {/* 受け取り確認モーダル */}
      {confirmModal && (
        <div style={s.overlay} onClick={() => setConfirmModal(false)}>
          <div style={s.confirmModal} onClick={e => e.stopPropagation()}>
            <div style={s.confirmEmoji}>✔</div>
            <h3 style={s.confirmTitle}>受け取りを確認しますか？</h3>
            <p style={s.confirmDesc}>
              確認後、販売者への入金が開始されます。<br />
              問題がある場合は確認前にメッセージでご連絡ください。
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleConfirm} style={s.confirmYesBtn}>受け取り確認する</button>
              <button onClick={() => setConfirmModal(false)} style={s.confirmNoBtn}>戻る</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════
   Styles
══════════════════════════════ */
const s = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '36px 24px 80px',
  },
  pageHeader: { marginBottom: 24 },
  pageTitle: { fontSize: 28, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px', marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: '#64748b' },

  /* Tabs */
  tabs: { display: 'flex', gap: 4, borderBottom: '1px solid rgba(139,92,246,0.1)', marginBottom: 20, paddingBottom: 0 },
  tab: { padding: '10px 22px', background: 'none', border: 'none', borderBottom: '2px solid transparent', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: -1, transition: 'color 0.15s' },
  tabActive: { color: '#a78bfa', borderBottomColor: '#8b5cf6' },
  tabCount: { fontSize: 11, backgroundColor: 'rgba(139,92,246,0.15)', color: '#a78bfa', padding: '2px 7px', borderRadius: 10, fontWeight: 700 },

  /* Layout */
  layout: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' },

  /* List */
  listPanel: { backgroundColor: '#0e0e20', borderRadius: 14, border: '1px solid rgba(139,92,246,0.1)', overflow: 'hidden', maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' },
  txnRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid rgba(139,92,246,0.06)', cursor: 'pointer', transition: 'background 0.12s' },
  txnRowActive: { backgroundColor: 'rgba(139,92,246,0.08)', borderLeft: '2px solid #8b5cf6' },
  txnThumb: { width: 52, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0, filter: 'brightness(0.8)', backgroundColor: '#0b0b1a' },
  txnInfo: { flex: 1, minWidth: 0 },
  txnTitle: { fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  txnMeta: { fontSize: 10, color: '#475569', marginBottom: 2 },
  txnDate: { fontSize: 10, color: '#334155' },
  txnRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  txnPrice: { fontSize: 13, fontWeight: 700, color: '#22d3ee' },
  statusBadge: { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, border: '1px solid' },
  emptyList: { padding: '48px 20px', textAlign: 'center', color: '#334155', fontSize: 13 },
  emptyIcon: { fontSize: 28, opacity: 0.3, marginBottom: 8 },

  /* Detail empty */
  detailEmpty: { backgroundColor: '#0e0e20', borderRadius: 14, border: '1px solid rgba(139,92,246,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, gap: 10, color: '#334155', fontSize: 13 },
  detailEmptyIcon: { fontSize: 32, opacity: 0.3 },

  /* Detail */
  detail: { backgroundColor: '#0e0e20', borderRadius: 14, border: '1px solid rgba(139,92,246,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },

  /* Product bar */
  detailProduct: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(139,92,246,0.08)', backgroundColor: 'rgba(139,92,246,0.03)' },
  detailImg: { width: 68, height: 50, borderRadius: 8, objectFit: 'cover', flexShrink: 0, filter: 'brightness(0.85)' },
  detailProductInfo: { flex: 1, minWidth: 0 },
  detailProductTitle: { fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 },
  detailProductMeta: { display: 'flex', gap: 12, fontSize: 11, color: '#475569' },
  detailPriceBlock: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 },
  detailPrice: { fontSize: 18, fontWeight: 800, background: 'linear-gradient(90deg,#22d3ee,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },

  /* Timeline */
  timeline: { display: 'flex', padding: '20px 24px', gap: 0, alignItems: 'flex-start', borderBottom: '1px solid rgba(139,92,246,0.08)', overflowX: 'auto' },
  tlItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flex: 1, minWidth: 80 },
  tlDot: { width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)', border: '2px solid rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#334155', zIndex: 1, marginBottom: 8, transition: 'all 0.3s' },
  tlDotActive: { backgroundColor: 'rgba(139,92,246,0.15)', borderColor: '#8b5cf6', color: '#a78bfa' },
  tlDotCurrent: { boxShadow: '0 0 14px rgba(139,92,246,0.5)', borderColor: '#a78bfa', color: '#a78bfa' },
  tlLine: { position: 'absolute', top: 16, left: '50%', width: '100%', height: 2, backgroundColor: 'rgba(139,92,246,0.1)', zIndex: 0 },
  tlLineActive: { backgroundColor: '#8b5cf6' },
  tlLabel: { fontSize: 11, fontWeight: 600, color: '#94a3b8', textAlign: 'center', marginBottom: 3 },
  tlDate: { fontSize: 9, color: '#475569', textAlign: 'center', whiteSpace: 'nowrap' },

  /* Escrow */
  escrowNote: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', backgroundColor: 'rgba(34,211,238,0.04)', borderBottom: '1px solid rgba(34,211,238,0.08)', fontSize: 11, color: '#64748b' },
  escrowIcon: { fontSize: 14, flexShrink: 0 },

  /* Messages */
  messages: { flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px', gap: 12, maxHeight: 360, overflowY: 'auto', minHeight: 180 },
  messagesTitle: { fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.05em', marginBottom: 4 },
  messagesList: { display: 'flex', flexDirection: 'column', gap: 12 },
  msgBubble: { display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '85%' },
  msgBubbleSelf: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  msgBubbleOther: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  msgMeta: { display: 'flex', gap: 8, alignItems: 'center' },
  msgFrom: { fontSize: 10, fontWeight: 600, color: '#64748b' },
  msgTime: { fontSize: 9, color: '#334155' },
  msgText: { padding: '10px 14px', borderRadius: 12, backgroundColor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)', color: '#e2e8f0', fontSize: 13, lineHeight: 1.6 },

  /* Delivery card */
  deliveryCard: { padding: '14px 16px', borderRadius: 12, backgroundColor: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', display: 'flex', flexDirection: 'column', gap: 8 },
  deliveryCardHeader: { display: 'flex', alignItems: 'center', gap: 6 },
  deliveryIcon: { fontSize: 16 },
  deliveryLabel: { fontSize: 12, fontWeight: 700, color: '#22d3ee' },
  deliveryText: { fontSize: 12, color: '#94a3b8' },
  deliveryLink: { fontSize: 13, color: '#22d3ee', wordBreak: 'break-all', fontWeight: 600 },
  deliveryNote: { fontSize: 12, color: '#64748b', lineHeight: 1.6, paddingTop: 4, borderTop: '1px solid rgba(34,211,238,0.1)' },

  /* Action area */
  actionArea: { padding: '14px 20px', borderTop: '1px solid rgba(139,92,246,0.08)', display: 'flex', flexDirection: 'column', gap: 10, backgroundColor: 'rgba(139,92,246,0.02)' },
  deliverBtn: { padding: '12px', background: 'linear-gradient(135deg,#7c3aed,#0891b2)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 16px rgba(124,58,237,0.3)', transition: 'opacity 0.15s' },
  confirmBtn: { padding: '12px', background: 'linear-gradient(135deg,rgba(52,211,153,0.3),rgba(52,211,153,0.15))', color: '#34d399', border: '1px solid rgba(52,211,153,0.4)', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  statusNote: { padding: '10px 14px', borderRadius: 8, border: '1px solid', fontSize: 12, fontWeight: 500, textAlign: 'center' },
  deliveryForm: { display: 'flex', flexDirection: 'column', gap: 8, padding: '14px', backgroundColor: 'rgba(34,211,238,0.04)', borderRadius: 10, border: '1px solid rgba(34,211,238,0.1)' },
  deliveryFormTitle: { fontSize: 12, fontWeight: 700, color: '#22d3ee', marginBottom: 2 },
  deliveryInput: { padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(34,211,238,0.2)', backgroundColor: 'rgba(14,14,32,0.8)', color: '#e2e8f0', fontSize: 13, outline: 'none' },
  deliveryTextarea: { padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(139,92,246,0.15)', backgroundColor: 'rgba(14,14,32,0.8)', color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'none', lineHeight: 1.6 },
  cancelSmallBtn: { padding: '10px 16px', backgroundColor: 'transparent', color: '#64748b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 13, cursor: 'pointer' },
  msgInput: { display: 'flex', gap: 8 },
  msgInputField: { flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(139,92,246,0.15)', backgroundColor: 'rgba(14,14,32,0.8)', color: '#e2e8f0', fontSize: 13, outline: 'none' },
  sendBtn: { padding: '10px 18px', background: 'linear-gradient(135deg,#7c3aed,#0891b2)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' },

  /* Confirm modal */
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: 20 },
  confirmModal: { backgroundColor: '#0e0e20', borderRadius: 18, padding: '32px 28px', textAlign: 'center', maxWidth: 380, width: '100%', border: '1px solid rgba(52,211,153,0.2)', boxShadow: '0 0 40px rgba(52,211,153,0.1)' },
  confirmEmoji: { fontSize: 36, color: '#34d399', marginBottom: 12 },
  confirmTitle: { fontSize: 18, fontWeight: 800, color: '#f1f5f9', marginBottom: 10 },
  confirmDesc: { fontSize: 13, color: '#64748b', lineHeight: 1.8, marginBottom: 24 },
  confirmYesBtn: { flex: 1, padding: '12px', backgroundColor: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  confirmNoBtn: { padding: '12px 20px', backgroundColor: 'transparent', color: '#64748b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, fontSize: 14, cursor: 'pointer' },
}
