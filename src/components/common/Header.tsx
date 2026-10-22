import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  User as UserIcon,
  ChefHat,
  MonitorCheck,
  LayoutDashboard,
  ChevronDown,
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  Menu,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { UserRole } from '../../types';

export const Header: React.FC = () => {
  const {
    currentUser,
    role,
    switchRole,
    cartCount,
    setIsCartDrawerOpen,
    notifications,
    markNotificationsAsRead,
    removeNotification,
  } = useStore();

  const location = useLocation();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  const roleLabels: Record<UserRole, { label: string; short: string; icon: React.ReactNode; color: string }> = {
    customer: {
      label: 'Khách hàng',
      short: 'Khách hàng',
      icon: <ShoppingBag className="w-4 h-4 text-emerald-600" />,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    staff: {
      label: 'Nhân viên bán hàng (POS)',
      short: 'Thu ngân',
      icon: <MonitorCheck className="w-4 h-4 text-amber-600" />,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    barista: {
      label: 'Nhân viên pha chế (KDS)',
      short: 'Pha chế',
      icon: <ChefHat className="w-4 h-4 text-blue-600" />,
      color: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    manager: {
      label: 'Quản lý cửa hàng',
      short: 'Quản lý',
      icon: <LayoutDashboard className="w-4 h-4 text-purple-600" />,
      color: 'bg-purple-50 text-purple-800 border-purple-200',
    },
  };

  // Điều hướng chính xác theo vai trò (Role-based Navigation)
  // Khách hàng tuyệt đối không hiển thị các chức năng nội bộ: Bán hàng, Màn hình pha chế, Quản lý
  const getNavLinks = (currentRole: UserRole) => {
    switch (currentRole) {
      case 'customer':
        return [
          { label: 'Trang chủ', path: '/' },
          { label: 'Thực đơn', path: '/menu' },
          { label: 'Khuyến mãi', path: '/#khuyen-mai' },
          { label: 'Theo dõi đơn hàng', path: '/track' },
        ];
      case 'staff':
        return [
          { label: 'Bán hàng', path: '/pos' },
          { label: 'Đơn hàng', path: '/admin/orders' },
          { label: 'Khách hàng', path: '/track' },
          { label: 'Thanh toán', path: '/pos' },
        ];
      case 'barista':
        return [
          { label: 'Màn hình pha chế', path: '/kds' },
          { label: 'Đơn đang pha', path: '/kds' },
          { label: 'Hoàn thành', path: '/kds' },
          { label: 'Tình trạng nguyên liệu', path: '/admin/inventory' },
        ];
      case 'manager':
        return [
          { label: 'Tổng quan', path: '/admin' },
          { label: 'Sản phẩm', path: '/admin/products' },
          { label: 'Kho nguyên liệu', path: '/admin/inventory' },
          { label: 'Nhập hàng', path: '/admin/inventory' },
          { label: 'Báo cáo', path: '/admin/reports' },
        ];
      default:
        return [
          { label: 'Trang chủ', path: '/' },
          { label: 'Thực đơn', path: '/menu' },
          { label: 'Theo dõi đơn hàng', path: '/track' },
        ];
    }
  };

  const navLinks = getNavLinks(role);

  const handleRoleSelect = async (newRole: UserRole) => {
    setRoleMenuOpen(false);
    setMobileMenuOpen(false);
    await switchRole(newRole);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FCFBF7]/95 backdrop-blur-md border-b border-[#EAE5D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#5D7067] hover:text-[#1B4332] hover:bg-[#F2EDE2]/60 rounded-lg transition-colors"
            aria-label="Mở thanh điều hướng"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link
            to="/"
            className="flex items-center gap-2.5 text-[#1B4332] font-semibold text-lg tracking-tight shrink-0 group hover:opacity-90 transition-opacity"
          >
            <span className="w-7 h-7 rounded-lg bg-[#2D6A4F] flex items-center justify-center text-[#F2F8F5] shadow-xs group-hover:rotate-6 transition-transform">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
              </svg>
            </span>
            <span className="font-['Be_Vietnam_Pro'] font-bold text-xl tracking-tight text-[#1B4332]">
              FreshLeaf<span className="text-[#EA580C]">.</span>
            </span>
          </Link>
        </div>

        {/* Zone 2: Role-based Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#2D3F37]">
          {navLinks.map((link, idx) => {
            const isAnchor = link.path.includes('#');
            const isActive = !isAnchor && (
              location.pathname === link.path ||
              (link.path.startsWith('/admin') && location.pathname.startsWith('/admin'))
            );
            return (
              <Link
                key={`${link.path}-${idx}`}
                to={link.path}
                className={`relative py-1 transition-colors hover:text-[#1B4332] whitespace-nowrap ${
                  isActive ? 'text-[#1B4332] font-semibold' : 'text-[#5D7067]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D6A4F] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Actions + Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Switcher (Cho đồ án / demo chấm điểm) */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                roleLabels[role].color
              }`}
              title="Đổi vai trò người dùng hệ thống"
            >
              {roleLabels[role].icon}
              <span className="hidden sm:inline font-semibold">{roleLabels[role].short}</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {roleMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setRoleMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5DFCE] rounded-xl shadow-xl p-1.5 z-30 divide-y divide-[#F2EDE2] animate-in fade-in-50 zoom-in-95 duration-150">
                  <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#889C92]">
                    Chuyển vai trò hệ thống
                  </div>
                  <div className="py-1 space-y-0.5">
                    {(['customer', 'staff', 'barista', 'manager'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRoleSelect(r)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-colors ${
                          role === r
                            ? 'bg-[#F2F8F5] text-[#1B4332] font-semibold'
                            : 'text-[#2D3F37] hover:bg-[#FAF8F2]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {roleLabels[r].icon}
                          <div>
                            <p className="font-semibold">{roleLabels[r].label}</p>
                          </div>
                        </div>
                        {role === r && <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                if (!notifOpen) markNotificationsAsRead();
              }}
              className="p-2 text-[#5D7067] hover:text-[#1B4332] hover:bg-[#F2EDE2]/60 rounded-lg transition-colors relative"
              aria-label="Thông báo hệ thống"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EA580C] rounded-full ring-2 ring-[#FCFBF7]" />
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-[#E5DFCE] rounded-xl shadow-xl p-3 z-30">
                  <div className="flex items-center justify-between pb-2 border-b border-[#F2EDE2] mb-2">
                    <span className="text-xs font-bold text-[#1B4332]">Hoạt động cửa hàng</span>
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="text-[#889C92] hover:text-[#1B4332]"
                      aria-label="Đóng thông báo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-[#889C92] py-4 text-center">Không có thông báo mới</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className="flex items-start justify-between gap-2 p-2 rounded-lg bg-[#FAF8F2] text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              {n.type === 'success' && <CheckCircle2 className="w-3 h-3 text-[#2D6A4F]" />}
                              {n.type === 'inventory' && <AlertTriangle className="w-3 h-3 text-[#EA580C]" />}
                              <span className="font-semibold text-[#1B4332]">{n.title}</span>
                              <span className="text-[10px] text-[#889C92] tabular-nums">
                                {n.timestamp}
                              </span>
                            </div>
                            <p className="text-[#5D7067] leading-relaxed text-[11px]">{n.message}</p>
                          </div>
                          <button
                            onClick={() => removeNotification(n.id)}
                            className="text-[#889C92] hover:text-[#EA580C]"
                            aria-label="Xóa thông báo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Cart Drawer Trigger - Chỉ cần thiết nhất cho Khách hàng & có thể dùng cho mọi vai trò */}
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#1B4332] text-white text-xs font-semibold rounded-lg hover:bg-[#143427] active:scale-95 transition-all shadow-xs"
            aria-label="Xem giỏ hàng"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Giỏ hàng</span>
            <span className="w-4 h-4 rounded-full bg-[#EA580C] text-white flex items-center justify-center text-[10px] font-bold tabular-nums">
              {cartCount}
            </span>
          </button>

          {/* User profile / login */}
          <Link
            to={currentUser ? '/profile' : '/login'}
            className="p-1.5 text-[#2D3F37] hover:bg-[#F2EDE2]/60 rounded-lg transition-colors flex items-center gap-1 text-xs"
            title={currentUser ? `Tài khoản: ${currentUser.name}` : 'Đăng nhập'}
            aria-label="Trang tài khoản cá nhân"
          >
            {currentUser?.avatar ? (
              <span className="w-7 h-7 rounded-full bg-[#E2F1E9] text-[#1B4332] flex items-center justify-center text-xs font-bold border border-[#C5E3D3]">
                {currentUser.avatar}
              </span>
            ) : (
              <UserIcon className="w-4 h-4 text-[#5D7067]" />
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Drawer Menu (Chỉ hiển thị link đúng theo vai trò hiện tại) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#EAE5D9] bg-[#FCFBF7] px-4 pt-3 pb-5 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-2 py-1 bg-[#F2F8F5] rounded-lg text-xs">
            <span className="text-[#5D7067]">Chế độ hiện tại:</span>
            <span className="font-bold text-[#1B4332]">{roleLabels[role].label}</span>
          </div>

          <nav className="flex flex-col space-y-1">
            {navLinks.map((link, idx) => {
              const isAnchor = link.path.includes('#');
              const isActive = !isAnchor && location.pathname === link.path;
              return (
                <Link
                  key={`m-${link.path}-${idx}`}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-[#E2F1E9] text-[#1B4332] font-semibold'
                      : 'text-[#2D3F37] hover:bg-[#F2EDE2]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm text-[#2D3F37] hover:bg-[#F2EDE2]"
            >
              Tài khoản &amp; Cài đặt
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};
