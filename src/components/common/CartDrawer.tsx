import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle,
  Tag,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../../context/StoreContext';
import { OrderType, PaymentMethod } from '../../types';
import { formatVND } from '../../utils/formatters';
import { PromotionService } from '../../services/promotionService';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateCartItemQty,
    clearCart,
    cartSubtotal,
    cartTotal,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    createOrder,
    currentUser,
    setActiveReceiptOrder,
  } = useStore();

  const navigate = useNavigate();

  const [orderType, setOrderType] = useState<OrderType>('takeaway');
  const [tableNumber, setTableNumber] = useState('Bàn 01');
  const [customerName, setCustomerName] = useState(currentUser?.name || 'Khách vãng lai');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '0901234567');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qr_code');
  const [orderNotes, setOrderNotes] = useState('');

  // Mã giảm giá
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCartDrawerOpen) return null;

  useEffect(() => {
    setAppliedDiscount(0);
    setAppliedCode('');
  }, [cartSubtotal]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setIsCheckingCoupon(true);
    try {
      const result = await PromotionService.validate(code, cartSubtotal);
      setAppliedDiscount(result.discount);
      setAppliedCode(result.promotion.code);
    } catch (error: any) {
      setAppliedDiscount(0);
      setAppliedCode('');
      setCouponError(error.message || 'Mã khuyến mãi không hợp lệ');
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const finalTotal = Math.max(0, cartTotal - appliedDiscount);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    try {
      const order = await createOrder({
        customerName: customerName || 'Khách vãng lai',
        customerPhone: customerPhone || undefined,
        tableNumber: orderType === 'dine_in' ? tableNumber : undefined,
        orderType,
        items: [...cart],
        subtotal: cartSubtotal,
        discount: appliedDiscount,
        promotionCode: appliedCode || undefined,
        tax: 0,
        totalAmount: finalTotal,
        status: 'waiting',
        paymentMethod,
        paymentStatus: 'paid',
        estimatedMinutes: 3 + cart.length * 2,
        notes: orderNotes.trim() || undefined,
      });

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#2D6A4F', '#40916C', '#F97316', '#FBBF24'],
        });
      } catch {
        // fallback
      }

      clearCart();
      setIsCartDrawerOpen(false);
      setActiveReceiptOrder(order);
      navigate('/track');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSizeLabel = (sz: string) => {
    if (sz === 'small') return 'Size Nhỏ';
    if (sz === 'medium') return 'Size Vừa';
    return 'Size Lớn';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-[#E5DFCE] animate-in slide-in-from-right duration-250">
        {/* Tiêu đề giỏ hàng */}
        <div className="p-4 border-b border-[#E5DFCE] flex items-center justify-between bg-[#FCFBF7]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#E2F1E9] text-[#1B4332]">
              <ShoppingBag className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-[#1B4332] font-sans">Giỏ hàng của bạn</h2>
              <p className="text-[11px] text-[#5D7067] tabular-nums">
                {cart.length} món đang chọn
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCartDrawerOpen(false)}
            className="p-1.5 text-[#5D7067] hover:text-[#1B4332] hover:bg-[#F2EDE2] rounded-lg transition-colors"
            aria-label="Đóng giỏ hàng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Danh sách món hoặc trạng thái trống */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#F7F4EA] flex items-center justify-center text-[#2D6A4F] border border-[#E5DFCE]">
                <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="font-sans font-bold text-base text-[#1B4332]">
                Giỏ hàng đang trống
              </h3>
              <p className="text-xs text-[#5D7067] max-w-xs leading-relaxed">
                Mời bạn chọn các món sinh tố bơ, xoài, dâu tây hay nước ép cam sành tươi mát tại thực đơn.
              </p>
              <button
                onClick={() => {
                  setIsCartDrawerOpen(false);
                  navigate('/menu');
                }}
                className="mt-2 px-4 py-2 bg-[#2D6A4F] text-white text-xs font-semibold rounded-xl hover:bg-[#1B4332] transition-colors"
              >
                Xem thực đơn ngay
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-[#E5DFCE] bg-[#FAF8F2] space-y-2 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-[#1B4332]">{item.drink.name}</h4>
                    <p className="text-[11px] text-[#5D7067] mt-0.5">
                      {getSizeLabel(item.size)} &bull; Đường {item.sugar} &bull; {item.ice === 'no_ice' ? 'Không đá' : item.ice === 'less_ice' ? 'Ít đá' : item.ice === 'regular' ? 'Đá vừa' : 'Nhiều đá'}
                    </p>

                    {item.boosters.length > 0 && (
                      <p className="text-[10px] text-[#40916C] font-medium mt-0.5">
                        +{item.boosters.map((b) => b.name).join(', ')}
                      </p>
                    )}

                    {item.notes && (
                      <p className="text-[10px] text-[#EA580C] italic mt-0.5">
                        Ghi chú: &ldquo;{item.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <span className="text-xs font-bold text-[#1B4332] tabular-nums">
                    {formatVND(item.unitPrice * item.quantity)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#E5DFCE]/60">
                  <div className="flex items-center gap-1.5 bg-white border border-[#E5DFCE] rounded-md p-0.5">
                    <button
                      onClick={() => updateCartItemQty(item.id, -1)}
                      className="p-1 text-[#5D7067] hover:text-[#1B4332] hover:bg-[#F7F4EA] rounded-sm transition-colors"
                      aria-label="Giảm số lượng"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-semibold tabular-nums text-[#1B4332]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartItemQty(item.id, 1)}
                      className="p-1 text-[#5D7067] hover:text-[#1B4332] hover:bg-[#F7F4EA] rounded-sm transition-colors"
                      aria-label="Tăng số lượng"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1 text-[#889C92] hover:text-[#DC2626] transition-colors"
                    title="Xóa món"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}

          {cart.length > 0 && (
            <div className="pt-2 space-y-4">
              {/* Hình thức phục vụ */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1B4332] mb-1.5">
                  Hình thức phục vụ
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#F2EDE2] rounded-lg">
                  {[
                    { id: 'dine_in', label: 'Tại quán' },
                    { id: 'takeaway', label: 'Mang về' },
                    { id: 'delivery', label: 'Giao hàng' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setOrderType(t.id as OrderType)}
                      className={`py-1 text-xs font-semibold rounded-md transition-all ${
                        orderType === t.id
                          ? 'bg-white text-[#1B4332] shadow-xs'
                          : 'text-[#5D7067] hover:text-[#1B4332]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chọn Bàn nếu dùng tại quán */}
              {orderType === 'dine_in' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1B4332] mb-1">
                    Số bàn
                  </label>
                  <select
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#E5DFCE] bg-white text-[#1B4332]"
                  >
                    <option value="Bàn 01">Bàn 01 (Khu vực sân trước)</option>
                    <option value="Bàn 02">Bàn 02 (Bàn đôi trong nhà)</option>
                    <option value="Bàn 03">Bàn 03 (Cạnh cửa sổ kính)</option>
                    <option value="Bàn 04">Bàn 04 (Bàn gia đình 4 người)</option>
                    <option value="Bàn 05">Bàn 05 (Quầy bar)</option>
                  </select>
                </div>
              )}

              {/* Thông tin khách hàng */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1B4332] mb-1">
                    Tên khách hàng
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nguyễn Văn An"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#E5DFCE] bg-white text-[#1B4332]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1B4332] mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#E5DFCE] bg-white text-[#1B4332]"
                  />
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1B4332] mb-1.5">
                  Phương thức thanh toán
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'cash', label: 'Tiền mặt', icon: Banknote },
                    { id: 'qr_code', label: 'Chuyển khoản (VietQR)', icon: QrCode },
                    { id: 'card', label: 'Thẻ ngân hàng', icon: CreditCard },
                  ].map((p) => {
                    const Icon = p.icon;
                    const isSelected = paymentMethod === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPaymentMethod(p.id as PaymentMethod)}
                        className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center gap-1 text-[11px] ${
                          isSelected
                            ? 'border-[#2D6A4F] bg-[#F2F8F5] font-bold text-[#1B4332] ring-1 ring-[#2D6A4F]'
                            : 'border-[#E5DFCE] text-[#5D7067] hover:bg-[#FAF8F2]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="line-clamp-1">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mã giảm giá */}
              <div>
                <form onSubmit={handleApplyCoupon} className="flex gap-1.5">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#889C92]" />
                    <input
                      type="text"
                      placeholder="Mã giảm giá (ví dụ: TUOIMOINGAY)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-lg border border-[#E5DFCE] bg-white text-[#1B4332] uppercase placeholder:normal-case"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isCheckingCoupon}
                    className="px-3 py-1.5 bg-[#FAF8F2] border border-[#E5DFCE] text-xs font-semibold rounded-lg hover:bg-[#F2EDE2] text-[#1B4332]"
                  >
                    {isCheckingCoupon ? 'Đang kiểm tra' : 'Áp dụng'}
                  </button>
                </form>
                {appliedDiscount > 0 && (
                  <p className="text-[11px] text-[#2D6A4F] mt-1 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Đã áp dụng giảm -{formatVND(appliedDiscount)}
                  </p>
                )}
                {couponError && (
                  <p className="text-[11px] text-[#DC2626] mt-1">{couponError}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tổng tiền & Nút xác nhận đơn */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-[#E5DFCE] bg-[#FCFBF7] space-y-3">
            <div className="space-y-1 text-xs text-[#5D7067]">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span className="tabular-nums font-medium text-[#1B4332]">
                  {formatVND(cartSubtotal)}
                </span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-[#2D6A4F] font-medium">
                  <span>Giảm giá khuyến mãi</span>
                  <span className="tabular-nums">-{formatVND(appliedDiscount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-[#E5DFCE] flex justify-between text-sm font-bold text-[#1B4332]">
                <span>Tổng thanh toán</span>
                <span className="text-base font-sans tabular-nums text-[#EA580C]">
                  {formatVND(finalTotal)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] active:scale-98 text-white font-semibold text-xs transition-all shadow-sm disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Đang gửi đơn hàng...' : 'Xác nhận & Gửi pha chế'}</span>
              <div className="flex items-center gap-1">
                <span className="tabular-nums text-sm">{formatVND(finalTotal)}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
