import { useState, useRef, useEffect } from 'react'
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

const ACCOUNT_TYPES = ['普通', '当座']

export default function SellerPage() {
  const navigate = useNavigate()
  const { refreshProducts } = useProducts()
  const { user, profile } = useAuth()
  const fileInputRef = useRef(null)

  // ── 銀行口座 ──
  const [bank, setBank] = useState({ bank_name: '', bank_branch: '', account_type: '普通', account_number: '', account_holder: '' })
  const [bankEditing, setBankEditing] = useState(false)
  const [bankSaving, setBankSaving] = useState(false)
  const [bankToast, setBankToast] = useState(null)
  const [bankErrors, setBankErrors] = useState({})
  const [bankLoaded, setBankLoaded] = useState(false)

  useEffect(() => {
    if (profile && !bankLoaded) {
      setBank({
        bank_name:    profile.bank_name    || '',
        bank_branch:  profile.bank_branch  || '',
        account_type: profile.account_type || '普通',
        account_number: profile.account_number || '',
        account_holder: profile.account_holder || '',
      })
      setBankLoaded(true)
      if (!profile.bank_name) setBankEditing(true)
    }
  }, [profile, bankLoaded])

  const showBankToast = (msg, type = 'success') => {
    setBankToast({ msg, type })
    setTimeout(() => setBankToast(null), 3000)
  }

  const validateBank = () => {
    const e = {}
    if (!bank.bank_name.trim())    e.bank_name    = '銀行名を入力してください'
    if (!bank.bank_branch.trim())  e.bank_branch  = '支店名を入力してください'
    if (!bank.account_number.trim() || !/^\d{7}$/.test(bank.account_number.trim()))
      e.account_number = '口座番号は7桁の数字で入力してください'
    if (!bank.account_holder.trim()) e.account_holder = '口座名義（カナ）を入力してください'
    return e
  }

  const saveBank = async () => {
    const errs = validateBank()
    if (Object.keys(errs).length > 0) { setBankErrors(errs); return }
    setBankSaving(true)
    const { error } = await supabase.from('profiles').update({
      bank_name:      bank.bank_name.trim(),
      bank_branch:    bank.bank_branch.trim(),
      account_type:   bank.account_type,
      account_number: bank.account_number.trim(),
      account_holder: bank.account_holder.trim(),
    }).eq('id', user.id)
    setBankSaving(false)
    if (error) { showBankToast('保存に失敗しました', 'error'); return }
    setBankEditing(false)
    setBankErrors({})
    showBankToast('口座情報を保存しました')
  }

  const cancelBank = () => {
    if (profile) {
      setBank({
        bank_name:    profile.bank_name    || '',
        bank_branch:  profile.bank_branch  || '',
        account_type: profile.account_type || '普通',
        account_number: profile.account_number || '',
        account_holder: profile.account_holder || '',
      })
    }
    setBankErrors({})
    setBankEditing(false)
  }

  // ── 出品フォーム ──
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
      {bankToast && (
        <div style={{ ...styles.bankToast, ...(bankToast.type === 'error' ? styles.bankToastError : {}) }}>
          {bankToast.type === 'error' ? '⛔ ' : '✓ '}{bankToast.msg}
        </div>
      )}

      <div style={styles.headerSection}>
        <div style={styles.headerBadge}>⬡ 新規出品</div>
        <h1 style={styles.pageTitle}>AIツールを出品する</h1>
        <p style={styles.pageSubtitle}>あなたが作ったAIツールを世界に届けよう</p>
      </div>

      {/* ── 銀行口座カード ── */}
      <div style={styles.bankCard}>
        <div style={styles.bankCardHeader}>
          <div style={styles.bankCardTitle}>
            <span style={styles.bankIcon}>🏦</span>
            <div>
              <div style={styles.bankTitleText}>売上の振込先口座</div>
              <div style={styles.bankTitleSub}>売上が発生した際にこの口座へ送金します</div>
            </div>
          </div>
          {!bankEditing && bank.bank_name && (
            <button type="button" onClick={() => setBankEditing(true)} style={styles.bankEditBtn}>編集</button>
          )}
        </div>

        {!bankEditing ? (
          bank.bank_name ? (
            <div style={styles.bankDisplay}>
              <div style={styles.bankDisplayRow}>
                <span style={styles.bankDisplayLabel}>銀行名</span>
                <span style={styles.bankDisplayVal}>{bank.bank_name}　{bank.bank_branch}支店</span>
              </div>
              <div style={styles.bankDisplayRow}>
                <span style={styles.bankDisplayLabel}>口座種別</span>
                <span style={styles.bankDisplayVal}>{bank.account_type}</span>
              </div>
              <div style={styles.bankDisplayRow}>
                <span style={styles.bankDisplayLabel}>口座番号</span>
                <span style={styles.bankDisplayVal}>{'*'.repeat(4)}{bank.account_number.slice(-3)}</span>
              </div>
              <div style={styles.bankDisplayRow}>
                <span style={styles.bankDisplayLabel}>名義（カナ）</span>
                <span style={styles.bankDisplayVal}>{bank.account_holder}</span>
              </div>
            </div>
          ) : (
            <div style={styles.bankEmpty}>
              <p style={styles.bankEmptyText}>まだ振込先口座が登録されていません</p>
              <button type="button" onClick={() => setBankEditing(true)} style={styles.bankRegisterBtn}>口座を登録する</button>
            </div>
          )
        ) : (
          <div style={styles.bankForm}>
            <div style={styles.bankRow}>
              <div style={styles.bankField}>
                <label style={styles.bankLabel}>銀行名 <span style={styles.required}>必須</span></label>
                <input
                  type="text"
                  value={bank.bank_name}
                  onChange={e => { setBank(p => ({ ...p, bank_name: e.target.value })); setBankErrors(p => ({ ...p, bank_name: '' })) }}
                  placeholder="例：三菱UFJ銀行"
                  style={{ ...styles.input, ...(bankErrors.bank_name ? styles.inputError : {}) }}
                />
                {bankErrors.bank_name && <span style={styles.error}>{bankErrors.bank_name}</span>}
              </div>
              <div style={styles.bankField}>
                <label style={styles.bankLabel}>支店名 <span style={styles.required}>必須</span></label>
                <input
                  type="text"
                  value={bank.bank_branch}
                  onChange={e => { setBank(p => ({ ...p, bank_branch: e.target.value })); setBankErrors(p => ({ ...p, bank_branch: '' })) }}
                  placeholder="例：渋谷支店"
                  style={{ ...styles.input, ...(bankErrors.bank_branch ? styles.inputError : {}) }}
                />
                {bankErrors.bank_branch && <span style={styles.error}>{bankErrors.bank_branch}</span>}
              </div>
            </div>

            <div style={styles.bankRow}>
              <div style={{ ...styles.bankField, maxWidth: 140 }}>
                <label style={styles.bankLabel}>口座種別</label>
                <select
                  value={bank.account_type}
                  onChange={e => setBank(p => ({ ...p, account_type: e.target.value }))}
                  style={styles.input}
                >
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={styles.bankField}>
                <label style={styles.bankLabel}>口座番号（7桁）<span style={styles.required}>必須</span></label>
                <input
                  type="text"
                  value={bank.account_number}
                  onChange={e => { setBank(p => ({ ...p, account_number: e.target.value.replace(/\D/g, '').slice(0, 7) })); setBankErrors(p => ({ ...p, account_number: '' })) }}
                  placeholder="1234567"
                  maxLength={7}
                  inputMode="numeric"
                  style={{ ...styles.input, ...(bankErrors.account_number ? styles.inputError : {}), letterSpacing: '0.15em' }}
                />
                {bankErrors.account_number && <span style={styles.error}>{bankErrors.account_number}</span>}
              </div>
            </div>

            <div style={styles.bankField}>
              <label style={styles.bankLabel}>口座名義（カナ） <span style={styles.required}>必須</span></label>
              <input
                type="text"
                value={bank.account_holder}
                onChange={e => { setBank(p => ({ ...p, account_holder: e.target.value })); setBankErrors(p => ({ ...p, account_holder: '' })) }}
                placeholder="例：ヤマダ タロウ"
                style={{ ...styles.input, ...(bankErrors.account_holder ? styles.inputError : {}) }}
              />
              {bankErrors.account_holder && <span style={styles.error}>{bankErrors.account_holder}</span>}
            </div>

            <div style={styles.bankNote}>
              ⚠ 口座番号・名義は正確に入力してください。誤った情報による振込ミスは対応できません。
            </div>

            <div style={styles.bankActions}>
              <button type="button" onClick={saveBank} disabled={bankSaving} style={{ ...styles.bankSaveBtn, opacity: bankSaving ? 0.7 : 1 }}>
                {bankSaving ? '保存中...' : '保存する'}
              </button>
              {bank.bank_name && (
                <button type="button" onClick={cancelBank} style={styles.bankCancelBtn}>キャンセル</button>
              )}
            </div>
          </div>
        )}
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
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(232,84,47,0.06)', border: '1px solid rgba(232,84,47,0.3)', color: '#E8542F', fontSize: 13 }}>
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
  bankToast: { position: 'fixed', top: 24, right: 24, zIndex: 999, padding: '12px 20px', borderRadius: 10, background: 'rgba(36,56,166,0.08)', border: '1px solid rgba(36,56,166,0.25)', color: '#2438A6', fontSize: 13, fontWeight: 600 },
  bankToastError: { background: 'rgba(232,84,47,0.08)', border: '1px solid rgba(232,84,47,0.25)', color: '#E8542F' },
  bankCard: { background: '#fff', border: '1px solid #D8DCE9', borderRadius: 16, padding: '22px 24px', marginBottom: 32 },
  bankCardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  bankCardTitle: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  bankIcon: { fontSize: 22, lineHeight: 1, marginTop: 2 },
  bankTitleText: { fontSize: 14, fontWeight: 700, color: '#101B3E', marginBottom: 3 },
  bankTitleSub: { fontSize: 12, color: '#8A90A8' },
  bankEditBtn: { padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#2438A6', background: 'rgba(36,56,166,0.07)', border: '1px solid rgba(36,56,166,0.2)', cursor: 'pointer', flexShrink: 0 },
  bankDisplay: { display: 'flex', flexDirection: 'column', gap: 8, background: '#F6F7F4', borderRadius: 10, padding: '14px 16px' },
  bankDisplayRow: { display: 'flex', gap: 12, fontSize: 13 },
  bankDisplayLabel: { color: '#8A90A8', width: 100, flexShrink: 0 },
  bankDisplayVal: { color: '#101B3E', fontWeight: 600 },
  bankEmpty: { textAlign: 'center', padding: '20px 0 4px' },
  bankEmptyText: { fontSize: 13, color: '#8A90A8', marginBottom: 14 },
  bankRegisterBtn: { padding: '10px 24px', borderRadius: 9, fontSize: 13, fontWeight: 700, color: '#fff', background: '#2438A6', border: 'none', cursor: 'pointer' },
  bankForm: { display: 'flex', flexDirection: 'column', gap: 14 },
  bankRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  bankField: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 140 },
  bankLabel: { fontSize: 12, fontWeight: 600, color: '#5A6180', display: 'flex', alignItems: 'center', gap: 6 },
  bankNote: { fontSize: 11, color: '#d97706', background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.18)', borderRadius: 8, padding: '9px 12px', lineHeight: 1.6 },
  bankActions: { display: 'flex', gap: 10, paddingTop: 4 },
  bankSaveBtn: { padding: '10px 24px', borderRadius: 9, fontSize: 13, fontWeight: 700, color: '#fff', background: '#2438A6', border: 'none', cursor: 'pointer' },
  bankCancelBtn: { padding: '10px 20px', borderRadius: 9, fontSize: 13, color: '#5A6180', background: 'transparent', border: '1px solid #D8DCE9', cursor: 'pointer' },
  headerSection: { marginBottom: 36 },
  headerBadge: {
    display: 'inline-block', padding: '5px 14px', borderRadius: 20,
    border: '1px solid #D8DCE9', color: '#5A6180', fontSize: 11,
    fontWeight: 700, letterSpacing: '0.08em', marginBottom: 14,
    background: '#fff',
  },
  pageTitle: { fontSize: 30, fontWeight: 800, color: '#101B3E', marginBottom: 8, letterSpacing: '-0.5px', fontFamily: "'Sora', sans-serif" },
  pageSubtitle: { fontSize: 14, color: '#5A6180' },
  form: { display: 'flex', flexDirection: 'column', gap: 28 },
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: { display: 'flex', gap: 16 },
  labelRow: { display: 'flex', alignItems: 'center', gap: 7 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#5A6180', letterSpacing: '0.03em' },
  required: {
    fontSize: 10, backgroundColor: 'rgba(232,84,47,0.08)', color: '#E8542F',
    padding: '2px 7px', borderRadius: 4, fontWeight: 700, border: '1px solid rgba(232,84,47,0.25)',
  },
  optional: {
    fontSize: 10, backgroundColor: '#F6F7F4', color: '#8A90A8',
    padding: '2px 7px', borderRadius: 4, fontWeight: 600,
  },
  hint: { fontSize: 11, color: '#8A90A8', marginLeft: 'auto' },
  charCountBadge: { marginLeft: 'auto', fontSize: 11, color: '#8A90A8' },
  input: {
    padding: '12px 14px', borderRadius: 10, border: '1px solid #D8DCE9',
    fontSize: 14, outline: 'none', backgroundColor: '#F6F7F4',
    color: '#101B3E', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box',
  },
  inputError: { borderColor: 'rgba(232,84,47,0.5)' },
  textarea: {
    padding: '12px 14px', borderRadius: 10, border: '1px solid #D8DCE9',
    fontSize: 14, outline: 'none', backgroundColor: '#F6F7F4',
    color: '#101B3E', resize: 'vertical', lineHeight: 1.8, width: '100%', boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  error: { fontSize: 12, color: '#E8542F', fontWeight: 500 },
  priceWrapper: { position: 'relative' },
  pricePrefix: {
    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
    fontSize: 15, fontWeight: 700, color: '#5A6180', pointerEvents: 'none', zIndex: 1,
  },
  priceInput: { paddingLeft: 30 },
  dropzone: {
    border: '1px dashed #D8DCE9', borderRadius: 12, padding: '32px 20px',
    textAlign: 'center', cursor: 'pointer', backgroundColor: '#F6F7F4',
    transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
  },
  dropzoneActive: { borderColor: '#2438A6', backgroundColor: 'rgba(36,56,166,0.04)' },
  dropzoneIconWrapper: {
    width: 44, height: 44, borderRadius: '50%', background: 'rgba(36,56,166,0.08)',
    border: '1px solid rgba(36,56,166,0.2)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 20, color: '#2438A6', marginBottom: 4,
  },
  dropzoneIcon: { fontWeight: 300 },
  dropzoneText: { fontSize: 14, fontWeight: 600, color: '#5A6180' },
  dropzoneSubText: { fontSize: 12, color: '#8A90A8' },
  imageGrid: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  imageItem: {
    position: 'relative', width: 96, height: 72, borderRadius: 8,
    overflow: 'hidden', border: '1px solid #D8DCE9',
  },
  mainBadge: {
    position: 'absolute', bottom: 4, left: 4, backgroundColor: '#2438A6',
    color: '#fff', fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 3,
    zIndex: 1, letterSpacing: '0.05em',
  },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover' },
  removeBtn: {
    position: 'absolute', top: 3, right: 3, width: 18, height: 18,
    backgroundColor: 'rgba(16,27,62,0.6)', color: '#fff', border: 'none', borderRadius: '50%',
    fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  deliveryGrid: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  deliveryBtn: {
    padding: '9px 16px', borderRadius: 8, border: '1px solid #D8DCE9',
    backgroundColor: '#fff', fontSize: 13, fontWeight: 500, color: '#5A6180',
    cursor: 'pointer', transition: 'all 0.15s',
  },
  deliveryBtnActive: {
    borderColor: '#2438A6', backgroundColor: 'rgba(36,56,166,0.08)',
    color: '#2438A6', fontWeight: 700,
  },
  paymentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 },
  paymentBtn: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 10,
    border: '1px solid #D8DCE9', backgroundColor: '#fff',
    fontSize: 12, fontWeight: 500, color: '#5A6180', cursor: 'pointer', transition: 'all 0.15s',
    position: 'relative',
  },
  paymentBtnActive: { borderColor: '#2438A6', backgroundColor: 'rgba(36,56,166,0.06)', color: '#2438A6', fontWeight: 700 },
  payBtnIcon: { fontSize: 16 },
  checkmark: { marginLeft: 'auto', color: '#2438A6', fontWeight: 800, fontSize: 13 },
  submitBtn: {
    width: '100%', padding: '16px', background: '#2438A6',
    color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700,
    cursor: 'pointer', letterSpacing: '0.03em', transition: 'opacity 0.2s', marginTop: 4,
  },
}
