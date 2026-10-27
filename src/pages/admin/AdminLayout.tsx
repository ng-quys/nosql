import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Coffee,
  Package,
  ClipboardList,
  BarChart3,
  AlertTriangle,
  Users,
  BadgePercent,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AdminLayout: React.FC = () => {
  const { lowStockCount } = useStore();
  const location = useLocation();

  const links = [
    { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
    { to: '/admin/products', label: 'Quản lý thực đơn', icon: Coffee },
    {
      to: '/admin/inventory',
      label: 'Tồn kho nguyên liệu',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    { to: '/admin/orders', label: 'Lịch sử đơn hàng', icon: ClipboardList },
    { to: '/admin/reports', label: 'Báo cáo doanh thu', icon: BarChart3 },
    { to: '/admin/promotions', label: 'Khuyến mãi', icon: BadgePercent },
    { to: '/admin/users', label: 'Người dùng', icon: Users },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Tiêu đề trang quản lý */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE5D9]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F]" />
            <span className="text-xs font-semibold text-[#5D7067]">
              Cửa hàng FreshLeaf Juice &bull; 268 Nguyễn Trãi, Q.1
            </span>
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl font-bold text-[#1B4332] tracking-tight mt-0.5">
            Quản trị &amp; Vận hành cửa hàng
          </h1>
        </div>

        {/* Thẻ cảnh báo nguyên liệu & Trạng thái đồng bộ */}
        <div className="flex items-center gap-3">
          {lowStockCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-xs font-semibold text-[#92400E]">
              <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
              <span>{lowStockCount} nguyên liệu sắp hết</span>
            </div>
          )}
          <div className="px-3 py-1.5 rounded-lg bg-white border border-[#E5DFCE] text-xs text-[#5D7067] font-medium">
            Thu ngân &bull; Pha chế &bull; Đồng bộ trực tiếp
          </div>
        </div>
      </div>

      {/* Thanh tab điều hướng con */}
      <div className="flex items-center gap-2 border-b border-[#EAE5D9] overflow-x-auto pb-px">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = link.end
            ? location.pathname === link.to
            : location.pathname.startsWith(link.to);

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-[#2D6A4F] text-[#1B4332] bg-white rounded-t-lg'
                  : 'border-transparent text-[#5D7067] hover:text-[#1B4332] hover:bg-[#FAF8F2] rounded-t-lg'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
              {link.badge !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#EA580C] text-white tabular-nums">
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      <Outlet />
    </div>
  );
};
