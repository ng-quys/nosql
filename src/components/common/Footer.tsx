import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Clock, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const Footer: React.FC = () => {
  const { role } = useStore();

  return (
    <footer className={`${role === 'customer' ? 'fresh-footer' : ''} bg-[#121C17] text-[#D8E2DC] mt-auto border-t border-[#1E2E27]`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-10">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-bold text-lg font-sans">
              <span className="w-6 h-6 rounded-md bg-[#2D6A4F] flex items-center justify-center text-[#F2F8F5]">
                <Leaf className="w-3.5 h-3.5" />
              </span>
              <span>FreshLeaf Juice</span>
            </div>
            <p className="text-xs text-[#889C92] leading-relaxed">
              Cửa hàng sinh tố &amp; nước ép<br />
              <strong className="text-white font-medium">Tươi mỗi ngày – Ngon từng ly.</strong>
            </p>
            <div className="flex items-center gap-2 text-xs text-[#6CAE8F]">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#40916C]" />
              <span>Trái cây tươi chọn lọc mỗi sáng</span>
            </div>
          </div>

          {/* Navigation based on Role */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              {role === 'customer' ? 'Khám phá quán' : 'Điều hướng nghiệp vụ'}
            </h4>
            <ul className="space-y-2 text-xs text-[#889C92]">
              {role === 'customer' ? (
                <>
                  <li>
                    <Link to="/menu" className="hover:text-white transition-colors">Thực đơn</Link>
                  </li>
                  <li>
                    <Link to="/#khuyen-mai" className="hover:text-white transition-colors">Khuyến mãi</Link>
                  </li>
                  <li>
                    <Link to="/track" className="hover:text-white transition-colors">Theo dõi đơn hàng</Link>
                  </li>
                  <li>
                    <Link to="/profile" className="hover:text-white transition-colors">Tài khoản</Link>
                  </li>
                  <li>
                    <a href="#lien-he" className="hover:text-white transition-colors">Liên hệ</a>
                  </li>
                </>
              ) : role === 'staff' ? (
                <>
                  <li>
                    <Link to="/pos" className="hover:text-white transition-colors">Bán hàng (POS)</Link>
                  </li>
                  <li>
                    <Link to="/admin/orders" className="hover:text-white transition-colors">Đơn hàng</Link>
                  </li>
                  <li>
                    <Link to="/track" className="hover:text-white transition-colors">Theo dõi đơn hàng</Link>
                  </li>
                  <li>
                    <Link to="/profile" className="hover:text-white transition-colors">Tài khoản</Link>
                  </li>
                </>
              ) : role === 'barista' ? (
                <>
                  <li>
                    <Link to="/kds" className="hover:text-white transition-colors">Màn hình pha chế (KDS)</Link>
                  </li>
                  <li>
                    <Link to="/kds" className="hover:text-white transition-colors">Đơn đang pha</Link>
                  </li>
                  <li>
                    <Link to="/admin/inventory" className="hover:text-white transition-colors">Tình trạng nguyên liệu</Link>
                  </li>
                  <li>
                    <Link to="/profile" className="hover:text-white transition-colors">Tài khoản</Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/admin" className="hover:text-white transition-colors">Tổng quan quản lý</Link>
                  </li>
                  <li>
                    <Link to="/admin/products" className="hover:text-white transition-colors">Quản lý sản phẩm</Link>
                  </li>
                  <li>
                    <Link to="/admin/inventory" className="hover:text-white transition-colors">Kho nguyên liệu</Link>
                  </li>
                  <li>
                    <Link to="/admin/reports" className="hover:text-white transition-colors">Báo cáo doanh thu</Link>
                  </li>
                  <li>
                    <Link to="/pos" className="hover:text-white transition-colors">Quầy POS bán hàng</Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Store Hours & Location (Strictly from user brief) */}
          <div id="lien-he" className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Địa chỉ &amp; Giờ mở cửa</h4>
            <div className="space-y-2 text-xs text-[#889C92]">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#40916C]" />
                <p>268 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh</p>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <Phone className="w-3.5 h-3.5 shrink-0 text-[#40916C]" />
                <p className="tabular-nums">Hotline: 090 123 4567</p>
              </div>
              <div className="flex items-start gap-2 pt-0.5">
                <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#40916C]" />
                <div>
                  <p className="text-white font-medium">Thứ 2 – Chủ nhật</p>
                  <p>07:00 – 22:00</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cam kết tươi ngon */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Cam kết tươi ngon</h4>
            <p className="text-xs text-[#889C92] leading-relaxed">
              Nguyên liệu được chọn lọc từ các vùng trồng uy tín tại Việt Nam (Đắk Lắk, Đà Lạt, Long An, Tiền Giang). Pha chế theo yêu cầu của khách hàng, tươi mỗi ngày.
            </p>
            <div className="pt-1">
              <span className="inline-block text-[11px] px-2.5 py-1 rounded-md bg-[#1B4332] text-[#9BCBB4] border border-[#2D6A4F]/40 font-mono">
                Cửa hàng Q.1 &bull; TP.HCM
              </span>
            </div>
          </div>
        </div>

        {/* Footer bottom with required copyright line */}
        <div className="mt-10 pt-5 border-t border-[#1E2E27] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5D7067]">
          <p>&copy; 2026 FreshLeaf Juice &middot; Đồ án Dữ liệu NoSQL</p>
          <div className="flex items-center gap-5 text-[11px]">
            <Link to="/menu" className="hover:text-white transition-colors">Thực đơn tươi</Link>
            <Link to="/track" className="hover:text-white transition-colors">Theo dõi đơn hàng</Link>
            <Link to="/profile" className="hover:text-white transition-colors">Tài khoản</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
