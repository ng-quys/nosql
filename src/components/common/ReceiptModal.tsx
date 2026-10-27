import React from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatVND, formatDate, formatTime } from '../../utils/formatters';

export const ReceiptModal: React.FC = () => {
  const { activeReceiptOrder, setActiveReceiptOrder } = useStore();

  if (!activeReceiptOrder) return null;
  const order = activeReceiptOrder;

  const handlePrint = () => {
    window.print();
  };

  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case 'dine_in':
        return 'Dùng tại quán';
      case 'takeaway':
        return 'Mang về';
      case 'delivery':
        return 'Giao hàng';
      default:
        return type;
    }
  };

  const getPaymentMethodLabel = (pm: string) => {
    switch (pm) {
      case 'cash':
        return 'Tiền mặt';
      case 'qr_code':
        return 'Chuyển khoản (VietQR)';
      case 'card':
        return 'Thẻ ngân hàng';
      default:
        return pm;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-[#E5DFCE] p-6 text-[#121C17] animate-in zoom-in-95 duration-200">
        {/* Thanh công cụ đóng & in (ẩn khi in thật) */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F2EDE2] print:hidden">
          <span className="text-xs font-bold text-[#2D6A4F] flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-[#2D6A4F]" /> Đã ghi nhận đơn hàng
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg border border-[#E5DFCE] hover:bg-[#FAF8F2] text-[#5D7067] hover:text-[#1B4332] transition-colors"
              title="In hóa đơn"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveReceiptOrder(null)}
              className="p-1.5 rounded-lg border border-[#E5DFCE] hover:bg-[#FAF8F2] text-[#5D7067] hover:text-[#1B4332] transition-colors"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hóa đơn phong cách giấy in nhiệt quán cafe */}
        <div className="pt-4 font-mono text-xs space-y-3">
          {/* Thông tin quán */}
          <div className="text-center space-y-1">
            <h3 className="font-sans font-bold text-base tracking-tight text-[#1B4332]">
              FRESHLEAF JUICE
            </h3>
            <p className="text-[11px] text-[#5D7067]">Cửa hàng sinh tố &amp; nước ép tươi</p>
            <p className="text-[10px] text-[#889C92]">268 Nguyễn Trãi, P. Nguyễn Cư Trinh, Q.1, TP.HCM</p>
            <p className="text-[10px] text-[#889C92] tabular-nums">Hotline: 090 123 4567</p>
          </div>

          <div className="border-t border-dashed border-[#DED6C3] pt-2 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>MÃ ĐƠN:</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>THỜI GIAN:</span>
              <span>{formatDate(order.createdAt)} {formatTime(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>HÌNH THỨC:</span>
              <span>{getOrderTypeLabel(order.orderType)} {order.tableNumber ? `(${order.tableNumber})` : ''}</span>
            </div>
            <div className="flex justify-between">
              <span>KHÁCH HÀNG:</span>
              <span>{order.customerName}</span>
            </div>
          </div>

          {/* Bảng chi tiết món */}
          <div className="border-t border-b border-dashed border-[#DED6C3] py-2 space-y-2">
            {order.items.map((it, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-medium">
                  <span>{it.quantity}x {it.drink.name}</span>
                  <span className="tabular-nums">{formatVND(it.unitPrice * it.quantity)}</span>
                </div>
                <div className="text-[10px] text-[#5D7067] pl-3">
                  Size {it.size === 'small' ? 'Nhỏ' : it.size === 'medium' ? 'Vừa' : 'Lớn'} &bull; Đường {it.sugar} &bull; {it.ice === 'no_ice' ? 'Không đá' : it.ice === 'less_ice' ? 'Ít đá' : it.ice === 'regular' ? 'Đá vừa' : 'Nhiều đá'}
                  {it.boosters.length > 0 && ` &bull; +${it.boosters.map((b) => b.name).join(', ')}`}
                </div>
              </div>
            ))}
          </div>

          {/* Tổng tiền */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>TẠM TÍNH:</span>
              <span className="tabular-nums">{formatVND(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-[#2D6A4F]">
                <span>GIẢM GIÁ:</span>
                <span className="tabular-nums">-{formatVND(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-1 border-t border-[#E5DFCE] text-[#1B4332]">
              <span>TỔNG CỘNG:</span>
              <span className="tabular-nums">{formatVND(order.totalAmount)}</span>
            </div>

            <div className="flex justify-between pt-1 text-[10px] text-[#5D7067]">
              <span>THANH TOÁN:</span>
              <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
            </div>

            {order.cashGiven && (
              <>
                <div className="flex justify-between text-[10px]">
                  <span>TIỀN KHÁCH ĐƯA:</span>
                  <span className="tabular-nums">{formatVND(order.cashGiven)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-[#EA580C]">
                  <span>TIỀN THỐI LẠI:</span>
                  <span className="tabular-nums">{formatVND(order.changeDue || 0)}</span>
                </div>
              </>
            )}
          </div>

          {/* Mã vạch & Lời cảm ơn */}
          <div className="pt-3 text-center space-y-1">
            <div className="h-9 w-48 mx-auto flex items-center justify-between px-2 bg-[#F7F4EA] border border-[#E5DFCE] rounded">
              <span className="text-[10px] tracking-widest text-[#5D7067]">||| | |||| || ||| ||||</span>
              <span className="text-[9px] font-mono text-[#889C92]">{order.orderNumber}</span>
            </div>
            <p className="text-[10px] text-[#889C92] mt-1">Cảm ơn quý khách &amp; Hẹn gặp lại!</p>
          </div>
        </div>

        {/* Nút đóng */}
        <div className="mt-6 pt-3 border-t border-[#F2EDE2] print:hidden">
          <button
            onClick={() => setActiveReceiptOrder(null)}
            className="w-full py-2 bg-[#FAF8F2] border border-[#E5DFCE] rounded-xl text-xs font-semibold hover:bg-[#F2EDE2] text-[#1B4332] transition-colors"
          >
            Đóng hóa đơn
          </button>
        </div>
      </div>
    </div>
  );
};
