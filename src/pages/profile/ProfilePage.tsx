import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatVND, formatDate } from '../../utils/formatters';

export const ProfilePage: React.FC = () => {
  const { currentUser, logout, orders, setActiveReceiptOrder } = useStore();
  const navigate = useNavigate();

  const [sweetnessPref, setSweetnessPref] = useState('50%');
  const [icePref, setIcePref] = useState('less_ice');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const userOrders = orders.filter(
    (o) =>
      o.customerName.toLowerCase() === (currentUser?.name || '').toLowerCase() ||
      o.customerPhone === currentUser?.phone
  );

  const handleSavePrefs = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto p-12 text-center space-y-4">
        <p className="text-sm text-[#5D7067]">Vui lòng đăng nhập để xem thông tin tài khoản.</p>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 bg-[#2D6A4F] text-white rounded-xl text-xs font-semibold"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Tiêu đề tài khoản */}
      <div className="bg-white rounded-3xl border border-[#E5DFCE] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#E2F1E9] border border-[#C5E3D3] flex items-center justify-center text-[#1B4332] font-sans font-bold text-2xl">
            {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-bold text-2xl text-[#1B4332]">
                {currentUser.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                {currentUser.tier || 'Thành viên Thân thiết'}
              </span>
            </div>
            <p className="text-xs text-[#5D7067]">{currentUser.email}</p>
            {currentUser.phone && (
              <p className="text-xs text-[#889C92] tabular-nums">{currentUser.phone}</p>
            )}
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="px-3.5 py-2 rounded-xl border border-[#E5DFCE] hover:bg-[#FAF8F2] text-xs font-semibold text-[#5D7067] hover:text-[#DC2626] flex items-center gap-1.5 transition-colors self-start sm:self-center"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Đăng xuất</span>
        </button>
      </div>

      {/* Điểm thưởng & Cấp độ thành viên */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#1B4332] text-white space-y-1 sm:col-span-2 shadow-sm">
          <span className="text-xs font-semibold uppercase text-[#9BCBB4]">Điểm thưởng tích lũy</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-sans tabular-nums text-[#FED7AA]">
              {currentUser.loyaltyPoints || 350} Điểm
            </span>
            <span className="text-xs text-[#C5E3D3]">&bull; 100 điểm = 1 ly miễn phí</span>
          </div>
          <p className="text-xs text-[#9BCBB4] pt-2">
            Bạn đang có đủ điểm để đổi miễn phí 3 ly sinh tố bơ sáp hoặc nước ép cam tươi tại quầy!
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5DFCE] space-y-2">
          <div className="flex items-center justify-between text-[#5D7067]">
            <span className="text-xs font-semibold uppercase">Tổng số ly đã gọi</span>
            <Award className="w-4 h-4 text-[#EA580C]" />
          </div>
          <h3 className="font-sans text-2xl font-bold text-[#1B4332] tabular-nums">
            {Math.max(6, userOrders.length * 2)} Ly
          </h3>
          <p className="text-[11px] text-[#889C92]">Thành viên thân thiết tại chi nhánh Q.1</p>
        </div>
      </div>

      {/* Khẩu vị pha chế yêu thích */}
      <div className="bg-white rounded-3xl border border-[#E5DFCE] p-6 space-y-4">
        <div className="pb-3 border-b border-[#F2EDE2]">
          <h3 className="font-sans font-bold text-base text-[#1B4332]">
            Khẩu vị pha chế mặc định
          </h3>
          <p className="text-xs text-[#5D7067]">
            Hệ thống sẽ tự động gợi ý mức đường và đá này khi bạn đặt món.
          </p>
        </div>

        <form onSubmit={handleSavePrefs} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#1B4332] mb-1">Mức đường ưa thích</label>
              <select
                value={sweetnessPref}
                onChange={(e) => setSweetnessPref(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5DFCE] bg-[#FAF8F2] text-[#1B4332]"
              >
                <option value="0%">0% đường (Chỉ vị ngọt tự nhiên của trái cây)</option>
                <option value="30%">30% đường (Hơi ngọt thanh)</option>
                <option value="50%">50% đường (Vừa miệng, cân bằng)</option>
                <option value="70%">70% đường (Ngọt đậm đà)</option>
                <option value="100%">100% đường (Chuẩn công thức quán)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1B4332] mb-1">Mức đá ưa thích</label>
              <select
                value={icePref}
                onChange={(e) => setIcePref(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5DFCE] bg-[#FAF8F2] text-[#1B4332]"
              >
                <option value="no_ice">Không đá (Uống đậm hoặc cất tủ lạnh)</option>
                <option value="less_ice">Ít đá (Mát nhẹ, không loãng)</option>
                <option value="regular">Đá bình thường</option>
                <option value="more_ice">Nhiều đá (Mát lạnh sảng khoái)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-xs text-[#2D6A4F] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã lưu sở thích khẩu vị!
              </span>
            ) : (
              <span className="text-[11px] text-[#889C92]">Tự động áp dụng cho các lần đặt tiếp theo</span>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl font-semibold shadow-xs"
            >
              Lưu khẩu vị
            </button>
          </div>
        </form>
      </div>

      {/* Lịch sử hóa đơn gần đây */}
      <div className="bg-white rounded-3xl border border-[#E5DFCE] p-6 space-y-4">
        <h3 className="font-sans font-bold text-base text-[#1B4332]">
          Lịch sử hóa đơn của bạn
        </h3>

        <div className="space-y-3">
          {orders.slice(0, 3).map((ord) => (
            <div
              key={ord.id}
              className="p-3.5 rounded-xl border border-[#E5DFCE] bg-[#FAF8F2] flex items-center justify-between text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#1B4332]">{ord.orderNumber}</span>
                  <span className="text-[10px] text-[#889C92] tabular-nums">
                    {formatDate(ord.createdAt)}
                  </span>
                </div>
                <p className="text-[11px] text-[#5D7067] mt-0.5">
                  {ord.items.map((i) => `${i.quantity}x ${i.drink.name}`).join(', ')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-bold text-sm font-sans text-[#1B4332] tabular-nums">
                  {formatVND(ord.totalAmount)}
                </span>
                <button
                  onClick={() => setActiveReceiptOrder(ord)}
                  className="px-2.5 py-1 bg-white border border-[#E5DFCE] hover:bg-[#F2EDE2] rounded-lg text-[11px] font-semibold text-[#1B4332]"
                >
                  Xem hóa đơn
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
