import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import ListingPage from './pages/ListingPage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import SellerPage from './pages/SellerPage.jsx'
import MyProductsPage from './pages/MyProductsPage.jsx'
import TransactionsPage from './pages/TransactionsPage.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminProducts from './pages/admin/AdminProducts.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'

export default function App() {
  return (
    <Routes>
      {/* Admin routes (no site header) */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>

      {/* User-facing routes */}
      <Route path="/*" element={
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Header />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<ListingPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/sell" element={<SellerPage />} />
              <Route path="/my-products" element={<MyProductsPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
            </Routes>
          </main>
        </div>
      } />
    </Routes>
  )
}
