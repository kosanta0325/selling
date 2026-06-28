import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PRODUCTS } from '../data/products.js'

const CATEGORIES = ['すべて', 'テキスト生成', '画像生成', 'マーケティング', '開発支援']

export default function ListingPage() {
  const [selectedCategory, setSelectedCategory] = useState('すべて')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = PRODUCTS.filter(p => {
    const matchCat = selectedCategory === 'すべて' || p.category === selectedCategory
    const matchSearch = p.title.includes(searchQuery) || p.description.includes(searchQuery)
    return matchCat && matchSearch
  })

  return (
    <div style={styles.container}>
      {/* Search bar */}
      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="AIツールを検索..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Category tabs */}
      <div style={styles.categories}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              ...styles.catBtn,
              ...(selectedCategory === cat ? styles.catBtnActive : {}),
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div style={styles.grid}>
        {filtered.map(product => (
          <Link to={`/product/${product.id}`} key={product.id} style={styles.card}>
            <div style={styles.imageWrapper}>
              <img
                src={product.images[0]}
                alt={product.title}
                style={styles.image}
                onError={e => { e.target.src = 'https://via.placeholder.com/400x240?text=No+Image' }}
              />
              <span style={styles.categoryBadge}>{product.category}</span>
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
                <div style={styles.priceBlock}>
                  <span style={styles.price}>¥{product.price.toLocaleString()}</span>
                </div>
              </div>
              <div style={styles.rating}>
                <span style={styles.stars}>{'★'.repeat(Math.round(product.rating))}</span>
                <span style={styles.ratingText}>{product.rating} ({product.reviewCount}件)</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={styles.empty}>
          <p>該当する商品が見つかりませんでした</p>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '24px 20px 60px',
  },
  searchBar: {
    marginBottom: 20,
  },
  searchInput: {
    width: '100%',
    padding: '12px 18px',
    borderRadius: 12,
    border: '1.5px solid #e0e0e0',
    fontSize: 15,
    outline: 'none',
    backgroundColor: '#fff',
    transition: 'border-color 0.15s',
  },
  categories: {
    display: 'flex',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  catBtn: {
    padding: '7px 16px',
    borderRadius: 20,
    border: '1.5px solid #e0e0e0',
    backgroundColor: '#fff',
    fontSize: 13,
    fontWeight: 500,
    color: '#555',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  catBtnActive: {
    backgroundColor: '#6c47ff',
    borderColor: '#6c47ff',
    color: '#fff',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    display: 'block',
    cursor: 'pointer',
  },
  imageWrapper: {
    position: 'relative',
    height: 180,
    overflow: 'hidden',
    backgroundColor: '#f0ebff',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(108,71,255,0.85)',
    color: '#fff',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    backdropFilter: 'blur(4px)',
  },
  cardBody: {
    padding: '14px 16px',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 8,
    color: '#222',
    lineHeight: 1.4,
  },
  tags: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    fontSize: 11,
    color: '#6c47ff',
    backgroundColor: '#f0ebff',
    padding: '2px 8px',
    borderRadius: 10,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sellerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    backgroundColor: '#6c47ff',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
  },
  sellerName: {
    fontSize: 12,
    color: '#888',
  },
  priceBlock: {
    textAlign: 'right',
  },
  price: {
    fontSize: 18,
    fontWeight: 800,
    color: '#e04040',
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  stars: {
    color: '#f5a623',
    fontSize: 13,
  },
  ratingText: {
    fontSize: 12,
    color: '#888',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 0',
    color: '#999',
    fontSize: 15,
  },
}
