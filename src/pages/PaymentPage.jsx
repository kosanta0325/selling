import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const cardStyle = {
  style: {
    base: {
      fontSize: '16px',
      color: '#e2e8f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      '::placeholder': { color: '#475569' },
    },
    invalid: { color: '#f87171' },
  },
}

function CheckoutForm({ product }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [succeeded, setSucceeded] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!stripe || !elements) return
    setProcessing(true)
    setError('')

    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: product.price, currency: 'jpy' }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'サーバーエラーが発生しました')
      }
      const { clientSecret } = await res.json()

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: { email: user?.email || '' },
        },
      })

      if (stripeError) {
        setError(stripeError.message)
        setProcessing(false)
        return
      }

      if (paymentIntent.status === 'succeeded') {
        if (user && product.sellerId) {
          await supabase.from('transactions').insert({
            seller_id: product.sellerId,
            buyer_id: user.id,
            amount: product.price,
            product_title: product.title,
            product_image: product.images?.[0] || null,
            status: 'pending',
            messages: [],
          })
        }
        setSucceeded(true)
      }
    } catch (err) {
      setError(err.message || '決済処理中にエラーが発生しました')
      setProcessing(false)
    }
  }

  if (succeeded) return (
    <div style={s.successBox}>
      <div style={s.successRing}>
        <div style={s.successIcon}>✓</div>
      </div>
      <h2 style={s.successTitle}>お支払い完了</h2>
      <p style={s.successText}>取引ページで配送状況を確認できます</p>
      <button onClick={() => navigate('/transactions')} style={s.successBtn}>取引を確認する →</button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      {/* Card number */}
      <div style={s.fieldGroup}>
        <label style={s.label}>カード番号</label>
        <div style={s.cardField}>
          <CardNumberElement options={cardStyle} />
        </div>
      </div>

      {/* Expiry + CVC */}
      <div style={s.twoCol}>
        <div style={s.fieldGroup}>
          <label style={s.label}>有効期限</label>
          <div style={s.cardField}>
            <CardExpiryElement options={cardStyle} />
          </div>
        </div>
        <div style={s.fieldGroup}>
          <label style={s.label}>セキュリティコード</label>
          <div style={s.cardField}>
            <CardCvcElement options={cardStyle} />
          </div>
        </div>
      </div>

      {error && (
        <div style={s.errorBox}>
          <span style={s.errorIcon}>⚠</span>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        style={{ ...s.payBtn, opacity: (!stripe || processing) ? 0.65 : 1, cursor: (!stripe || processing) ? 'not-allowed' : 'pointer' }}
      >
        {processing ? (
          <span style={s.spinnerWrap}><span style={s.spinner} />処理中...</span>
        ) : (
          `¥${product.price?.toLocaleString()} を支払う`
        )}
      </button>

      <div style={s.secureRow}>
        <span style={s.lockIcon}>🔒</span>
        <span>すべての決済はStripeによって安全に暗号化されています</span>
      </div>
    </form>
  )
}

export default function PaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const product = location.state?.product

  useEffect(() => {
    if (!product) navigate('/')
  }, [product])

  if (!product) return null

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* Back */}
        <button onClick={() => navigate(-1)} style={s.backBtn}>
          ← 戻る
        </button>

        {/* Product summary */}
        <div style={s.productCard}>
          {product.images?.[0] ? (
            <img src={product.images[0]} alt="" style={s.productImg} />
          ) : (
            <div style={s.productImgPlaceholder}>🤖</div>
          )}
          <div style={s.productInfo}>
            <div style={s.productCategory}>{product.category || 'AIツール'}</div>
            <div style={s.productTitle}>{product.title}</div>
            <div style={s.productSeller}>{product.seller && `販売者：${product.seller}`}</div>
          </div>
          <div style={s.productPriceCol}>
            <div style={s.productPriceLabel}>合計金額</div>
            <div style={s.productPrice}>¥{product.price?.toLocaleString()}</div>
          </div>
        </div>

        {/* Payment form */}
        <div style={s.formCard}>
          <div style={s.formHeader}>
            <span style={s.cardBrand}>💳</span>
            <h2 style={s.formTitle}>カード情報を入力</h2>
          </div>
          <Elements stripe={stripePromise}>
            <CheckoutForm product={product} />
          </Elements>
        </div>

      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #05050f 0%, #0d0d1f 60%, #05050f 100%)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 16px 80px',
  },
  container: {
    width: '100%',
    maxWidth: 520,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: 14,
    cursor: 'pointer',
    padding: '0 0 4px',
    alignSelf: 'flex-start',
    transition: 'color 0.15s',
  },

  /* Product card */
  productCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(139,92,246,0.18)',
    borderRadius: 16,
    padding: '16px 18px',
  },
  productImg: {
    width: 60,
    height: 48,
    objectFit: 'cover',
    borderRadius: 10,
    flexShrink: 0,
    border: '1px solid rgba(139,92,246,0.2)',
  },
  productImgPlaceholder: {
    width: 60,
    height: 48,
    borderRadius: 10,
    background: 'rgba(139,92,246,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    flexShrink: 0,
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
  },
  productCategory: {
    fontSize: 11,
    color: '#8b5cf6',
    fontWeight: 600,
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#e2e8f0',
    marginBottom: 3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  productSeller: {
    fontSize: 12,
    color: '#475569',
  },
  productPriceCol: {
    textAlign: 'right',
    flexShrink: 0,
  },
  productPriceLabel: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 3,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: 800,
    background: 'linear-gradient(90deg, #22d3ee, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },

  /* Form card */
  formCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(139,92,246,0.18)',
    borderRadius: 20,
    padding: '28px 24px',
  },
  formHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  cardBrand: { fontSize: 22 },
  formTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#e2e8f0',
    margin: 0,
  },

  /* Fields */
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 7 },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
    letterSpacing: '0.03em',
  },
  cardField: {
    padding: '13px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    transition: 'border-color 0.15s',
  },

  /* Error */
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 13,
    color: '#fca5a5',
    lineHeight: 1.5,
  },
  errorIcon: { flexShrink: 0, fontSize: 15, marginTop: 1 },

  /* Pay button */
  payBtn: {
    width: '100%',
    padding: '15px',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    background: 'linear-gradient(135deg, #7c3aed, #0891b2)',
    border: 'none',
    boxShadow: '0 4px 24px rgba(124,58,237,0.35)',
    transition: 'opacity 0.2s, transform 0.1s',
    marginTop: 4,
  },
  spinnerWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  spinner: {
    display: 'inline-block',
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },

  /* Secure note */
  secureRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontSize: 11,
    color: '#334155',
    marginTop: 4,
  },
  lockIcon: { fontSize: 13 },

  /* Success */
  successBox: {
    textAlign: 'center',
    padding: '16px 0 8px',
  },
  successRing: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: 'rgba(52,211,153,0.1)',
    border: '2px solid rgba(52,211,153,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    boxShadow: '0 0 24px rgba(52,211,153,0.15)',
  },
  successIcon: { fontSize: 30, color: '#34d399' },
  successTitle: { fontSize: 22, fontWeight: 800, color: '#e2e8f0', margin: '0 0 8px' },
  successText: { fontSize: 14, color: '#64748b', margin: '0 0 24px' },
  successBtn: {
    padding: '12px 32px',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    color: '#fff',
    background: 'linear-gradient(135deg, #7c3aed, #0891b2)',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
  },
}
