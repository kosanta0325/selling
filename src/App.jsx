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

function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div style={{ minHeight: '100vh', background: '#05050f' }} />
  if (!user) return <Navigate to="/login" replace />
  if (profile && profile.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function HomeRedirect() {
  const { profile, loading } = useAuth()
  if (loading) return <div style={{ minHeight: '100vh', background: '#05050f' }} />
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />
  return <ListingPage />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* 管理者ルート */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>

      {/* 一般ユーザールート */}
      <Route path="/*" element={
        <PrivateRoute>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<HomeRedirect />} />
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
