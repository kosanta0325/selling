import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../context/ProductContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

const PAYMENT_OPTIONS = [
  { id: 'credit', label: 'クレジットカード', icon: '💳' },
  { id: 'paypay', label: 'PayPay', icon: '📱' },
  { id: 'bank', label: '銀行振込', icon: '🏦' },
  { id: 'paypal', label: 'PayPal', icon: '🌐' },
  { id: 'linepay', label: 'LINE Pay', icon: '💚' },
  { id: 'amazon', label: 'Amazon Pay', icon: '🛒' },
]

const CATEGORIES = ['テキスト生成', '画像生成', 'マーケティング', '開発支援', 'データ分析', 'その他']

export default function SellerPage() {
  const navigate = useNavigate()
  const { refreshProducts } = useProducts()
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    title: '',
    category: '',
    price: '',
    description: '',
    deliveryDays: '1',
    paymentMethods: [],
    tags: '',
  })
  const [images, setImages] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const togglePayment = (id) => {
    setForm(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(id)
        ? prev.paymentMethods.filter(p => p !== id)
        : [...prev.paymentMethods, id],
    }))
    if (errors.paymentMethods) setErrors(prev => ({ ...prev, paymentMethods: '' }))
  }

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (images.length + fileArray.length > 5) {
      alert('画像は最大5枚までです')
      return
    }
    const previews = fileArray.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }))
    setImages(prev => [...prev, ...previews])
    if (errors.images) setErrors(prev => ({ ...prev, images: '' }))
  }

  const removeImage = (index) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
    })
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = '商品名を入力してください'
    if (!form.category) e.category = 'カテゴリを選択してください'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = '正しい価格を入力してください'
    if (!form.description.trim()) e.description = '説明を入力してください'
    if (form.paymentMethods.length === 0) e.paymentMethods = '支払い方法を1つ以上選択してください'
    if (images.length === 0) e.images = '画像を1枚以上追加してください'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      const imageUrls = []
      for (const img of images) {
        const ext = img.file.name.split('.').pop()
        const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(path, img.file, { contentType: img.file.type })
        if (uploadErr) throw uploadErr
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(path)
        imageUrls.push(publicUrl)
      }

      const tagsArray = form.tags
        ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
        : []
      const paymentLabels = form.paymentMethods.map(
        id => PAYMENT_OPTIONS.find(o => o.id === id)?.label ?? id
      )

      const { error: insertErr } = await supabase.from('products').insert({
        seller_id: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category,
        tags: tagsArray,
        image_urls: imageUrls,
        delivery_days: Number(form.deliveryDays),
        payment_methods: paymentLabels,
        status: 'pending',
      })
      if (insertErr) throw insertErr

      await refreshProducts()
      navigate('/')
    } catch (err) {
      console.error('出品エラー:', err)
      setSubmitError('出品に失敗しました。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerSection}>
        <div style={styles.headerBadge}>⬡ 新規出品</div>
        <h1 style={styles.pageTitle}>AIツールを出品する</h1>
        <p style={styles.pageSubtitle}>あなたが作ったAIツールを世界に届けよう</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Images */}
        <div style={styles.section}>
          <div style={styles.labelRow}>
            <label style={styles.sectionTitle}>商品画像</label>
            <span style={styles.required}>必須</span>
            <span style={styles.hint}>最大5枚</span>
          </div>

          <div
            style={{ ...styles.dropzone, ...(dragOver ? styles.dropzoneActive : {}) }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files) }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={e => handleFileSelect(e.target.files)}
            />
            <div style={styles.dropzoneIconWrapper}>
              <span style={styles.dropzoneIcon}>↑</span>
            </div>
            <span style={styles.dropzoneText}>クリックまたはドラッグ＆ドロップ</span>
            <span style={styles.dropzoneSubText}>JPG · PNG · GIF（最大5枚）</span>
          </div>
          {errors.images && <span style={styles.error}>{errors.images}</span>}

          {images.length > 0 && (
            <div style={styles.imageGrid}>
              {images.map((img, i) => (
                <div key={i} style={styles.imageItem}>
                  {i === 0 && <span style={styles.mainBadge}>MAIN</span>}
                  <img src={img.url} alt="" style={styles.previewImg} />
                  <button type="button" onClick={() => removeImage(i)} style={styles.removeBtn}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <div style={styles.section}>
          <div style={styles.labelRow}>
            <label style={styles.sectionTitle}>商品名</label>
            <span style={styles.required}>必須</span>
          </div>
          <input
            type="text"
            value={form.title}
            onChange={e => handleChange('title', e.target.value)}
            placeholder="例：ブログ記事自動生成AI（月100記事対応）"
            style={{ ...styles.input, ...(errors.title ? styles.inputError : {}) }}
          />
          {errors.title && <span style={styles.error}>{errors.title}</span>}
        </div>

        {/* Category & Price */}
        <div style={styles.row}>
          <div style={{ ...styles.section, flex: 1 }}>
            <div style={styles.labelRow}>
              <label style={styles.sectionTitle}>カテゴリ</label>
              <span style={styles.required}>必須</span>
            </div>
            <select
              value={form.category}
              onChange={e => handleChange('category', e.target.value)}
              style={{ ...styles.input, ...(errors.category ? styles.inputError : {}) }}
            >
              <option value="">選択してください</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            {errors.category && <span style={styles.error}>{errors.category}</span>}
          </div>

          <div style={{ ...styles.section, flex: 1 }}>
            <div style={styles.labelRow}>
              <label style={styles.sectionTitle}>価格（円）</label>
              <span style={styles.required}>必須</span>
            </div>
            <div style={styles.priceWrapper}>
              <span style={styles.pricePrefix}>¥</span>
              <input
                type="number"
                value={form.price}
                onChange={e => handleChange('price', e.target.value)}
                placeholder="0"
                min="1"
                style={{ ...styles.input, ...styles.priceInput, ...(errors.price ? styles.inputError : {}) }}
              />
            </div>
            {errors.price && <span style={styles.error}>{errors.price}</span>}
          </div>
        </div>

        {/* Description */}
        <div style={styles.section}>
          <div style={styles.labelRow}>
            <label style={styles.sectionTitle}>商品の説明</label>
            <span style={styles.required}>必須</span>
            <span style={styles.charCountBadge}>{form.description.length}文字</span>
          </div>
          <textarea
            value={form.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="商品の機能・使い方・動作環境など詳しく記載してください"
            rows={10}
            style={{ ...styles.textarea, ...(errors.description ? styles.inputError : {}) }}
          />
          {errors.description && <span style={styles.error}>{errors.description}</span>}
        </div>

        {/* Tags */}
        <div style={styles.section}>
          <div style={styles.labelRow}>
            <label style={styles.sectionTitle}>タグ</label>
            <span style={styles.optional}>任意</span>
          </div>
          <input
            type="text"
            value={form.tags}
            onChange={e => handleChange('tags', e.target.value)}
            placeholder="カンマ区切り　例：自動化, SEO, ブログ"
            style={styles.input}
          />
        </div>

        {/* Delivery */}
        <div style={styles.section}>
          <div style={styles.labelRow}>
            <label style={styles.sectionTitle}>納品予定日数</label>
            <span style={styles.required}>必須</span>
          </div>
          <div style={styles.deliveryGrid}>
            {['1', '2', '3', '5', '7', '14'].map(day => (
              <button
                key={day}
                type="button"
                onClick={() => handleChange('deliveryDays', day)}
                style={{ ...styles.deliveryBtn, ...(form.deliveryDays === day ? styles.deliveryBtnActive : {}) }}
              >
                {day}日以内
              </button>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div style={styles.section}>
          <div style={styles.labelRow}>
            <label style={styles.sectionTitle}>受付可能な支払い方法</label>
            <span style={styles.required}>必須</span>
          </div>
          <div style={styles.paymentGrid}>
            {PAYMENT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => togglePayment(opt.id)}
                style={{ ...styles.paymentBtn, ...(form.paymentMethods.includes(opt.id) ? styles.paymentBtnActive : {}) }}
              >
                <span style={styles.payBtnIcon}>{opt.icon}</span>
                <span>{opt.label}</span>
                {form.paymentMethods.includes(opt.id) && <span style={styles.checkmark}>✓</span>}
              </button>
            ))}
          </div>
          {errors.paymentMethods && <span style={styles.error}>{errors.paymentMethods}</span>}
        </div>

        {/* Submit */}
        {submitError && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 13 }}>
            {submitError}
          </div>
        )}
        <button type="submit" style={{ ...styles.submitBtn, opacity: submitting ? 0.7 : 1 }} disabled={submitting}>
          {submitting ? '出品中...' : '出品して一覧に追加する →'}
        </button>
      </form>
    </div>
  )
}

const styles = {
  container: { maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px' },
  headerSection: { marginBottom: 36 },
  headerBadge: {
    display: 'inline-block', padding: '5px 14px', borderRadius: 20,
    border: '1px solid rgba(139,92,246,0.4)', color: '#8b5cf6', fontSize: 11,
    fontWeight: 700, letterSpacing: '0.08em', marginBottom: 14,
    background: 'rgba(139,92,246,0.07)',
  },
  pageTitle: { fontSize: 30, fontWeight: 800, color: '#f1f5f9', marginBottom: 8, letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: 14, color: '#64748b' },
  form: { display: 'flex', flexDirection: 'column', gap: 28 },
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: { display: 'flex', gap: 16 },
  labelRow: { display: 'flex', alignItems: 'center', gap: 7 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.03em' },
  required: {
    fontSize: 10, backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171',
    padding: '2px 7px', borderRadius: 4, fontWeight: 700, border: '1px solid rgba(239,68,68,0.2)',
  },
  optional: {
    fontSize: 10, backgroundColor: 'rgba(100,116,139,0.1)', color: '#64748b',
    padding: '2px 7px', borderRadius: 4, fontWeight: 600,
  },
  hint: { fontSize: 11, color: '#334155', marginLeft: 'auto' },
  charCountBadge: { marginLeft: 'auto', fontSize: 11, color: '#334155' },
  input: {
    padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(139,92,246,0.15)',
    fontSize: 14, outline: 'none', backgroundColor: 'rgba(14,14,32,0.8)',
    color: '#e2e8f0', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box',
  },
  inputError: { borderColor: 'rgba(239,68,68,0.4)' },
  textarea: {
    padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(139,92,246,0.15)',
    fontSize: 14, outline: 'none', backgroundColor: 'rgba(14,14,32,0.8)',
    color: '#e2e8f0', resize: 'vertical', lineHeight: 1.8, width: '100%', boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  error: { fontSize: 12, color: '#f87171', fontWeight: 500 },
  priceWrapper: { position: 'relative' },
  pricePrefix: {
    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
    fontSize: 15, fontWeight: 700, color: '#64748b', pointerEvents: 'none', zIndex: 1,
  },
  priceInput: { paddingLeft: 30 },
  dropzone: {
    border: '1px dashed rgba(139,92,246,0.3)', borderRadius: 12, padding: '32px 20px',
    textAlign: 'center', cursor: 'pointer', backgroundColor: 'rgba(139,92,246,0.03)',
    transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
  },
  dropzoneActive: { borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.08)', boxShadow: '0 0 20px rgba(139,92,246,0.15)' },
  dropzoneIconWrapper: {
    width: 44, height: 44, borderRadius: '50%', background: 'rgba(139,92,246,0.1)',
    border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 20, color: '#8b5cf6', marginBottom: 4,
  },
  dropzoneIcon: { fontWeight: 300 },
  dropzoneText: { fontSize: 14, fontWeight: 600, color: '#94a3b8' },
  dropzoneSubText: { fontSize: 12, color: '#475569' },
  imageGrid: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  imageItem: {
    position: 'relative', width: 96, height: 72, borderRadius: 8,
    overflow: 'hidden', border: '1px solid rgba(139,92,246,0.2)',
  },
  mainBadge: {
    position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(139,92,246,0.8)',
    color: '#fff', fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 3,
    zIndex: 1, letterSpacing: '0.05em',
  },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover' },
  removeBtn: {
    position: 'absolute', top: 3, right: 3, width: 18, height: 18,
    backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%',
    fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  deliveryGrid: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  deliveryBtn: {
    padding: '9px 16px', borderRadius: 8, border: '1px solid rgba(139,92,246,0.15)',
    backgroundColor: 'transparent', fontSize: 13, fontWeight: 500, color: '#64748b',
    cursor: 'pointer', transition: 'all 0.15s',
  },
  deliveryBtnActive: {
    borderColor: 'rgba(139,92,246,0.6)', backgroundColor: 'rgba(139,92,246,0.1)',
    color: '#a78bfa', fontWeight: 700, boxShadow: '0 0 10px rgba(139,92,246,0.15)',
  },
  paymentGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  paymentBtn: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 10,
    border: '1px solid rgba(139,92,246,0.12)', backgroundColor: 'rgba(255,255,255,0.02)',
    fontSize: 12, fontWeight: 500, color: '#64748b', cursor: 'pointer', transition: 'all 0.15s',
    position: 'relative',
  },
  paymentBtnActive: { borderColor: 'rgba(139,92,246,0.5)', backgroundColor: 'rgba(139,92,246,0.08)', color: '#a78bfa', fontWeight: 700 },
  payBtnIcon: { fontSize: 16 },
  checkmark: { marginLeft: 'auto', color: '#8b5cf6', fontWeight: 800, fontSize: 13 },
  submitBtn: {
    width: '100%', padding: '16px', background: 'linear-gradient(135deg, #7c3aed, #0891b2)',
    color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700,
    cursor: 'pointer', boxShadow: '0 0 24px rgba(139,92,246,0.35)',
    letterSpacing: '0.03em', transition: 'opacity 0.2s', marginTop: 4,
  },
}
