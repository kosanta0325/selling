import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const [selected, setSelected] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*, seller:profiles!seller_id(username)')
      .order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function approve(id) {
    const { error } = await supabase.from('products').update({ status: 'active' }).eq('id', id)
    if (error) { showToast(`更新失敗: ${error.message}`, 'error'); return }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'active' } : p))
    if (selected?.id === id) setSelected(prev => ({ ...prev, status: 'active' }))
    const p = products.find(p => p.id === id)
    showToast(`「${p?.title}」を承認しました`)
  }

  async function reject(id) {
    const { error } = await supabase.from('products').update({ status: 'rejected' }).eq('id', id)
    if (error) { showToast(`更新失敗: ${error.message}`, 'error'); return }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected' } : p))
    if (selected?.id === id) setSelected(prev => ({ ...prev, status: 'rejected' }))
    setRejectModal(null)
    setRejectReason('')
    showToast(`差し戻しました`, 'warning')
  }

  async function takedown(id) {
    const { error } = await supabase.from('products').update({ status: 'pending' }).eq('id', id)
    if (error) { showToast(`更新失敗: ${error.message}`, 'error'); return }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'pending' } : p))
    if (selected?.id === id) setSelected(prev => ({ ...prev, status: 'pending' }))
    showToast(`非公開にしました`, 'warning')
  }

  const pending  = products.filter(p => p.status === 'pending')
  const active   = products.filter(p => p.status === 'active')
  const rejected = products.filter(p => p.status === 'rejected')
  const list = tab === 'pending' ? pending : tab === 'active' ? active : rejected

  return (
    <div style={s.container}>
      {toast && (
        <div style={{ ...s.toast, ...(toast.type === 'warning' ? s.toastWarn : toast.type === 'error' ? s.toastError : {}) }}>
          {toast.type === 'warning' ? '⚠ ' : toast.type === 'error' ? '⛔ ' : '✓ '}{toast.msg}
        </div>
      )}

      <div style={s.pageHeader}>
        <h1 style={s.pageTitle}>商品審査・管理</h1>
        <div style={s.headerStats}>
          <span style={{ ...s.stat, color: '#d97706' }}>審査待ち <b>{pending.length}</b></span>
          <span style={{ ...s.stat, color: '#16a34a' }}>公開中 <b>{active.length}</b></span>
          <span style={{ ...s.stat, color: '#E8542F' }}>差し戻し <b>{rejected.length}</b></span>
        </div>
      </div>

      <div style={s.tabs}>
        {[
          { key: 'pending',  label: `審査待ち (${pending.length})` },
          { key: 'active',   label: `公開中 (${active.length})` },
          { key: 'rejected', label: `差し戻し (${rejected.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSelected(null) }}
            style={{ ...s.tab, ...(tab === t.key ? s.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={s.layout}>
        {/* 左：一覧 */}
        <div style={s.listPanel}>
          {loading ? (
            <div style={s.empty}>読み込み中...</div>
          ) : list.length === 0 ? (
            <div style={s.empty}>該当商品なし</div>
          ) : (
            list.map(p => (
              <div key={p.id} onClick={() => setSelected(p)}
                style={{ ...s.productRow, ...(selected?.id === p.id ? s.productRowActive : {}) }}>
                {p.image_urls?.[0] ? (
                  <img src={p.image_urls[0]} alt="" style={s.thumb} />
                ) : (
                  <div style={{ ...s.thumb, background: 'rgba(36,56,166,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
                )}
                <div style={s.productInfo}>
                  <div style={s.productTitle}>{p.title}</div>
                  <div style={s.productMeta}>
                    <span>@{p.seller?.username || '不明'}</span>
                    <span>¥{p.price?.toLocaleString()}</span>
                  </div>
                </div>
                {tab === 'pending' && (
                  <div style={s.quickActions} onClick={e => e.stopPropagation()}>
                    <button onClick={() => approve(p.id)} style={s.quickApprove}>承認</button>
                    <button onClick={() => setRejectModal(p.id)} style={s.quickReject}>差戻</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 右：詳細 */}
        {selected ? (
          <div style={s.detail}>
            {selected.image_urls?.[0] && (
              <img src={selected.image_urls[0]} alt="" style={s.detailImg} />
            )}
            <div style={s.detailTitle}>{selected.title}</div>
            <div style={s.detailMeta}>
              <span>出品者: @{selected.seller?.username || '不明'}</span>
              <span>¥{selected.price?.toLocaleString()}</span>
              <span>{selected.category}</span>
            </div>
            <p style={s.detailDesc}>{selected.description?.slice(0, 200)}{selected.description?.length > 200 ? '...' : ''}</p>

            <div style={s.detailActions}>
              {selected.status === 'pending' && <>
                <button onClick={() => approve(selected.id)} style={s.approveBtn}>✓ 承認して公開</button>
                <button onClick={() => setRejectModal(selected.id)} style={s.rejectBtn}>✕ 差し戻す</button>
              </>}
              {selected.status === 'active' && (
                <button onClick={() => takedown(selected.id)} style={s.rejectBtn}>非公開にする</button>
              )}
              {selected.status === 'rejected' && (
                <button onClick={() => approve(selected.id)} style={s.approveBtn}>再度承認する</button>
              )}
            </div>
          </div>
        ) : (
          <div style={s.detailEmpty}>
            <div style={s.emptyIcon}>◉</div>
            <p>商品を選択してください</p>
          </div>
        )}
      </div>

      {/* 差し戻しモーダル */}
      {rejectModal && (
        <div style={s.overlay} onClick={() => setRejectModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>差し戻し理由を入力</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="任意：差し戻し理由"
              rows={3}
              style={s.modalTextarea}
            />
            <div style={s.modalActions}>
              <button onClick={() => reject(rejectModal)} style={s.rejectBtn}>差し戻す</button>
              <button onClick={() => setRejectModal(null)} style={s.cancelBtn}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  container: { padding: '32px 36px', maxWidth: 1100, margin: '0 auto' },
  toast: { position: 'fixed', top: 24, right: 24, zIndex: 999, padding: '12px 20px', borderRadius: 10, background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)', color: '#16a34a', fontSize: 13, fontWeight: 600 },
  toastWarn:  { background: 'rgba(217,119,6,0.1)',  border: '1px solid rgba(217,119,6,0.25)',  color: '#d97706' },
  toastError: { background: 'rgba(232,84,47,0.1)', border: '1px solid rgba(232,84,47,0.25)', color: '#E8542F' },
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: 800, color: '#101B3E', fontFamily: "'Sora', sans-serif" },
  headerStats: { display: 'flex', gap: 16 },
  stat: { fontSize: 13, color: '#5A6180' },
  tabs: { display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #D8DCE9', paddingBottom: 0 },
  tab: { padding: '8px 16px', background: 'none', border: 'none', color: '#5A6180', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -1 },
  tabActive: { color: '#2438A6', borderBottomColor: '#2438A6' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' },
  listPanel: { background: '#fff', border: '1px solid #D8DCE9', borderRadius: 16, overflow: 'hidden', maxHeight: 560, overflowY: 'auto' },
  empty: { padding: '40px', textAlign: 'center', color: '#8A90A8', fontSize: 13 },
  productRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #F6F7F4', cursor: 'pointer', transition: 'background 0.15s' },
  productRowActive: { background: 'rgba(36,56,166,0.05)' },
  thumb: { width: 52, height: 40, objectFit: 'cover', borderRadius: 8, flexShrink: 0 },
  productInfo: { flex: 1, minWidth: 0 },
  productTitle: { fontSize: 13, fontWeight: 600, color: '#101B3E', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  productMeta: { display: 'flex', gap: 10, fontSize: 11, color: '#5A6180' },
  quickActions: { display: 'flex', gap: 6, flexShrink: 0 },
  quickApprove: { padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#16a34a', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', cursor: 'pointer' },
  quickReject:  { padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#E8542F', background: 'rgba(232,84,47,0.08)', border: '1px solid rgba(232,84,47,0.25)', cursor: 'pointer' },
  detail: { background: '#fff', border: '1px solid #D8DCE9', borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 },
  detailEmpty: { background: '#F6F7F4', border: '1px solid #D8DCE9', borderRadius: 16, padding: '60px 24px', textAlign: 'center', color: '#8A90A8', fontSize: 13 },
  emptyIcon: { fontSize: 32, marginBottom: 12, color: '#D8DCE9' },
  detailImg: { width: '100%', height: 140, objectFit: 'cover', borderRadius: 10 },
  detailTitle: { fontSize: 15, fontWeight: 700, color: '#101B3E' },
  detailMeta: { display: 'flex', gap: 10, fontSize: 12, color: '#5A6180', flexWrap: 'wrap' },
  detailDesc: { fontSize: 12, color: '#5A6180', lineHeight: 1.7 },
  detailActions: { display: 'flex', flexDirection: 'column', gap: 8 },
  approveBtn: { width: '100%', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#16a34a', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', cursor: 'pointer' },
  rejectBtn:  { width: '100%', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#E8542F', background: 'rgba(232,84,47,0.08)', border: '1px solid rgba(232,84,47,0.25)', cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: 20 },
  modal: { background: '#fff', border: '1px solid #D8DCE9', borderRadius: 16, padding: '28px', width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 16, fontWeight: 700, color: '#101B3E', marginBottom: 16 },
  modalTextarea: { width: '100%', padding: '10px 12px', background: '#F6F7F4', border: '1px solid #D8DCE9', borderRadius: 8, fontSize: 13, color: '#101B3E', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 14 },
  modalActions: { display: 'flex', gap: 8 },
  cancelBtn: { flex: 1, padding: '10px', borderRadius: 8, fontSize: 13, color: '#5A6180', background: 'transparent', border: '1px solid #D8DCE9', cursor: 'pointer' },
}
