import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PRODUCTS } from '../data/products.js'

const ProductContext = createContext(null)

function normalize(row) {
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    category: row.category,
    description: row.description,
    tags: row.tags ?? [],
    images: row.image_urls?.length ? row.image_urls : ['https://placehold.co/400x240?text=No+Image'],
    deliveryDays: row.delivery_days ?? 1,
    paymentMethods: row.payment_methods ?? [],
    seller: row.profiles?.username ?? '不明',
    sellerAvatar: (row.profiles?.username?.[0] ?? '?').toUpperCase(),
    sellerId: row.seller_id,
    rating: 0,
    reviewCount: 0,
    status: row.status,
    createdAt: row.created_at,
    isNew: false,
  }
}

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*, profiles(username)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('商品取得エラー:', error.message)
      setProducts(PRODUCTS)
    } else {
      const dbProducts = (data ?? []).map(normalize)
      setProducts([...dbProducts, ...PRODUCTS])
    }
    setLoading(false)
  }

  const refreshProducts = () => fetchProducts()
  const addProduct = () => fetchProducts()

  const updateProduct = (id, updated) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p))
  }

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <ProductContext.Provider value={{ products, loading, addProduct, updateProduct, deleteProduct, refreshProducts }}>
      {children}
    </ProductContext.Provider>
  )
}

export function useProducts() {
  return useContext(ProductContext)
}
