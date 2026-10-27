import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  Printer,
  Coffee,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../../context/StoreContext';
import { BeverageIllustration } from '../../components/common/BeverageIllustration';
import { Category, Drink, OrderType, PaymentMethod } from '../../types';
import { formatVND } from '../../utils/formatters';

export const PosPage: React.FC = () => {
  const {
    products,
    openDrinkModal,
    cart,
    addToCart,
    removeFromCart,
    updateCartItemQty,
    clearCart,
    cartSubtotal,
    cartTotal,
    createOrder,
    setActiveReceiptOrder,
  } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [posSearch, setPosSearch] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [tableNumber, setTableNumber] = useState('Bàn 01');
  const [customerName, setCustomerName] = useState('Khách vãng lai');
  const [customerPhone, setCustomerPhone] = useState('');
  const [staffNotes, setStaffNotes] = useState('');

  // Giảm giá
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Modal thanh toán
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>('100000');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (
        posSearch &&
        !p.name.toLowerCase().includes(posSearch.toLowerCase()) &&
        !p.ingredients.some((i) => i.toLowerCase().includes(posSearch.toLowerCase()))
      ) {
        return false;
      }
      return true;
    });
  }, [products, selectedCategory, posSearch]);

  const payableTotal = Math.max(0, cartTotal - discountAmount);
  const cashNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, cashNum - payableTotal);

  const handleQuickAdd = (drink: Drink) => {
    addToCart({
      drinkId: drink.id,
      drink,
      size: 'medium',
      sugar: '50%',
      ice: 'regular',
      boosters: [],
      unitPrice: drink.basePrice + 5000,
      quantity: 1,
    });
  };

  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    // Suggest round VND denomination
    const suggestedCash = payableTotal <= 50000 ? '50000' : payableTotal <= 100000 ? '100000' : payableTotal <= 200000 ? '200000' : '500000';
    setCashTendered(suggestedCash);
    setPaymentModalOpen(true);
  };

  const handleCompleteOrder = async () => {
    const order = await createOrder({
      customerName: customerName || 'Khách vãng lai',
      customerPhone: customerPhone || undefined,
      tableNumber: orderType === 'dine_in' ? tableNumber : undefined,
      orderType,
      items: [...cart],
      subtotal: cartSubtotal,
      discount: discountAmount,
      tax: 0,
      totalAmount: payableTotal,
      status: 'waiting',
      paymentMethod,
      paymentStatus: 'paid',
      cashGiven: paymentMethod === 'cash' ? cashNum : undefined,
      changeDue: paymentMethod === 'cash' ? changeDue : undefined,
      estimatedMinutes: 3 + cart.length * 2,
      notes: staffNotes.trim() || undefined,
    });

    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.5 },
      });
    } catch {
      // ignore
    }

    clearCart();
    setPaymentModalOpen(false);
    setStaffNotes('');
    setDiscountAmount(0);
    setActiveReceiptOrder(order);
  };

  return (
    <div className="h-[calc(100dvh-4rem)] flex flex-col md:flex-row bg-[#F7F5ED] overflow-hidden">
      {/* CỘT TRÁI: Thực đơn chọn món & Phân loại */}
      <div className="flex-1 flex flex-col h-full border-r border-[#E5DFCE] overflow-hidden">
        {/* Thanh công cụ tìm kiếm & Danh mục */}
        <div className="p-3 sm:p-4 bg-white border-b border-[#E5DFCE] flex flex-wrap items-center justify-between gap-3">
          {/* Tabs danh mục */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F2EDE2] rounded-xl overflow-x-auto max-w-full">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'smoothie', label: 'Sinh tố' },
              { id: 'fresh_juice', label: 'Nước ép' },
              { id: 'combo_drinks', label: 'Combo' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id as Category | 'all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  selectedCategory === c.id
                    ? 'bg-[#2D6A4F] text-white shadow-xs'
                    : 'text-[#5D7067] hover:text-[#1B4332]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Ô tìm kiếm món */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#889C92]" />
            <input
              type="text"
              placeholder="Tìm nhanh món uống..."
              value={posSearch}
              onChange={(e) => setPosSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#E5DFCE] focus:border-[#2D6A4F] focus:outline-hidden bg-[#FAF8F2]"
            />
          </div>
        </div>

        {/* Lưới sản phẩm POS */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-max gap-3 sm:gap-4 content-start">
          {filteredProducts.map((drink) => (
            <div
              key={drink.id}
              className="min-h-[218px] bg-white rounded-xl border border-[#E5DFCE] hover:border-[#2D6A4F] hover:shadow-md transition-all flex flex-col overflow-hidden group select-none"
            >
              <div
                onClick={() => openDrinkModal(drink)}
                className={`h-32 shrink-0 cursor-pointer p-2 bg-gradient-to-b ${drink.bgGradient} flex items-center justify-center relative overflow-hidden`}
              >
                <BeverageIllustration drink={drink} size="sm" />
                <span className="absolute top-2 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/90 text-[#1B4332]">
                  {drink.prepTimeMin}p
                </span>
              </div>

              <div className="min-h-[90px] p-3 space-y-1.5 flex-1 flex flex-col justify-between bg-white">
                <div>
                  <h4 className="text-xs font-bold text-[#1B4332] line-clamp-1">{drink.name}</h4>
                  <p className="text-[10px] text-[#5D7067] truncate">{drink.ingredients.slice(0, 2).join(', ')}</p>
                </div>

                <div className="pt-2 border-t border-[#F2EDE2] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#EA580C] font-sans tabular-nums">
                    {formatVND(drink.basePrice)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openDrinkModal(drink)}
                      className="px-2 py-1 text-[10px] font-semibold text-[#5D7067] hover:text-[#1B4332] bg-[#FAF8F2] hover:bg-[#F2EDE2] rounded border border-[#E5DFCE]"
                    >
                      Tùy chỉnh
                    </button>
                    <button
                      onClick={() => handleQuickAdd(drink)}
                      className="p-1 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded transition-colors"
                      title="Thêm nhanh Size Vừa"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CỘT PHẢI: Bảng đơn hàng hiện tại (Order Ticket Panel) */}
      <div className="w-full md:w-96 bg-white h-full flex flex-col border-t md:border-t-0 border-[#E5DFCE] shadow-lg">
        {/* Tiêu đề & Thông tin khách */}
        <div className="p-3.5 border-b border-[#E5DFCE] bg-[#FCFBF7] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-sans font-bold text-sm text-[#1B4332]">Đơn hàng hiện tại</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E2F1E9] text-[#1B4332] font-semibold">
                QUẦY THU NGÂN
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-[#DC2626] hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Hủy đơn
              </button>
            )}
          </div>

          {/* Hình thức & Bàn */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#F2EDE2] rounded-lg text-xs">
            {[
              { id: 'dine_in', label: 'Tại quán' },
              { id: 'takeaway', label: 'Mang về' },
              { id: 'delivery', label: 'Giao hàng' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setOrderType(t.id as OrderType)}
                className={`py-1 text-[11px] font-semibold rounded transition-all ${
                  orderType === t.id ? 'bg-white text-[#1B4332] shadow-xs' : 'text-[#5D7067]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <input
              type="text"
              placeholder="Tên khách hàng"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="px-2.5 py-1.5 rounded-md border border-[#E5DFCE] bg-[#FAF8F2] text-[#1B4332]"
            />
            {orderType === 'dine_in' ? (
              <select
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="px-2 py-1.5 rounded-md border border-[#E5DFCE] bg-[#FAF8F2] text-[#1B4332]"
              >
                <option value="Bàn 01">Bàn 01 (Sân)</option>
                <option value="Bàn 02">Bàn 02 (Bàn đôi)</option>
                <option value="Bàn 03">Bàn 03 (Cửa sổ)</option>
                <option value="Bàn 04">Bàn 04 (Gia đình)</option>
                <option value="Bàn 05">Bàn 05 (Quầy bar)</option>
              </select>
            ) : (
              <input
                type="text"
                placeholder="Số điện thoại"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="px-2.5 py-1.5 rounded-md border border-[#E5DFCE] bg-[#FAF8F2] text-[#1B4332]"
              />
            )}
          </div>
        </div>

        {/* Danh sách món trong đơn */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#889C92] space-y-2">
              <Coffee className="w-8 h-8 stroke-[1.5]" />
              <p className="text-xs font-medium">Đơn hàng chưa có món</p>
              <p className="text-[11px]">Chạm vào món trong thực đơn để thêm vào phiếu thu ngân.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl border border-[#E5DFCE] bg-[#FAF8F2] text-xs space-y-1.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-bold text-[#1B4332]">{item.drink.name}</h5>
                    <p className="text-[10px] text-[#5D7067]">
                      {item.size === 'small' ? 'Size Nhỏ' : item.size === 'medium' ? 'Size Vừa' : 'Size Lớn'} &bull; Đường {item.sugar} &bull; {item.ice === 'no_ice' ? 'Không đá' : item.ice === 'less_ice' ? 'Ít đá' : item.ice === 'regular' ? 'Đá vừa' : 'Nhiều đá'}
                    </p>
                    {item.boosters.length > 0 && (
                      <p className="text-[10px] text-[#40916C]">
                        +{item.boosters.map((b) => b.name).join(', ')}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-[10px] text-[#EA580C] italic">Ghi chú: {item.notes}</p>
                    )}
                  </div>
                  <span className="font-bold text-[#1B4332] tabular-nums">
                    {formatVND(item.unitPrice * item.quantity)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#E5DFCE]/60">
                  <div className="flex items-center gap-1.5 bg-white border border-[#E5DFCE] rounded-md px-1">
                    <button
                      onClick={() => updateCartItemQty(item.id, -1)}
                      className="p-1 text-[#5D7067] hover:text-[#1B4332]"
                      aria-label="Giảm"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-4 text-center font-bold tabular-nums">{item.quantity}</span>
                    <button
                      onClick={() => updateCartItemQty(item.id, 1)}
                      className="p-1 text-[#5D7067] hover:text-[#1B4332]"
                      aria-label="Tăng"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-[#889C92] hover:text-[#DC2626] p-1"
                    title="Xóa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tạm tính, Giảm giá & Nút Thanh toán */}
        {cart.length > 0 && (
          <div className="p-3.5 border-t border-[#E5DFCE] bg-[#FCFBF7] space-y-2.5">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[#5D7067]">
                <span>Tạm tính</span>
                <span className="tabular-nums font-medium">{formatVND(cartSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-[#5D7067]">
                <span>Giảm giá (₫)</span>
                <input
                  type="number"
                  step="5000"
                  min="0"
                  max={cartSubtotal}
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 text-right px-1.5 py-0.5 rounded border border-[#E5DFCE] bg-white text-xs tabular-nums text-[#2D6A4F] font-bold"
                />
              </div>
              <div className="pt-1.5 border-t border-[#E5DFCE] flex justify-between font-bold text-sm text-[#1B4332]">
                <span>Tổng cộng</span>
                <span className="font-sans text-base tabular-nums text-[#EA580C]">
                  {formatVND(payableTotal)}
                </span>
              </div>
            </div>

            <button
              onClick={handleOpenPayment}
              className="w-full py-3 bg-[#2D6A4F] hover:bg-[#1B4332] active:scale-98 text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-between px-4"
            >
              <span>Thanh toán đơn hàng</span>
              <span className="font-sans text-sm tabular-nums">{formatVND(payableTotal)}</span>
            </button>
          </div>
        )}
      </div>

      {/* MODAL THANH TOÁN (TIỀN MẶT / CHUYỂN KHOẢN VIETQR / THẺ) */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5DFCE] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2EDE2]">
              <div>
                <h3 className="font-sans font-bold text-base text-[#1B4332]">
                  Thanh toán &amp; Xuất hóa đơn
                </h3>
                <p className="text-xs text-[#5D7067]">Số tiền cần thanh toán: {formatVND(payableTotal)}</p>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-[#889C92] hover:text-[#1B4332] text-xs font-semibold"
              >
                Hủy bỏ
              </button>
            </div>

            {/* Chọn hình thức */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'Tiền mặt', icon: Banknote },
                { id: 'qr_code', label: 'Chuyển khoản (VietQR)', icon: QrCode },
                { id: 'card', label: 'Thẻ ngân hàng', icon: CreditCard },
              ].map((pm) => {
                const Icon = pm.icon;
                const isSelected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition-all ${
                      isSelected
                        ? 'border-[#2D6A4F] bg-[#F2F8F5] text-[#1B4332] font-bold ring-1 ring-[#2D6A4F]'
                        : 'border-[#E5DFCE] text-[#5D7067] hover:bg-[#FAF8F2]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="line-clamp-1">{pm.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tính tiền thối khi nhận Tiền mặt */}
            {paymentMethod === 'cash' && (
              <div className="p-3.5 rounded-xl bg-[#F7F4EA] border border-[#E5DFCE] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1B4332]">Tiền khách đưa (₫):</label>
                  <input
                    type="number"
                    step="10000"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-32 text-right px-2.5 py-1 rounded-lg border border-[#E5DFCE] bg-white font-bold text-xs tabular-nums text-[#1B4332]"
                  />
                </div>

                {/* Các mệnh giá tiền Việt Nam phổ biến */}
                <div className="flex items-center gap-1.5">
                  {[50000, 100000, 200000, 500000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setCashTendered(String(amt))}
                      className="flex-1 py-1 bg-white border border-[#E5DFCE] hover:border-[#2D6A4F] text-[11px] font-semibold rounded text-[#1B4332]"
                    >
                      {formatVND(amt)}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#DED6C3] flex items-center justify-between text-xs font-bold">
                  <span className="text-[#5D7067]">Tiền thối lại cho khách:</span>
                  <span className="text-sm font-sans text-[#EA580C] tabular-nums">
                    {formatVND(changeDue)}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === 'qr_code' && (
              <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#E5DFCE] text-center space-y-2">
                <div className="w-32 h-32 mx-auto bg-white p-2 rounded-lg border border-[#E5DFCE] flex items-center justify-center">
                  <QrCode className="w-28 h-28 text-[#1B4332]" />
                </div>
                <p className="text-xs font-semibold text-[#1B4332]">Quét mã VietQR chuyển khoản ngân hàng</p>
                <p className="text-[11px] text-[#5D7067]">Hỗ trợ mọi App ngân hàng &amp; ví điện tử (MoMo, ZaloPay)</p>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="p-4 rounded-xl bg-[#F2F8F5] border border-[#C5E3D3] text-center space-y-2">
                <CreditCard className="w-8 h-8 text-[#2D6A4F] mx-auto animate-pulse" />
                <p className="text-xs font-semibold text-[#1B4332]">Quẹt hoặc chạm thẻ vào máy POS</p>
                <p className="text-[11px] text-[#5D7067]">Hỗ trợ thẻ ATM nội địa Napas, Visa, Mastercard</p>
              </div>
            )}

            {/* Nút xác nhận thanh toán */}
            <button
              onClick={handleCompleteOrder}
              disabled={paymentMethod === 'cash' && cashNum < payableTotal}
              className="w-full py-3 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Xác nhận thu tiền &amp; In hóa đơn</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
