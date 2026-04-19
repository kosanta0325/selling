import { createContext, useContext, useState } from 'react'
import { PRODUCTS } from '../data/products.js'

const ProductContext = createContext(null)

export function ProductProvider({ children }) {
  const [products, setProducts] = useState(PRODUCTS)

  const addProduct = (newProduct) => {
    setProducts(prev => [newProduct, ...prev])
  }

  const updateProduct = (id, updated) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p))
  }

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  )
}

export function useProducts() {
  return useContext(ProductContext)
}
