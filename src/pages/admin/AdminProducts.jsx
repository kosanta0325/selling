import { useState } from 'react'
import { PENDING_PRODUCTS, PUBLISHED_PRODUCTS } from '../../data/adminData.js'

export default function AdminProducts() {
  const [pending, setPending] = useState(PENDING_PRODUCTS)
  const [published, setPublished] = useState(PUBLISHED_PRODUCTS)
  const [tab, setTab] = useState('pending')
  const [selected, setSelected] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const approve = (id) => {
    const product = pending.find(p => p.id === id)
    setPending(prev => prev.filter(p => p.id !== id))
    setPublished(prev => [...prev, { ...product, status: 'published', sales: 0 }])
    if (selected?.id === id) setSelected(null)
    showToast(`「${product.title}」を承認しました`)
  }

  const reject = (id) => {
    const product = pending.find(p => p.id === id)
    setPending(prev => prev.filter(p => p.id !== id))
    setRejectModal(null)
    setRejectReason('')
    if (selected?.id === id) setSelected(null)
    showToast(`「${product.title}」を差し戻しました`, 'warning')
  }

  const takedown = (id) => {
    const product = published.find(p => p.id === id)
    setPublished(prev => prev.filter(p => p.id !== id))
    showToast(`「${product.title}」を非公開にしました`, 'warning')
  }

  const list = tab === 'pending' ? pending : published

  return (
    <div style={styles.container}>
      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, ...(toast.type === 'warning' ? styles.toastWarning : {}) }}>
          {toast.type === 'warning' ? '⚠ ' : '✓ '}{toast.msg}
        </div>
      )}

      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>商品審査・管理</h1>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setTab('pending')}
          style={{ ...styles.tab, ...(tab === 'pending' ? styles.tabActive : {}) }}
        >
          審査待ち
          {pending.length > 0 && <span style={styles.tabBadge}>{pending.length}</span>}
        </button>
        <button
          onClick={() => setTab('published')}
          style={{ ...styles.tab, ...(tab === 'published' ? styles.tabActive : {}) }}
        >
          公開中 <span style={styles.tabCount}>{published.length}</span>
        </button>
      </div>

      <div style={styles.layout}>
        {/* List */}
        <div style={styles.listPanel}>
          {list.length === 0 && (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>✓</div>
              <p>審査待ちの商品はありません</p>
            </div>
          )}
          {list.map(product => (
            <div
              key={product.id}
              onClick={() => setSelected(product)}
              style={{ ...styles.productRow, ...(selected?.id === product.id ? styles.productRowActive : {}) }}
            >
              <div style={styles.productThumb}>
                <img src={product.image} alt="" style={styles.thumbImg} onError={e => { e.target.src = 'https://via.placeholder.com/60x45' }} />
              </div>
              <div style={styles.productInfo}>
                <div style={styles.productTitle}>{product.title}</div>
                <div style={styles.productMeta}>
                  <span style={styles.productSeller}>@{product.seller}</span>
                  <span style={styles.productCategory}>{product.category}</span>
                </div>
                {tab === 'pending' && <div style={styles.submittedAt}>{product.submittedAt}</div>}
                {tab === 'published' && <div style={styles.salesBadge}>{product.sales}件販売</div>}
              </div>
              <div style={styles.productPrice}>¥{product.price.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Detail */}
        {selected ? (
          <div style={styles.detailPanel}>
            <img
              src={selected.image}
              alt=""
              style={styles.detailImg}
              onError={e => { e.target.src = 'https://via.placeholder.com/400x200' }}
            />
            <div style={styles.detailBody}>
              <div style={styles.detailCat}>{selected.category}</div>
              <h2 style={styles.detailTitle}>{selected.title}</h2>
              <div style={styles.detailMeta}>
                <span>@{selected.seller}</span>
                <span style={styles.detailPrice}>¥{selected.price.toLocaleString()}</span>
              </div>
              {selected.submittedAt && (
                <div style={styles.detailDate}>提出日時: {selected.submittedAt}</div>
              )}
              <div style={styles.detailDesc}>
                {(selected.description || '').split('\n').map((line, i) => (
                  <p key={i} style={{ marginBottom: 4 }}>{line}</p>
                ))}
              </div>

              {tab === 'pending' && (
                <div style={styles.actionButtons}>
                  <button onClick={() => approve(selected.id)} style={styles.approveBtn}>
                    ✓ 承認する
                  </button>
                  <button onClick={() => setRejectModal(selected)} style={styles.rejectBtn}>
                    ✕ 差し戻す
                  </button>
                </div>
              )}
              {tab === 'published' && (
                <button onClick={() => takedown(selected.id)} style={styles.takedownBtn}>
                  ⚠ 非公開にする
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={styles.detailEmpty}>
            <div style={styles.detailEmptyIcon}>◉</div>
            <p>商品を選択してください</p>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div style={styles.overlay} onClick={() => setRejectModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>差し戻し理由を入力</h3>
            <p style={styles.modalProduct}>「{rejectModal.title}」</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="販売者に送信される差し戻し理由を入力してください"
              rows={4}
              style={styles.reasonInput}
            />
            <div style={styles.modalActions}>
              <button onClick={() => reject(rejectModal.id)} style={styles.confirmRejectBtn}>
                差し戻す
              </button>
              <button onClick={() => setRejectModal(null)} style={styles.cancelBtn}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
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
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  toastWarning: {
    backgroundColor: 'rgba(251,146,60,0.15)',
    color: '#fb923c',
    borderColor: 'rgba(251,146,60,0.3)',
  },
  pageHeader: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: '#f1f5f9',
    letterSpacing: '-0.5px',
  },
  tabs: {
    display: 'flex',
    gap: 4,
    marginBottom: 20,
    borderBottom: '1px solid rgba(139,92,246,0.1)',
    paddingBottom: 0,
  },
  tab: {
    padding: '10px 20px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#64748b',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    transition: 'color 0.15s',
    marginBottom: -1,
  },
  tabActive: {
    color: '#a78bfa',
    borderBottomColor: '#8b5cf6',
  },
  tabBadge: {
    backgroundColor: '#ef4444',
    color: '#fff',
    fontSize: 10,
    fontWeight: 800,
    padding: '2px 6px',
    borderRadius: 10,
  },
  tabCount: {
    fontSize: 11,
    color: '#475569',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: '2px 7px',
    borderRadius: 6,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: 16,
    alignItems: 'start',
  },
  listPanel: {
    backgroundColor: '#0e0e20',
    borderRadius: 14,
    border: '1px solid rgba(139,92,246,0.1)',
    overflow: 'hidden',
    maxHeight: 'calc(100vh - 220px)',
    overflowY: 'auto',
  },
  productRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    borderBottom: '1px solid rgba(139,92,246,0.07)',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  productRowActive: {
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderLeft: '2px solid #8b5cf6',
  },
  productThumb: {
    width: 56,
    height: 42,
    borderRadius: 6,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#0b0b1a',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'brightness(0.8)',
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
  },
  productTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#e2e8f0',
    marginBottom: 3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  productMeta: {
    display: 'flex',
    gap: 6,
    marginBottom: 2,
  },
  productSeller: {
    fontSize: 10,
    color: '#475569',
  },
  productCategory: {
    fontSize: 10,
    color: '#8b5cf6',
    backgroundColor: 'rgba(139,92,246,0.1)',
    padding: '1px 6px',
    borderRadius: 4,
  },
  submittedAt: {
    fontSize: 10,
    color: '#334155',
  },
  salesBadge: {
    fontSize: 10,
    color: '#34d399',
  },
  productPrice: {
    fontSize: 13,
    fontWeight: 700,
    color: '#22d3ee',
    flexShrink: 0,
  },
  detailPanel: {
    backgroundColor: '#0e0e20',
    borderRadius: 14,
    border: '1px solid rgba(139,92,246,0.1)',
    overflow: 'hidden',
  },
  detailImg: {
    width: '100%',
    height: 200,
    objectFit: 'cover',
    filter: 'brightness(0.8)',
    display: 'block',
  },
  detailBody: {
    padding: '20px 22px',
  },
  detailCat: {
    fontSize: 11,
    color: '#8b5cf6',
    backgroundColor: 'rgba(139,92,246,0.1)',
    padding: '3px 10px',
    borderRadius: 6,
    display: 'inline-block',
    marginBottom: 10,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: '#f1f5f9',
    marginBottom: 8,
    letterSpacing: '-0.3px',
  },
  detailMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailPrice: {
    fontSize: 20,
    fontWeight: 800,
    color: '#22d3ee',
  },
  detailDate: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 14,
  },
  detailDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 1.8,
    marginBottom: 20,
    maxHeight: 160,
    overflowY: 'auto',
    padding: '12px 14px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.04)',
  },
  actionButtons: {
    display: 'flex',
    gap: 10,
  },
  approveBtn: {
    flex: 1,
    padding: '12px',
    background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(52,211,153,0.1))',
    color: '#34d399',
    border: '1px solid rgba(52,211,153,0.3)',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  rejectBtn: {
    flex: 1,
    padding: '12px',
    background: 'rgba(239,68,68,0.08)',
    color: '#f87171',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  takedownBtn: {
    width: '100%',
    padding: '12px',
    background: 'rgba(251,146,60,0.08)',
    color: '#fb923c',
    border: '1px solid rgba(251,146,60,0.2)',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  detailEmpty: {
    backgroundColor: '#0e0e20',
    borderRadius: 14,
    border: '1px solid rgba(139,92,246,0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    gap: 12,
    color: '#334155',
    fontSize: 13,
  },
  detailEmptyIcon: {
    fontSize: 32,
    opacity: 0.3,
  },
  empty: {
    padding: '48px 20px',
    textAlign: 'center',
    color: '#334155',
    fontSize: 13,
  },
  emptyIcon: {
    fontSize: 28,
    color: '#34d399',
    marginBottom: 8,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 400,
    padding: 20,
  },
  modal: {
    backgroundColor: '#0e0e20',
    borderRadius: 16,
    padding: '24px 24px',
    width: '100%',
    maxWidth: 440,
    border: '1px solid rgba(239,68,68,0.2)',
    boxShadow: '0 0 40px rgba(239,68,68,0.1)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 800,
    color: '#f1f5f9',
    marginBottom: 6,
  },
  modalProduct: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 14,
  },
  reasonInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid rgba(139,92,246,0.15)',
    backgroundColor: 'rgba(5,5,15,0.8)',
    color: '#e2e8f0',
    fontSize: 13,
    resize: 'none',
    lineHeight: 1.7,
    outline: 'none',
    marginBottom: 14,
  },
  modalActions: {
    display: 'flex',
    gap: 8,
  },
  confirmRejectBtn: {
    flex: 1,
    padding: '11px',
    backgroundColor: 'rgba(239,68,68,0.15)',
    color: '#f87171',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  cancelBtn: {
    flex: 1,
    padding: '11px',
    backgroundColor: 'transparent',
    color: '#64748b',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
}
