import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProducts } from '../context/ProductContext.jsx'

const CATEGORIES = ['すべて', 'テキスト生成', '画像生成', 'マーケティング', '開発支援']

export default function ListingPage() {
  const { products } = useProducts()
  const [selectedCategory, setSelectedCategory] = useState('すべて')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = products.filter(p => {
    const matchCat = selectedCategory === 'すべて' || p.category === selectedCategory
    const matchSearch = p.title.includes(searchQuery) || p.description.includes(searchQuery)
    return matchCat && matchSearch
  })

  return (
    <div style={styles.container}>
      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroBadge}>✦ AIツール マーケットプレイス</div>
        <h1 style={styles.heroTitle}>
          次世代の<span style={styles.heroGradient}>AIツール</span>を<br />見つけよう
        </h1>
        <p style={styles.heroSub}>個人クリエイターが作ったAIツールを購入・販売できるマーケット</p>
      </div>

      {/* Search */}
      <div style={styles.searchRow}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>⌕</span>
          <input
            type="text"
            placeholder="AIツールを検索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Categories */}
      <div style={styles.categories}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{ ...styles.catBtn, ...(selectedCategory === cat ? styles.catBtnActive : {}) }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <span style={styles.statsText}>{filtered.length}件の商品</span>
      </div>

      {/* Grid */}
      <div style={styles.grid}>
        {filtered.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>◎</div>
          <p>該当する商品が見つかりませんでした</p>
        </div>
      )}
    </div>
  )
}

function ProductCard({ product }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      to={`/product/${product.id}`}
      style={{ ...styles.card, ...(hovered ? styles.cardHovered : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.imageWrapper}>
        <img
          src={product.images[0]}
          alt={product.title}
          style={{ ...styles.image, ...(hovered ? styles.imageHovered : {}) }}
          onError={e => { e.target.src = 'https://via.placeholder.com/400x240?text=No+Image' }}
        />
        <div style={styles.imageOverlay} />
        <span style={styles.categoryBadge}>{product.category}</span>
        {product.isNew && <span style={styles.newBadge}>NEW</span>}
        <div style={styles.priceTag}>¥{product.price.toLocaleString()}</div>
      </div>
      <div style={styles.cardBody}>
        <h3 style={styles.cardTitle}>{product.title}</h3>
        <div style={styles.tags}>
          {product.tags.map(tag => (
            <span key={tag} style={styles.tag}>#{tag}</span>
          ))}
        </div>
        <div style={styles.cardFooter}>
          <div style={styles.sellerInfo}>
            <div style={styles.avatar}>{product.sellerAvatar}</div>
            <span style={styles.sellerName}>{product.seller}</span>
          </div>
          <div style={styles.rating}>
            <span style={styles.star}>★</span>
            <span style={styles.ratingVal}>{product.rating}</span>
            <span style={styles.ratingCount}>({product.reviewCount})</span>
          </div>
        </div>
      </div>
      {hovered && <div style={styles.cardGlow} />}
    </Link>
  )
}

const styles = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '48px 24px 80px',
  },
  hero: {
    textAlign: 'center',
    marginBottom: 48,
  },
  heroBadge: {
    display: 'inline-block',
    padding: '6px 16px',
    borderRadius: 20,
    border: '1px solid rgba(139,92,246,0.4)',
    color: '#a78bfa',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.05em',
    marginBottom: 20,
    background: 'rgba(139,92,246,0.08)',
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: 800,
    color: '#f1f5f9',
    lineHeight: 1.2,
    marginBottom: 16,
    letterSpacing: '-1px',
  },
  heroGradient: {
    background: 'linear-gradient(90deg, #a78bfa, #22d3ee)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSub: {
    fontSize: 16,
    color: '#64748b',
    maxWidth: 480,
    margin: '0 auto',
  },
  searchRow: {
    marginBottom: 20,
  },
  searchWrapper: {
    position: 'relative',
    maxWidth: 560,
    margin: '0 auto',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 20,
    color: '#475569',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '14px 18px 14px 44px',
    borderRadius: 12,
    border: '1px solid rgba(139,92,246,0.2)',
    fontSize: 15,
    outline: 'none',
    backgroundColor: 'rgba(14,14,32,0.8)',
    color: '#e2e8f0',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    backdropFilter: 'blur(8px)',
  },
  categories: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  catBtn: {
    padding: '7px 18px',
    borderRadius: 20,
    border: '1px solid rgba(139,92,246,0.2)',
    backgroundColor: 'transparent',
    fontSize: 13,
    fontWeight: 500,
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  catBtnActive: {
    background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(34,211,238,0.15))',
    borderColor: 'rgba(139,92,246,0.6)',
    color: '#a78bfa',
    fontWeight: 700,
    boxShadow: '0 0 12px rgba(139,92,246,0.2)',
  },
  statsRow: {
    marginBottom: 20,
  },
  statsText: {
    fontSize: 13,
    color: '#475569',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 20,
  },
  card: {
    backgroundColor: '#0e0e20',
    borderRadius: 16,
    overflow: 'hidden',
    border: '1px solid rgba(139,92,246,0.12)',
    transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s',
    display: 'block',
    cursor: 'pointer',
    position: 'relative',
  },
  cardHovered: {
    transform: 'translateY(-4px)',
    borderColor: 'rgba(139,92,246,0.4)',
    boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 24px rgba(139,92,246,0.15)',
  },
  cardGlow: {
    position: 'absolute',
    inset: 0,
    borderRadius: 16,
    background: 'linear-gradient(135deg, rgba(139,92,246,0.04), rgba(34,211,238,0.02))',
    pointerEvents: 'none',
  },
  imageWrapper: {
    position: 'relative',
    height: 190,
    overflow: 'hidden',
    backgroundColor: '#0b0b1a',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.4s',
    filter: 'brightness(0.85)',
  },
  imageHovered: {
    transform: 'scale(1.04)',
    filter: 'brightness(0.95)',
  },
  imageOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(14,14,32,0.8) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  newBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(34,211,238,0.25)',
    color: '#22d3ee',
    padding: '3px 9px',
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 800,
    border: '1px solid rgba(34,211,238,0.4)',
    letterSpacing: '0.06em',
    backdropFilter: 'blur(8px)',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(139,92,246,0.25)',
    color: '#a78bfa',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    border: '1px solid rgba(139,92,246,0.3)',
    backdropFilter: 'blur(8px)',
  },
  priceTag: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(5,5,15,0.85)',
    color: '#22d3ee',
    padding: '4px 12px',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 800,
    border: '1px solid rgba(34,211,238,0.25)',
    backdropFilter: 'blur(8px)',
  },
  cardBody: {
    padding: '16px 18px',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 10,
    color: '#e2e8f0',
    lineHeight: 1.4,
  },
  tags: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  tag: {
    fontSize: 11,
    color: '#64748b',
    backgroundColor: 'rgba(139,92,246,0.07)',
    padding: '2px 8px',
    borderRadius: 6,
    border: '1px solid rgba(139,92,246,0.1)',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 700,
  },
  sellerName: {
    fontSize: 12,
    color: '#475569',
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
  },
  star: {
    color: '#f59e0b',
    fontSize: 13,
  },
  ratingVal: {
    fontSize: 13,
    fontWeight: 700,
    color: '#94a3b8',
  },
  ratingCount: {
    fontSize: 11,
    color: '#475569',
  },
  empty: {
    textAlign: 'center',
    padding: '80px 0',
    color: '#475569',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
    opacity: 0.3,
  },
}
