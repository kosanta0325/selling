import { Routes, Route, Navigate } from 'react-router-dom'
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
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx'
import PaymentPage from './pages/PaymentPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import { useAuth } from './context/AuthContext.jsx'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ minHeight: '100vh', background: '#05050f' }} />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* 認証ページ */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Admin login (no auth required) */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Admin routes (auth required — checked inside AdminLayout) */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>

      {/* User-facing routes (ログイン必須) */}
      <Route path="/*" element={
        <PrivateRoute>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<ListingPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/sell" element={<SellerPage />} />
                <Route path="/my-products" element={<MyProductsPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/payment" element={<PaymentPage />} />
              </Routes>
            </main>
          </div>
        </PrivateRoute>
      } />
    </Routes>
  )
}
