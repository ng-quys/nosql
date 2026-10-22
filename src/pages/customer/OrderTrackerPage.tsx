import React, { useState } from 'react';
import {
  CheckCircle2,
  Search,
  Receipt,
  ChefHat,
  Clock,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import { formatVND, formatDate, formatTime } from '../../utils/formatters';

export const OrderTrackerPage: React.FC = () => {
  const { orders, setActiveReceiptOrder, addToCart } = useStore();
  const [searchCode, setSearchCode] = useState('');

  const activeOrder = orders.find((o) => o.status === 'waiting' || o.status === 'preparing') || orders[0];

  const filteredOrders = orders.filter((o) => {
    if (!searchCode) return true;
    return (
      o.orderNumber.toLowerCase().includes(searchCode.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchCode.toLowerCase())
    );
  });

  const getStatusStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'waiting':
        return 0;
      case 'preparing':
        return 1;
      case 'completed':
        return 2;
      default:
        return 0;
    }
  };

  const steps = [
    { label: 'Đã nhận đơn', desc: 'Đơn đã chuyển đến màn hình pha chế' },
    { label: 'Đang pha chế', desc: 'Barista đang xay ép trái cây tươi' },
    { label: 'Sẵn sàng phục vụ', desc: 'Món đã hoàn thành, mời nhận tại quầy' },
  ];

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      addToCart({
        drinkId: item.drinkId,
        drink: item.drink,
        size: item.size,
        sugar: item.sugar,
        ice: item.ice,
        boosters: item.boosters,
        notes: item.notes,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      });
    });
  };

  const getOrderTypeLabel = (t: string) => {
    if (t === 'dine_in') return 'Tại quán';
    if (t === 'takeaway') return 'Mang về';
    return 'Giao hàng';
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'waiting':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#D97706]">Chờ pha chế</span>;
      case 'preparing':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DBEAFE] text-[#1D4ED8]">Đang pha chế</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E2F1E9] text-[#2D6A4F]">Hoàn thành</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFE4E6] text-[#E11D48]">Đã hủy</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
      {/* Tiêu đề */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#EAE5D9]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6CAE8F]">
            Cập nhật tiến độ pha chế trực tiếp
          </span>
          <h1 className="font-['Outfit'] text-3xl sm:text-4xl font-extrabold text-[#1B4332] tracking-tight mt-1">
            Theo dõi đơn hàng &amp; Hóa đơn
          </h1>
          <p className="text-xs sm:text-sm text-[#5D7067] mt-1">
            Theo dõi trạng thái ly nước của bạn từ lúc nhận đơn đến khi nhân viên pha chế hoàn tất.
          </p>
        </div>

        {/* Ô tìm kiếm đơn */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#889C92]" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn hoặc tên khách..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-[#E5DFCE] focus:border-[#2D6A4F] focus:outline-hidden bg-white text-[#1B4332]"
          />
        </div>
      </div>

      {/* Đơn hàng nổi bật đang xử lý */}
      {activeOrder && (
        <section className="bg-white rounded-3xl border border-[#E5DFCE] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F2EDE2]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#1B4332] text-white text-xs font-mono font-bold">
                  {activeOrder.orderNumber}
                </span>
                <span className="text-xs text-[#5D7067]">
                  &bull; {getOrderTypeLabel(activeOrder.orderType)} {activeOrder.tableNumber ? `(${activeOrder.tableNumber})` : ''}
                </span>
              </div>
              <h2 className="font-['Outfit'] font-bold text-xl text-[#1B4332]">
                Đơn của khách: {activeOrder.customerName}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveReceiptOrder(activeOrder)}
                className="px-3.5 py-2 rounded-xl border border-[#E5DFCE] hover:bg-[#FAF8F2] text-xs font-semibold text-[#1B4332] flex items-center gap-1.5 transition-colors"
              >
                <Receipt className="w-3.5 h-3.5 text-[#5D7067]" />
                <span>Xem hóa đơn thanh toán</span>
              </button>
            </div>
          </div>

          {/* Thanh tiến độ 3 bước */}
          <div className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {steps.map((st, i) => {
                const currentIdx = getStatusStepIndex(activeOrder.status);
                const isPastOrCurrent = i <= currentIdx;
                const isCurrent = i === currentIdx;

                return (
                  <div key={i} className="flex items-start gap-3 relative z-10">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs transition-colors ${
                        isCurrent
                          ? 'bg-[#EA580C] text-white shadow-md animate-pulse'
                          : isPastOrCurrent
                          ? 'bg-[#2D6A4F] text-white'
                          : 'bg-[#F2EDE2] text-[#889C92]'
                      }`}
                    >
                      {isPastOrCurrent && !isCurrent ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${isCurrent ? 'text-[#EA580C]' : isPastOrCurrent ? 'text-[#1B4332]' : 'text-[#889C92]'}`}>
                        {st.label}
                      </h4>
                      <p className="text-[11px] text-[#5D7067] mt-0.5">{st.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chi tiết món trong đơn */}
          <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-[#E5DFCE] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1B4332]">
              Danh sách món ({activeOrder.items.length} món)
            </h4>
            <div className="space-y-2">
              {activeOrder.items.map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between text-xs py-1.5 border-b border-[#E5DFCE]/60 last:border-b-0"
                >
                  <div>
                    <span className="font-bold text-[#1B4332]">{it.quantity}x {it.drink.name}</span>
                    <span className="text-[11px] text-[#5D7067] ml-2">
                      ({it.size === 'small' ? 'Size Nhỏ' : it.size === 'medium' ? 'Size Vừa' : 'Size Lớn'}, đường {it.sugar}, {it.ice === 'no_ice' ? 'không đá' : it.ice === 'less_ice' ? 'ít đá' : it.ice === 'regular' ? 'đá vừa' : 'nhiều đá'})
                    </span>
                    {it.boosters.length > 0 && (
                      <p className="text-[10px] text-[#40916C]">
                        Topping: {it.boosters.map((b) => b.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="font-semibold text-[#1B4332] tabular-nums">
                    {formatVND(it.unitPrice * it.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#1B4332]">
              <span>Tổng thanh toán ({activeOrder.paymentMethod === 'cash' ? 'Tiền mặt' : activeOrder.paymentMethod === 'qr_code' ? 'Chuyển khoản' : 'Thẻ'})</span>
              <span className="text-sm font-['Outfit'] tabular-nums text-[#EA580C]">
                {formatVND(activeOrder.totalAmount)}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Lịch sử các đơn hàng */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-['Outfit'] font-bold text-xl text-[#1B4332]">
            Lịch sử đơn hàng gần đây ({filteredOrders.length})
          </h3>
          <span className="text-xs text-[#889C92]">Đồng bộ tự động cùng quầy thu ngân &amp; pha chế</span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5DFCE] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F2] border-b border-[#E5DFCE] text-[#5D7067] uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-4">Khách hàng &amp; Phục vụ</th>
                  <th className="py-3 px-4">Món đã gọi</th>
                  <th className="py-3 px-4">Tổng tiền</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EDE2]">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#FCFBF7] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1B4332]">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#1B4332]">{ord.customerName}</p>
                      <p className="text-[11px] text-[#889C92]">
                        {getOrderTypeLabel(ord.orderType)} {ord.tableNumber ? `(${ord.tableNumber})` : ''}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-[#5D7067] max-w-xs truncate">
                      {ord.items.map((i) => `${i.quantity}x ${i.drink.name}`).join(', ')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#1B4332] tabular-nums">
                      {formatVND(ord.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(ord.status)}
                    </td>
                    <td className="py-3.5 px-4 text-[#889C92] tabular-nums">
                      {formatTime(ord.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setActiveReceiptOrder(ord)}
                        className="px-2 py-1 bg-white border border-[#E5DFCE] hover:bg-[#FAF8F2] rounded-md text-[11px] font-semibold text-[#1B4332]"
                      >
                        Hóa đơn
                      </button>
                      <button
                        onClick={() => handleReorder(ord)}
                        className="px-2 py-1 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-md text-[11px] font-semibold"
                        title="Thêm lại vào giỏ hàng"
                      >
                        Đặt lại
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
