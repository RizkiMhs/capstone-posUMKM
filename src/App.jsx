import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShiftProvider } from './context/ShiftContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/layout/Navbar';
import Login from './pages/Login';
import POS from './pages/cashier/POS';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import FinanceReport from './pages/admin/FinanceReport';
import Analytics from './pages/admin/Analytics';
import Categories from './pages/admin/Categories';
import Users from './pages/admin/Users';
import OrderHistory from './pages/cashier/OrderHistory';
import StoreSettings from './pages/admin/StoreSettings';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold tracking-wider uppercase text-slate-400">Memuat Sesi POS...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/pos" replace />;
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <Navbar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

function RoleHome() {
  const { profile } = useAuth();
  return <Navigate to={profile?.role === 'admin' ? '/dashboard' : '/pos'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ShiftProvider>
        <CartProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RoleHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pos"
              element={
                <ProtectedRoute>
                  <POS />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute adminOnly>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute adminOnly>
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance"
              element={
                <ProtectedRoute adminOnly>
                  <FinanceReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute adminOnly>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute adminOnly>
                  <Categories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <OrderHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute adminOnly>
                  <StoreSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute adminOnly>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route path="/reports" element={<Navigate to="/finance" replace />} />
            <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CartProvider>
    </ShiftProvider>
  </AuthProvider>
  );
}
