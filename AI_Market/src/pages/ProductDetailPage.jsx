import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PRODUCTS } from '../data/products.js'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const product = PRODUCTS.find(p => p.id === id)
  const [currentImage, setCurrentImage] = useState(0)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  if (!product) {
    return (
      <div style={styles.notFound}>
        <p>商品が見つかりませんでした</p>
        <button onClick={() => navigate('/')} style={styles.backBtn}>一覧に戻る</button>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Back button */}
      <button onClick={() => navigate(-1)} style={styles.backLink}>
        ← 一覧に戻る
      </button>

      <div style={styles.layout}>
        {/* Left: Images */}
        <div style={styles.imageSection}>
          <div style={styles.mainImageWrapper}>
            <img
              src={product.images[currentImage]}
              alt={product.title}
              style={styles.mainImage}
              onError={e => { e.target.src = 'https://via.placeholder.com/600x400?text=No+Image' }}
            />
            <span style={styles.categoryBadge}>{product.category}</span>
          </div>
          {product.images.length > 1 && (
            <div style={styles.thumbnails}>
              {product.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`サムネイル ${i + 1}`}
                  onClick={() => setCurrentImage(i)}
                  style={{
                    ...styles.thumbnail,
                    ...(currentImage === i ? styles.thumbnailActive : {}),
                  }}
                  onError={e => { e.target.src = 'https://via.placeholder.com/80x60?text=No' }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div style={styles.infoSection}>
          <h1 style={styles.title}>{product.title}</h1>

          {/* Rating */}
          <div style={styles.ratingRow}>
            <span style={styles.stars}>{'★'.repeat(Math.round(product.rating))}</span>
            <span style={styles.ratingText}>{product.rating} ({product.reviewCount}件のレビュー)</span>
          </div>

          {/* Price */}
          <div style={styles.priceBlock}>
            <span style={styles.price}>¥{product.price.toLocaleString()}</span>
            <span style={styles.priceSub}>（税込）</span>
          </div>

          {/* Tags */}
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
          </div>

          {/* Delivery & Payment Info */}
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoIcon}>📦</span>
              <div>
                <div style={styles.infoLabel}>納品予定</div>
                <div style={styles.infoValue}>購入後 {product.deliveryDays}日以内</div>
              </div>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoIcon}>💳</span>
              <div>
                <div style={styles.infoLabel}>支払方法</div>
                <div style={styles.infoValue}>{product.paymentMethods.join(' / ')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={styles.descSection}>
        <h2 style={styles.descTitle}>商品の説明</h2>
        <div style={styles.descText}>
          {product.description.split('\n').map((line, i) => (
            <p key={i} style={line === '' ? styles.descEmpty : styles.descLine}>{line}</p>
          ))}
        </div>
      </div>

      {/* Sticky payment button */}
      <div style={styles.stickyBar}>
        <div style={styles.stickyInner}>
          <div style={styles.stickyPrice}>¥{product.price.toLocaleString()}</div>
          <button
            style={styles.payButton}
            onClick={() => setShowPaymentModal(true)}
          >
            支払いに進む
          </button>
        </div>
      </div>

      {/* Payment modal */}
      {showPaymentModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>お支払い方法を選択</h2>
            <p style={styles.modalProduct}>{product.title}</p>
            <p style={styles.modalPrice}>¥{product.price.toLocaleString()}</p>
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
                  {method}
                </button>
              ))}
            </div>
            <button style={styles.modalClose} onClick={() => setShowPaymentModal(false)}>
              キャンセル
            </button>
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
    padding: '24px 20px 120px',
  },
  notFound: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#888',
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: '#6c47ff',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    padding: '0 0 20px',
    display: 'block',
  },
  backBtn: {
    marginTop: 16,
    padding: '10px 24px',
    backgroundColor: '#6c47ff',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 40,
    marginBottom: 40,
  },
  imageSection: {},
  mainImageWrapper: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0ebff',
    aspectRatio: '4/3',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  categoryBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(108,71,255,0.9)',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  thumbnails: {
    display: 'flex',
    gap: 8,
    marginTop: 10,
  },
  thumbnail: {
    width: 80,
    height: 60,
    objectFit: 'cover',
    borderRadius: 8,
    border: '2px solid transparent',
    cursor: 'pointer',
    opacity: 0.7,
    transition: 'all 0.15s',
  },
  thumbnailActive: {
    borderColor: '#6c47ff',
    opacity: 1,
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    color: '#111',
    lineHeight: 1.4,
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  stars: {
    color: '#f5a623',
    fontSize: 16,
  },
  ratingText: {
    fontSize: 13,
    color: '#888',
  },
  priceBlock: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontSize: 32,
    fontWeight: 800,
    color: '#e04040',
  },
  priceSub: {
    fontSize: 13,
    color: '#888',
  },
  tags: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    fontSize: 12,
    color: '#6c47ff',
    backgroundColor: '#f0ebff',
    padding: '4px 12px',
    borderRadius: 20,
  },
  sellerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  sellerAvatar: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    backgroundColor: '#6c47ff',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 700,
    flexShrink: 0,
  },
  sellerLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#333',
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  infoItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '12px 16px',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  infoIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 600,
    color: '#333',
  },
  descSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: '28px 32px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  descTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#111',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1.5px solid #f0f0f0',
  },
  descText: {
    color: '#444',
    lineHeight: 1.8,
  },
  descLine: {
    marginBottom: 4,
  },
  descEmpty: {
    marginBottom: 12,
  },
  stickyBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTop: '1px solid #e0e0e0',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
    zIndex: 200,
    padding: '12px 20px',
  },
  stickyInner: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 20,
  },
  stickyPrice: {
    fontSize: 22,
    fontWeight: 800,
    color: '#e04040',
  },
  payButton: {
    backgroundColor: '#6c47ff',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '14px 48px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(108,71,255,0.35)',
    transition: 'opacity 0.15s, transform 0.1s',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: '32px 28px',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: '#111',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalProduct: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalPrice: {
    fontSize: 26,
    fontWeight: 800,
    color: '#e04040',
    textAlign: 'center',
    marginBottom: 20,
  },
  paymentOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 16,
  },
  paymentOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 20px',
    border: '1.5px solid #e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fff',
    fontSize: 15,
    fontWeight: 600,
    color: '#333',
    cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'left',
  },
  paymentIcon: {
    fontSize: 20,
  },
  modalClose: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: 12,
    fontSize: 14,
    color: '#888',
    cursor: 'pointer',
    fontWeight: 600,
  },
}
