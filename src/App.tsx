import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { DrinkCustomizerModal } from './components/common/DrinkCustomizerModal';
import { CartDrawer } from './components/common/CartDrawer';
import { ReceiptModal } from './components/common/ReceiptModal';

// Pages
import { HomePage } from './pages/customer/HomePage';
import { ProductsPage } from './pages/customer/ProductsPage';
import { OrderTrackerPage } from './pages/customer/OrderTrackerPage';
import { PosPage } from './pages/pos/PosPage';
import { KdsPage } from './pages/kds/KdsPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminInventoryPage } from './pages/admin/AdminInventoryPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ProfilePage } from './pages/profile/ProfilePage';

// Trang 404 tiếng Việt
function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto my-24 p-8 text-center bg-white rounded-3xl border border-[#E5DFCE] space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center font-bold text-xl mx-auto">
        404
      </div>
      <h2 className="font-['Outfit'] font-bold text-xl text-[#1B4332]">
        Không tìm thấy trang
      </h2>
      <p className="text-xs text-[#5D7067] leading-relaxed">
        Đường dẫn món uống hoặc phân hệ bạn đang tìm kiếm không tồn tại hoặc đã được chuyển vị trí.
      </p>
      <Link
        to="/"
        className="inline-block px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
      >
        Về trang chủ thực đơn
      </Link>
    </div>
  );
}

// App Wrapper to conditionally omit Header/Footer for fullscreen POS or KDS if desired,
// but keep Header available so role switching and navigation are always reachable.
function AppShell() {
  const location = useLocation();
  const isKds = location.pathname === '/kds';
  const isPos = location.pathname === '/pos';

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF7]">
      <Header />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<ProductsPage />} />
          <Route path="/pos" element={<PosPage />} />
          <Route path="/kds" element={<KdsPage />} />
          <Route path="/track" element={<OrderTrackerPage />} />

          {/* Admin Nested Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="inventory" element={<AdminInventoryPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
          </Route>

          {/* Auth & Profile */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Fallback 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {!isPos && !isKds && <Footer />}

      {/* Global Interactive Modals */}
      <DrinkCustomizerModal />
      <CartDrawer />
      <ReceiptModal />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </StoreProvider>
  );
}
