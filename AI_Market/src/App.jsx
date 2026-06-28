import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import ListingPage from './pages/ListingPage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import SellerPage from './pages/SellerPage.jsx'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<ListingPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/sell" element={<SellerPage />} />
        </Routes>
      </main>
    </div>
  )
}
