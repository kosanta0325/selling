import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

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
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

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

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={styles.successContainer}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✅</div>
          <h2 style={styles.successTitle}>出品が完了しました！</h2>
          <p style={styles.successDesc}>「{form.title}」を出品しました。審査後に公開されます。</p>
          <div style={styles.successButtons}>
            <button onClick={() => navigate('/')} style={styles.successBtn}>商品一覧を見る</button>
            <button onClick={() => { setSubmitted(false); setForm({ title: '', category: '', price: '', description: '', deliveryDays: '1', paymentMethods: [], tags: '' }); setImages([]) }} style={styles.successBtnSecondary}>
              続けて出品する
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>AIツールを出品する</h1>
        <p style={styles.pageSubtitle}>あなたが作ったAIツールを販売しましょう</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Images */}
        <div style={styles.section}>
          <label style={styles.sectionTitle}>
            商品画像 <span style={styles.required}>必須</span>
            <span style={styles.hint}>最大5枚・JPG/PNG/GIF対応</span>
          </label>

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
            <span style={styles.dropzoneIcon}>📷</span>
            <span style={styles.dropzoneText}>クリックまたはドラッグ＆ドロップで画像を追加</span>
            <span style={styles.dropzoneSubText}>JPG / PNG / GIF（最大5枚）</span>
          </div>

          {errors.images && <span style={styles.error}>{errors.images}</span>}

          {images.length > 0 && (
            <div style={styles.imagePreviewGrid}>
              {images.map((img, i) => (
                <div key={i} style={styles.imagePreviewItem}>
                  {i === 0 && <span style={styles.mainBadge}>メイン</span>}
                  <img src={img.url} alt={img.name} style={styles.previewImg} />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    style={styles.removeImageBtn}
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <div style={styles.section}>
          <label style={styles.sectionTitle}>
            商品名 <span style={styles.required}>必須</span>
          </label>
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
            <label style={styles.sectionTitle}>
              カテゴリ <span style={styles.required}>必須</span>
            </label>
            <select
              value={form.category}
              onChange={e => handleChange('category', e.target.value)}
              style={{ ...styles.input, ...(errors.category ? styles.inputError : {}) }}
            >
              <option value="">選択してください</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <span style={styles.error}>{errors.category}</span>}
          </div>

          <div style={{ ...styles.section, flex: 1 }}>
            <label style={styles.sectionTitle}>
              価格（円） <span style={styles.required}>必須</span>
            </label>
            <div style={styles.priceInputWrapper}>
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
          <label style={styles.sectionTitle}>
            商品の説明 <span style={styles.required}>必須</span>
          </label>
          <textarea
            value={form.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="商品の機能・使い方・動作環境など詳しく記載してください&#10;&#10;例：&#10;【機能】&#10;- XXX&#10;- YYY&#10;&#10;【対応環境】&#10;Windows / Mac"
            rows={10}
            style={{ ...styles.textarea, ...(errors.description ? styles.inputError : {}) }}
          />
          <div style={styles.charCount}>{form.description.length}文字</div>
          {errors.description && <span style={styles.error}>{errors.description}</span>}
        </div>

        {/* Tags */}
        <div style={styles.section}>
          <label style={styles.sectionTitle}>
            タグ <span style={styles.optional}>任意</span>
          </label>
          <input
            type="text"
            value={form.tags}
            onChange={e => handleChange('tags', e.target.value)}
            placeholder="カンマ区切りで入力　例：自動化, SEO, ブログ"
            style={styles.input}
          />
          <span style={styles.hintText}>タグを付けると検索されやすくなります</span>
        </div>

        {/* Delivery */}
        <div style={styles.section}>
          <label style={styles.sectionTitle}>
            納品予定日数 <span style={styles.required}>必須</span>
          </label>
          <div style={styles.deliveryOptions}>
            {['1', '2', '3', '5', '7', '14'].map(day => (
              <button
                key={day}
                type="button"
                onClick={() => handleChange('deliveryDays', day)}
                style={{
                  ...styles.deliveryBtn,
                  ...(form.deliveryDays === day ? styles.deliveryBtnActive : {}),
                }}
              >
                {day}日以内
              </button>
            ))}
          </div>
          <span style={styles.hintText}>購入後、何日以内に納品できますか？</span>
        </div>

        {/* Payment Methods */}
        <div style={styles.section}>
          <label style={styles.sectionTitle}>
            受付可能な支払い方法 <span style={styles.required}>必須</span>
          </label>
          <div style={styles.paymentGrid}>
            {PAYMENT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => togglePayment(opt.id)}
                style={{
                  ...styles.paymentBtn,
                  ...(form.paymentMethods.includes(opt.id) ? styles.paymentBtnActive : {}),
                }}
              >
                <span style={styles.paymentBtnIcon}>{opt.icon}</span>
                {opt.label}
                {form.paymentMethods.includes(opt.id) && (
                  <span style={styles.checkmark}>✓</span>
                )}
              </button>
            ))}
          </div>
          {errors.paymentMethods && <span style={styles.error}>{errors.paymentMethods}</span>}
        </div>

        {/* Submit */}
        <div style={styles.submitSection}>
          <button type="submit" style={styles.submitBtn}>
            出品する
          </button>
          <p style={styles.submitNote}>
            出品後、運営が内容を確認してから公開されます（通常1〜2営業日）
          </p>
        </div>
      </form>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '32px 20px 80px',
  },
  header: {
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: '#111',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#888',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  row: {
    display: 'flex',
    gap: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  required: {
    fontSize: 11,
    backgroundColor: '#ff4757',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: 4,
    fontWeight: 600,
  },
  optional: {
    fontSize: 11,
    backgroundColor: '#e0e0e0',
    color: '#777',
    padding: '2px 6px',
    borderRadius: 4,
    fontWeight: 600,
  },
  hint: {
    fontSize: 11,
    color: '#aaa',
    fontWeight: 400,
    marginLeft: 'auto',
  },
  hintText: {
    fontSize: 12,
    color: '#aaa',
  },
  input: {
    padding: '12px 14px',
    borderRadius: 10,
    border: '1.5px solid #e0e0e0',
    fontSize: 14,
    outline: 'none',
    backgroundColor: '#fff',
    transition: 'border-color 0.15s',
    width: '100%',
  },
  inputError: {
    borderColor: '#ff4757',
  },
  textarea: {
    padding: '12px 14px',
    borderRadius: 10,
    border: '1.5px solid #e0e0e0',
    fontSize: 14,
    outline: 'none',
    backgroundColor: '#fff',
    resize: 'vertical',
    lineHeight: 1.7,
    width: '100%',
  },
  charCount: {
    fontSize: 12,
    color: '#bbb',
    textAlign: 'right',
    marginTop: -4,
  },
  error: {
    fontSize: 12,
    color: '#ff4757',
    fontWeight: 500,
  },
  priceInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  pricePrefix: {
    position: 'absolute',
    left: 14,
    fontSize: 16,
    fontWeight: 700,
    color: '#555',
    pointerEvents: 'none',
  },
  priceInput: {
    paddingLeft: 30,
  },
  dropzone: {
    border: '2px dashed #d0c4ff',
    borderRadius: 12,
    padding: '32px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: '#faf8ff',
    transition: 'all 0.15s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  dropzoneActive: {
    borderColor: '#6c47ff',
    backgroundColor: '#f0ebff',
  },
  dropzoneIcon: {
    fontSize: 32,
  },
  dropzoneText: {
    fontSize: 14,
    fontWeight: 600,
    color: '#555',
  },
  dropzoneSubText: {
    fontSize: 12,
    color: '#aaa',
  },
  imagePreviewGrid: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  imagePreviewItem: {
    position: 'relative',
    width: 100,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    border: '1.5px solid #e0e0e0',
  },
  mainBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(108,71,255,0.85)',
    color: '#fff',
    fontSize: 9,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 4,
    zIndex: 1,
  },
  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 20,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  deliveryOptions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  deliveryBtn: {
    padding: '9px 18px',
    borderRadius: 10,
    border: '1.5px solid #e0e0e0',
    backgroundColor: '#fff',
    fontSize: 13,
    fontWeight: 500,
    color: '#555',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  deliveryBtnActive: {
    borderColor: '#6c47ff',
    backgroundColor: '#f0ebff',
    color: '#6c47ff',
    fontWeight: 700,
  },
  paymentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
  },
  paymentBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 14px',
    borderRadius: 10,
    border: '1.5px solid #e0e0e0',
    backgroundColor: '#fff',
    fontSize: 13,
    fontWeight: 500,
    color: '#555',
    cursor: 'pointer',
    transition: 'all 0.15s',
    position: 'relative',
  },
  paymentBtnActive: {
    borderColor: '#6c47ff',
    backgroundColor: '#f0ebff',
    color: '#6c47ff',
    fontWeight: 700,
  },
  paymentBtnIcon: {
    fontSize: 18,
  },
  checkmark: {
    marginLeft: 'auto',
    color: '#6c47ff',
    fontWeight: 800,
    fontSize: 14,
  },
  submitSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#6c47ff',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(108,71,255,0.35)',
    transition: 'opacity 0.15s',
  },
  submitNote: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
  },
  successContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 60px)',
    padding: 20,
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: '48px 40px',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    maxWidth: 440,
    width: '100%',
  },
  successIcon: {
    fontSize: 56,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: '#111',
    marginBottom: 12,
  },
  successDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 1.7,
    marginBottom: 28,
  },
  successButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  successBtn: {
    padding: '14px',
    backgroundColor: '#6c47ff',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  successBtnSecondary: {
    padding: '14px',
    backgroundColor: '#f5f5f5',
    color: '#555',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
}
