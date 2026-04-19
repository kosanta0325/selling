import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../context/ProductContext.jsx'

const PAYMENT_OPTIONS = [
  { id: 'credit', label: 'クレジットカード', icon: '💳' },
  { id: 'paypay', label: 'PayPay', icon: '📱' },
  { id: 'bank', label: '銀行振込', icon: '🏦' },
  { id: 'paypal', label: 'PayPal', icon: '🌐' },
  { id: 'linepay', label: 'LINE Pay', icon: '💚' },
  { id: 'amazon', label: 'Amazon Pay', icon: '🛒' },
]
const PAYMENT_ID_MAP = {
  'クレジットカード': 'credit',
  'PayPay': 'paypay',
  '銀行振込': 'bank',
  'PayPal': 'paypal',
  'LINE Pay': 'linepay',
  'Amazon Pay': 'amazon',
}

const CATEGORIES = ['テキスト生成', '画像生成', 'マーケティング', '開発支援', 'データ分析', 'その他']

export default function MyProductsPage() {
  const navigate = useNavigate()
  const { products, updateProduct, deleteProduct } = useProducts()

  // 自分の商品（出品フォームから追加したもの）
  const myProducts = products.filter(p => p.seller === 'あなた')

  const [editTarget, setEditTarget] = useState(null)   // 編集中の商品
  const [deleteTarget, setDeleteTarget] = useState(null) // 削除確認中の商品
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleDelete = (id) => {
    const product = products.find(p => p.id === id)
    deleteProduct(id)
    setDeleteTarget(null)
    showToast(`「${product.title}」を削除しました`, 'warning')
  }

  const handleEditSave = (id, updated) => {
    updateProduct(id, updated)
    setEditTarget(null)
    showToast('商品を更新しました')
  }

  if (myProducts.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyGlow} />
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>◎</div>
          <h2 style={styles.emptyTitle}>出品中の商品はありません</h2>
          <p style={styles.emptyDesc}>「出品する」から最初のAIツールを出品しましょう</p>
          <button onClick={() => navigate('/sell')} style={styles.emptyBtn}>
            + 出品する
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, ...(toast.type === 'warning' ? styles.toastWarn : {}) }}>
          {toast.type === 'warning' ? '🗑 ' : '✓ '}{toast.msg}
        </div>
      )}

      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>マイ商品</h1>
          <p style={styles.pageSubtitle}>出品中の商品を管理できます</p>
        </div>
        <button onClick={() => navigate('/sell')} style={styles.addBtn}>
          + 新しく出品する
        </button>
      </div>

      <div style={styles.grid}>
        {myProducts.map(product => (
          <div key={product.id} style={styles.card}>
            {/* Image */}
            <div style={styles.imageWrapper}>
              <img
                src={product.images?.[0]}
                alt={product.title}
                style={styles.image}
                onError={e => { e.target.src = 'https://via.placeholder.com/400x200?text=No+Image' }}
              />
              <div style={styles.imageOverlay} />
              <span style={styles.categoryBadge}>{product.category}</span>
              <span style={styles.newBadge}>出品中</span>
            </div>

            {/* Body */}
            <div style={styles.cardBody}>
              <h3 style={styles.cardTitle}>{product.title}</h3>
              <div style={styles.cardMeta}>
                <div style={styles.priceRow}>
                  <span style={styles.price}>¥{product.price.toLocaleString()}</span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaItem}>📦 {product.deliveryDays}日以内</span>
                  <span style={styles.metaItem}>💳 {product.paymentMethods?.join(' · ')}</span>
                </div>
                {product.tags?.length > 0 && (
                  <div style={styles.tags}>
                    {product.tags.map(tag => (
                      <span key={tag} style={styles.tag}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={styles.actions}>
                <button
                  onClick={() => navigate(`/product/${product.id}`)}
                  style={styles.previewBtn}
                >
                  👁 プレビュー
                </button>
                <button
                  onClick={() => setEditTarget(product)}
                  style={styles.editBtn}
                >
                  ✏ 編集
                </button>
                <button
                  onClick={() => setDeleteTarget(product)}
                  style={styles.deleteBtn}
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <EditModal
          product={editTarget}
          onSave={handleEditSave}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div style={styles.overlay} onClick={() => setDeleteTarget(null)}>
          <div style={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <div style={styles.confirmIcon}>🗑</div>
            <h3 style={styles.confirmTitle}>本当に削除しますか？</h3>
            <p style={styles.confirmDesc}>「{deleteTarget.title}」を削除すると元に戻せません。</p>
            <div style={styles.confirmActions}>
              <button onClick={() => handleDelete(deleteTarget.id)} style={styles.confirmDeleteBtn}>
                削除する
              </button>
              <button onClick={() => setDeleteTarget(null)} style={styles.confirmCancelBtn}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── 編集モーダル ── */
function EditModal({ product, onSave, onClose }) {
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    title: product.title,
    category: product.category,
    price: String(product.price),
    description: product.description,
    deliveryDays: String(product.deliveryDays),
    tags: product.tags?.join(', ') ?? '',
    paymentMethodIds: (product.paymentMethods ?? []).map(
      label => PAYMENT_ID_MAP[label] ?? label
    ),
  })
  const [images, setImages] = useState(
    (product.images ?? []).map(url => ({ url, isExisting: true }))
  )
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const togglePayment = (id) => {
    setForm(prev => ({
      ...prev,
      paymentMethodIds: prev.paymentMethodIds.includes(id)
        ? prev.paymentMethodIds.filter(p => p !== id)
        : [...prev.paymentMethodIds, id],
    }))
  }

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (images.length + fileArray.length > 5) { alert('画像は最大5枚まで'); return }
    const previews = fileArray.map(file => ({ url: URL.createObjectURL(file), file }))
    setImages(prev => [...prev, ...previews])
  }

  const removeImage = (index) => {
    setImages(prev => {
      const item = prev[index]
      if (!item.isExisting) URL.revokeObjectURL(item.url)
      return prev.filter((_, i) => i !== index)
    })
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = '商品名を入力してください'
    if (!form.category) e.category = 'カテゴリを選択してください'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = '正しい価格を入力してください'
    if (!form.description.trim()) e.description = '説明を入力してください'
    if (form.paymentMethodIds.length === 0) e.payment = '支払い方法を選択してください'
    if (images.length === 0) e.images = '画像を1枚以上追加してください'
    return e
  }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    const paymentLabels = form.paymentMethodIds.map(
      id => PAYMENT_OPTIONS.find(o => o.id === id)?.label ?? id
    )
    const tagsArray = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []

    onSave(product.id, {
      title: form.title.trim(),
      category: form.category,
      price: Number(form.price),
      description: form.description.trim(),
      deliveryDays: Number(form.deliveryDays),
      paymentMethods: paymentLabels,
      tags: tagsArray,
      images: images.map(img => img.url),
    })
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.editModal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.editModalHeader}>
          <h2 style={styles.editModalTitle}>商品を編集</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.editModalBody}>
          {/* Images */}
          <div style={styles.mSection}>
            <label style={styles.mLabel}>商品画像</label>
            <div
              style={{ ...styles.mDropzone, ...(dragOver ? styles.mDropzoneActive : {}) }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files) }}
            >
              <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFileSelect(e.target.files)} />
              <span style={{ fontSize: 20, color: '#8b5cf6' }}>↑</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>クリックまたはドラッグ&ドロップ</span>
            </div>
            {errors.images && <span style={styles.mError}>{errors.images}</span>}
            {images.length > 0 && (
              <div style={styles.mImageGrid}>
                {images.map((img, i) => (
                  <div key={i} style={styles.mImageItem}>
                    {i === 0 && <span style={styles.mMainBadge}>MAIN</span>}
                    <img src={img.url} alt="" style={styles.mPreviewImg} onError={e => { e.target.src = 'https://via.placeholder.com/80x60' }} />
                    <button type="button" onClick={() => removeImage(i)} style={styles.mRemoveBtn}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <div style={styles.mSection}>
            <label style={styles.mLabel}>商品名</label>
            <input value={form.title} onChange={e => handleChange('title', e.target.value)} style={{ ...styles.mInput, ...(errors.title ? styles.mInputError : {}) }} />
            {errors.title && <span style={styles.mError}>{errors.title}</span>}
          </div>

          {/* Category & Price */}
          <div style={styles.mRow}>
            <div style={{ flex: 1 }}>
              <label style={styles.mLabel}>カテゴリ</label>
              <select value={form.category} onChange={e => handleChange('category', e.target.value)} style={{ ...styles.mInput, ...(errors.category ? styles.mInputError : {}) }}>
                <option value="">選択</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <span style={styles.mError}>{errors.category}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.mLabel}>価格（円）</label>
              <div style={{ position: 'relative' }}>
                <span style={styles.mPricePrefix}>¥</span>
                <input type="number" value={form.price} onChange={e => handleChange('price', e.target.value)} min="1" style={{ ...styles.mInput, paddingLeft: 28, ...(errors.price ? styles.mInputError : {}) }} />
              </div>
              {errors.price && <span style={styles.mError}>{errors.price}</span>}
            </div>
          </div>

          {/* Description */}
          <div style={styles.mSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={styles.mLabel}>商品の説明</label>
              <span style={{ fontSize: 11, color: '#475569' }}>{form.description.length}文字</span>
            </div>
            <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} rows={6} style={{ ...styles.mTextarea, ...(errors.description ? styles.mInputError : {}) }} />
            {errors.description && <span style={styles.mError}>{errors.description}</span>}
          </div>

          {/* Tags */}
          <div style={styles.mSection}>
            <label style={styles.mLabel}>タグ（カンマ区切り）</label>
            <input value={form.tags} onChange={e => handleChange('tags', e.target.value)} placeholder="例：自動化, SEO" style={styles.mInput} />
          </div>

          {/* Delivery */}
          <div style={styles.mSection}>
            <label style={styles.mLabel}>納品予定日数</label>
            <div style={styles.mDeliveryGrid}>
              {['1', '2', '3', '5', '7', '14'].map(d => (
                <button key={d} type="button" onClick={() => handleChange('deliveryDays', d)}
                  style={{ ...styles.mDeliveryBtn, ...(form.deliveryDays === d ? styles.mDeliveryBtnActive : {}) }}>
                  {d}日
                </button>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div style={styles.mSection}>
            <label style={styles.mLabel}>支払い方法</label>
            <div style={styles.mPaymentGrid}>
              {PAYMENT_OPTIONS.map(opt => (
                <button key={opt.id} type="button" onClick={() => togglePayment(opt.id)}
                  style={{ ...styles.mPayBtn, ...(form.paymentMethodIds.includes(opt.id) ? styles.mPayBtnActive : {}) }}>
                  <span>{opt.icon}</span>
                  <span style={{ fontSize: 11 }}>{opt.label}</span>
                  {form.paymentMethodIds.includes(opt.id) && <span style={styles.mCheck}>✓</span>}
                </button>
              ))}
            </div>
            {errors.payment && <span style={styles.mError}>{errors.payment}</span>}
          </div>
        </div>

        {/* Footer */}
        <div style={styles.editModalFooter}>
          <button onClick={handleSave} style={styles.saveBtn}>変更を保存する</button>
          <button onClick={onClose} style={styles.cancelBtn}>キャンセル</button>
        </div>
      </div>
    </div>
  )
}

/* ── Styles ── */
const styles = {
  container: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '36px 24px 80px',
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
    zIndex: 999,
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  toastWarn: {
    backgroundColor: 'rgba(251,146,60,0.15)',
    color: '#fb923c',
    borderColor: 'rgba(251,146,60,0.3)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: '#f1f5f9',
    letterSpacing: '-0.5px',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  addBtn: {
    padding: '11px 22px',
    background: 'linear-gradient(135deg, #7c3aed, #0891b2)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 0 16px rgba(124,58,237,0.3)',
    flexShrink: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 20,
  },
  card: {
    backgroundColor: '#0e0e20',
    borderRadius: 16,
    overflow: 'hidden',
    border: '1px solid rgba(139,92,246,0.15)',
    transition: 'border-color 0.2s',
  },
  imageWrapper: {
    position: 'relative',
    height: 180,
    overflow: 'hidden',
    backgroundColor: '#0b0b1a',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'brightness(0.85)',
  },
  imageOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(14,14,32,0.7) 0%, transparent 60%)',
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(139,92,246,0.25)',
    color: '#a78bfa',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    border: '1px solid rgba(139,92,246,0.3)',
    backdropFilter: 'blur(8px)',
  },
  newBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(52,211,153,0.2)',
    color: '#34d399',
    padding: '3px 9px',
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 800,
    border: '1px solid rgba(52,211,153,0.3)',
    backdropFilter: 'blur(8px)',
    letterSpacing: '0.05em',
  },
  cardBody: {
    padding: '16px 18px',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#e2e8f0',
    marginBottom: 12,
    lineHeight: 1.4,
  },
  cardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 14,
  },
  priceRow: {},
  price: {
    fontSize: 22,
    fontWeight: 800,
    background: 'linear-gradient(90deg, #22d3ee, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  metaRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  metaItem: {
    fontSize: 11,
    color: '#475569',
  },
  tags: {
    display: 'flex',
    gap: 5,
    flexWrap: 'wrap',
  },
  tag: {
    fontSize: 11,
    color: '#64748b',
    backgroundColor: 'rgba(139,92,246,0.07)',
    padding: '2px 8px',
    borderRadius: 5,
    border: '1px solid rgba(139,92,246,0.1)',
  },
  actions: {
    display: 'flex',
    gap: 8,
    borderTop: '1px solid rgba(139,92,246,0.08)',
    paddingTop: 14,
  },
  previewBtn: {
    flex: 1,
    padding: '9px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  editBtn: {
    flex: 1,
    padding: '9px',
    backgroundColor: 'rgba(139,92,246,0.1)',
    color: '#a78bfa',
    border: '1px solid rgba(139,92,246,0.25)',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  deleteBtn: {
    padding: '9px 12px',
    backgroundColor: 'rgba(239,68,68,0.08)',
    color: '#f87171',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  /* Empty state */
  emptyContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 64px)',
    padding: 20,
    position: 'relative',
  },
  emptyGlow: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    width: 400,
    height: 400,
    background: 'radial-gradient(ellipse, rgba(139,92,246,0.08), transparent 70%)',
    pointerEvents: 'none',
  },
  emptyCard: {
    backgroundColor: '#0e0e20',
    borderRadius: 20,
    padding: '52px 40px',
    textAlign: 'center',
    border: '1px solid rgba(139,92,246,0.15)',
    maxWidth: 400,
    width: '100%',
  },
  emptyIcon: {
    fontSize: 44,
    color: '#334155',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: '#f1f5f9',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 1.7,
  },
  emptyBtn: {
    padding: '13px 32px',
    background: 'linear-gradient(135deg, #7c3aed, #0891b2)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 0 20px rgba(124,58,237,0.3)',
  },
  /* Overlay */
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 400,
    padding: 20,
  },
  /* Delete confirm */
  confirmModal: {
    backgroundColor: '#0e0e20',
    borderRadius: 18,
    padding: '32px 28px',
    textAlign: 'center',
    maxWidth: 380,
    width: '100%',
    border: '1px solid rgba(239,68,68,0.2)',
    boxShadow: '0 0 40px rgba(239,68,68,0.1)',
  },
  confirmIcon: { fontSize: 36, marginBottom: 12 },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: '#f1f5f9',
    marginBottom: 8,
  },
  confirmDesc: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 1.7,
  },
  confirmActions: { display: 'flex', gap: 10 },
  confirmDeleteBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: 'rgba(239,68,68,0.15)',
    color: '#f87171',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  confirmCancelBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#64748b',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  /* Edit Modal */
  editModal: {
    backgroundColor: '#0b0b1a',
    borderRadius: 18,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgba(139,92,246,0.2)',
    boxShadow: '0 0 60px rgba(139,92,246,0.15)',
    overflow: 'hidden',
  },
  editModalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(139,92,246,0.1)',
    flexShrink: 0,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: '#f1f5f9',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#475569',
    fontSize: 16,
    cursor: 'pointer',
    padding: 4,
  },
  editModalBody: {
    overflowY: 'auto',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    flex: 1,
  },
  editModalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid rgba(139,92,246,0.1)',
    display: 'flex',
    gap: 10,
    flexShrink: 0,
  },
  saveBtn: {
    flex: 1,
    padding: '13px',
    background: 'linear-gradient(135deg, #7c3aed, #0891b2)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 0 16px rgba(124,58,237,0.3)',
  },
  cancelBtn: {
    padding: '13px 24px',
    backgroundColor: 'transparent',
    color: '#64748b',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  /* Modal form */
  mSection: { display: 'flex', flexDirection: 'column', gap: 7 },
  mRow: { display: 'flex', gap: 14 },
  mLabel: { fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.03em' },
  mInput: {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid rgba(139,92,246,0.15)',
    backgroundColor: 'rgba(14,14,32,0.9)',
    color: '#e2e8f0',
    fontSize: 13,
    outline: 'none',
    width: '100%',
  },
  mInputError: { borderColor: 'rgba(239,68,68,0.4)' },
  mTextarea: {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid rgba(139,92,246,0.15)',
    backgroundColor: 'rgba(14,14,32,0.9)',
    color: '#e2e8f0',
    fontSize: 13,
    outline: 'none',
    resize: 'vertical',
    lineHeight: 1.7,
    width: '100%',
  },
  mError: { fontSize: 11, color: '#f87171', fontWeight: 500 },
  mPricePrefix: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#64748b',
    fontSize: 14,
    fontWeight: 700,
    pointerEvents: 'none',
  },
  mDropzone: {
    border: '1px dashed rgba(139,92,246,0.3)',
    borderRadius: 10,
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: 'rgba(139,92,246,0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    transition: 'all 0.2s',
  },
  mDropzoneActive: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139,92,246,0.08)',
  },
  mImageGrid: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  mImageItem: {
    position: 'relative',
    width: 80,
    height: 60,
    borderRadius: 7,
    overflow: 'hidden',
    border: '1px solid rgba(139,92,246,0.2)',
  },
  mMainBadge: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    backgroundColor: 'rgba(139,92,246,0.8)',
    color: '#fff',
    fontSize: 7,
    fontWeight: 800,
    padding: '1px 4px',
    borderRadius: 3,
    zIndex: 1,
  },
  mPreviewImg: { width: '100%', height: '100%', objectFit: 'cover' },
  mRemoveBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    fontSize: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mDeliveryGrid: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  mDeliveryBtn: {
    padding: '7px 14px',
    borderRadius: 7,
    border: '1px solid rgba(139,92,246,0.15)',
    backgroundColor: 'transparent',
    fontSize: 12,
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  mDeliveryBtnActive: {
    borderColor: 'rgba(139,92,246,0.6)',
    backgroundColor: 'rgba(139,92,246,0.1)',
    color: '#a78bfa',
    fontWeight: 700,
  },
  mPaymentGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 },
  mPayBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '9px 10px',
    borderRadius: 8,
    border: '1px solid rgba(139,92,246,0.12)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    fontSize: 11,
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.15s',
    position: 'relative',
  },
  mPayBtnActive: {
    borderColor: 'rgba(139,92,246,0.5)',
    backgroundColor: 'rgba(139,92,246,0.08)',
    color: '#a78bfa',
    fontWeight: 700,
  },
  mCheck: {
    marginLeft: 'auto',
    color: '#8b5cf6',
    fontWeight: 800,
    fontSize: 12,
  },
}
