import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProducts } from '../context/ProductContext.jsx'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products } = useProducts()
  const product = products.find(p => p.id === id)
  const [currentImage, setCurrentImage] = useState(0)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  if (!product) {
    return (
      <div style={styles.notFound}>
        <p style={{ color: '#475569' }}>商品が見つかりませんでした</p>
        <button onClick={() => navigate('/')} style={styles.backBtnAlt}>一覧に戻る</button>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backLink}>
        ← 一覧に戻る
      </button>

      <div style={styles.layout}>
        {/* Images */}
        <div style={styles.imageSection}>
          <div style={styles.mainImageWrapper}>
            <img
              src={product.images[currentImage]}
              alt={product.title}
              style={styles.mainImage}
              onError={e => { e.target.src = 'https://via.placeholder.com/600x400?text=No+Image' }}
            />
            <div style={styles.imageOverlay} />
            <span style={styles.categoryBadge}>{product.category}</span>
          </div>
          {product.images.length > 1 && (
            <div style={styles.thumbnails}>
              {product.images.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  style={{ ...styles.thumbnailWrapper, ...(currentImage === i ? styles.thumbnailWrapperActive : {}) }}
                >
                  <img
                    src={img}
                    alt=""
                    style={styles.thumbnail}
                    onError={e => { e.target.src = 'https://via.placeholder.com/80x60' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={styles.infoSection}>
          <h1 style={styles.title}>{product.title}</h1>

          <div style={styles.ratingRow}>
            <span style={styles.stars}>{'★'.repeat(Math.round(product.rating))}</span>
            <span style={styles.ratingText}>{product.rating}</span>
            <span style={styles.ratingCount}>({product.reviewCount}件のレビュー)</span>
          </div>

          <div style={styles.priceBlock}>
            <span style={styles.price}>¥{product.price.toLocaleString()}</span>
            <span style={styles.priceSub}>税込</span>
          </div>

          <div style={styles.tags}>
            {product.tags.map(tag => (
              <span key={tag} style={styles.tag}>#{tag}</span>
            ))}
          </div>

          {/* Seller */}
          <div style={styles.sellerCard}>
            <div style={styles.sellerAvatar}>{product.sellerAvatar}</div>
            <div>
              <div style={styles.sellerLabel}>販売者</div>
              <div style={styles.sellerName}>{product.seller}</div>
            </div>
            <div style={styles.sellerVerified}>✓ 認証済み</div>
          </div>

          {/* Info items */}
          <div style={styles.infoCards}>
            <div style={styles.infoCard}>
              <div style={styles.infoCardIcon}>📦</div>
              <div>
                <div style={styles.infoLabel}>納品予定</div>
                <div style={styles.infoValue}>購入後 {product.deliveryDays}日以内</div>
              </div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoCardIcon}>💳</div>
              <div>
                <div style={styles.infoLabel}>支払方法</div>
                <div style={styles.infoValue}>{product.paymentMethods.join(' · ')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={styles.descSection}>
        <div style={styles.descHeader}>
          <span style={styles.descHeaderLine} />
          <h2 style={styles.descTitle}>商品の説明</h2>
          <span style={styles.descHeaderLine} />
        </div>
        <div style={styles.descText}>
          {product.description.split('\n').map((line, i) => (
            <p key={i} style={line === '' ? { marginBottom: 12 } : styles.descLine}>{line}</p>
          ))}
        </div>
      </div>

      {/* Sticky bar */}
      <div style={styles.stickyBar}>
        <div style={styles.stickyInner}>
          <div>
            <div style={styles.stickyLabel}>価格</div>
            <div style={styles.stickyPrice}>¥{product.price.toLocaleString()}</div>
          </div>
          <button style={styles.payButton} onClick={() => setShowPaymentModal(true)}>
            <span>支払いに進む</span>
            <span style={styles.payBtnArrow}>→</span>
          </button>
        </div>
      </div>

      {/* Modal */}
      {showPaymentModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalGlow} />
            <div style={styles.modalTop}>
              <h2 style={styles.modalTitle}>支払い方法を選択</h2>
              <button style={styles.modalCloseX} onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            <div style={styles.modalProductInfo}>
              <p style={styles.modalProductName}>{product.title}</p>
              <p style={styles.modalPrice}>¥{product.price.toLocaleString()}</p>
            </div>
            <div style={styles.paymentOptions}>
              {product.paymentMethods.map(method => (
                <button key={method} style={styles.paymentOption}>
                  <span style={styles.paymentIcon}>
                    {method === 'クレジットカード' ? '💳' :
                     method === 'PayPay' ? '📱' :
                     method === '銀行振込' ? '🏦' :
                     method === 'PayPal' ? '🌐' :
                     method === 'LINE Pay' ? '💚' : '💰'}
                  </span>
                  <span>{method}</span>
                  <span style={styles.paymentArrow}>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '28px 24px 120px',
  },
  notFound: {
    textAlign: 'center',
    padding: '80px 20px',
  },
  backBtnAlt: {
    marginTop: 16,
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: 14,
    cursor: 'pointer',
    padding: '0 0 24px',
    display: 'block',
    transition: 'color 0.2s',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 48,
    marginBottom: 40,
  },
  imageSection: {},
  mainImageWrapper: {
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0b0b1a',
    border: '1px solid rgba(139,92,246,0.15)',
    aspectRatio: '4/3',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'brightness(0.9)',
  },
  imageOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(5,5,15,0.6) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
  categoryBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(139,92,246,0.25)',
    color: '#a78bfa',
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    border: '1px solid rgba(139,92,246,0.3)',
    backdropFilter: 'blur(8px)',
  },
  thumbnails: {
    display: 'flex',
    gap: 8,
    marginTop: 10,
  },
  thumbnailWrapper: {
    width: 76,
    height: 58,
    borderRadius: 8,
    overflow: 'hidden',
    border: '2px solid rgba(139,92,246,0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    opacity: 0.6,
  },
  thumbnailWrapperActive: {
    borderColor: '#8b5cf6',
    opacity: 1,
    boxShadow: '0 0 10px rgba(139,92,246,0.4)',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    color: '#f1f5f9',
    lineHeight: 1.3,
    letterSpacing: '-0.5px',
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  stars: {
    color: '#f59e0b',
    fontSize: 14,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 700,
    color: '#94a3b8',
  },
  ratingCount: {
    fontSize: 13,
    color: '#475569',
  },
  priceBlock: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: 800,
    background: 'linear-gradient(90deg, #22d3ee, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  priceSub: {
    fontSize: 13,
    color: '#475569',
  },
  tags: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    fontSize: 12,
    color: '#64748b',
    backgroundColor: 'rgba(139,92,246,0.08)',
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid rgba(139,92,246,0.12)',
  },
  sellerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    backgroundColor: 'rgba(139,92,246,0.06)',
    borderRadius: 12,
    border: '1px solid rgba(139,92,246,0.12)',
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 700,
    flexShrink: 0,
    boxShadow: '0 0 12px rgba(139,92,246,0.3)',
  },
  sellerLabel: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 2,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e2e8f0',
  },
  sellerVerified: {
    marginLeft: 'auto',
    fontSize: 11,
    color: '#22d3ee',
    border: '1px solid rgba(34,211,238,0.3)',
    padding: '3px 10px',
    borderRadius: 20,
    backgroundColor: 'rgba(34,211,238,0.06)',
  },
  infoCards: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  infoCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.05)',
  },
  infoCardIcon: {
    fontSize: 20,
    flexShrink: 0,
  },
  infoLabel: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: 600,
    color: '#94a3b8',
  },
  descSection: {
    backgroundColor: '#0e0e20',
    borderRadius: 18,
    padding: '32px 36px',
    border: '1px solid rgba(139,92,246,0.1)',
    marginBottom: 20,
  },
  descHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  descHeaderLine: {
    flex: 1,
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)',
  },
  descTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#a78bfa',
    whiteSpace: 'nowrap',
    letterSpacing: '0.05em',
  },
  descText: {
    color: '#94a3b8',
    lineHeight: 1.9,
    fontSize: 14,
  },
  descLine: {
    marginBottom: 4,
  },
  stickyBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(5,5,15,0.9)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(139,92,246,0.15)',
    zIndex: 200,
    padding: '14px 24px',
  },
  stickyInner: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 24,
  },
  stickyLabel: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 2,
  },
  stickyPrice: {
    fontSize: 22,
    fontWeight: 800,
    background: 'linear-gradient(90deg, #22d3ee, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  payButton: {
    background: 'linear-gradient(135deg, #7c3aed, #0891b2)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '14px 40px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 0 24px rgba(139,92,246,0.4)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    letterSpacing: '0.02em',
    transition: 'opacity 0.2s, transform 0.1s',
  },
  payBtnArrow: {
    fontSize: 18,
    fontWeight: 300,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
    padding: 20,
  },
  modal: {
    backgroundColor: '#0e0e20',
    borderRadius: 20,
    padding: '28px',
    width: '100%',
    maxWidth: 400,
    border: '1px solid rgba(139,92,246,0.25)',
    boxShadow: '0 0 60px rgba(139,92,246,0.2)',
    position: 'relative',
    overflow: 'hidden',
  },
  modalGlow: {
    position: 'absolute',
    top: -60,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 200,
    height: 120,
    background: 'radial-gradient(ellipse, rgba(139,92,246,0.15), transparent)',
    pointerEvents: 'none',
  },
  modalTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: '#f1f5f9',
  },
  modalCloseX: {
    background: 'none',
    border: 'none',
    color: '#475569',
    fontSize: 16,
    cursor: 'pointer',
    padding: 4,
  },
  modalProductInfo: {
    textAlign: 'center',
    padding: '16px',
    backgroundColor: 'rgba(139,92,246,0.06)',
    borderRadius: 12,
    border: '1px solid rgba(139,92,246,0.1)',
    marginBottom: 16,
  },
  modalProductName: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
  },
  modalPrice: {
    fontSize: 28,
    fontWeight: 800,
    background: 'linear-gradient(90deg, #22d3ee, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  paymentOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  paymentOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    border: '1px solid rgba(139,92,246,0.15)',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    fontSize: 14,
    fontWeight: 600,
    color: '#e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'left',
  },
  paymentIcon: {
    fontSize: 20,
  },
  paymentArrow: {
    marginLeft: 'auto',
    color: '#475569',
    fontSize: 16,
  },
}
