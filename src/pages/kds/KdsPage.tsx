import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  ChefHat,
  Volume2,
  VolumeX,
  ArrowRight,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import { formatTime } from '../../utils/formatters';
import { OrderService } from '../../services/orderService';

export const KdsPage: React.FC = () => {
  const { orders, updateOrderStatus, setActiveReceiptOrder } = useStore();
  const [kdsOrders, setKdsOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'waiting' | 'preparing' | 'completed'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKdsOrders = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const data = await OrderService.getKdsOrders();
      setKdsOrders(data);
    } catch (err: any) {
      console.warn('[KDS] Lỗi đồng bộ KDS:', err.message);
      setError('Không thể kết nối đến hệ thống KDS.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchKdsOrders();
    const pollTimer = setInterval(fetchKdsOrders, 8000);
    const clockTimer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => {
      clearInterval(pollTimer);
      clearInterval(clockTimer);
    };
  }, [fetchKdsOrders]);

  const displayedOrders = kdsOrders.length > 0 ? kdsOrders : orders.filter((o) => o.status !== 'cancelled');

  const filteredOrders = displayedOrders.filter((o) => {
    if (activeTab === 'all') return o.status !== 'cancelled';
    if (activeTab === 'waiting') return o.status === 'waiting' || o.status === 'pending';
    return o.status === activeTab;
  });

  const waitingCount = displayedOrders.filter((o) => o.status === 'waiting' || o.status === 'pending').length;
  const preparingCount = displayedOrders.filter((o) => o.status === 'preparing').length;
  const completedCount = displayedOrders.filter((o) => o.status === 'completed').length;

  const getElapsedMinutes = (dateString: string) => {
    const diffMs = currentTime - new Date(dateString).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const handleAdvanceStatus = async (order: Order) => {
    try {
      if (order.status === 'waiting' || order.status === 'pending') {
        await OrderService.startKdsOrder(order.id);
        await updateOrderStatus(order.id, 'preparing');
      } else if (order.status === 'preparing') {
        await OrderService.completeKdsOrder(order.id);
        await updateOrderStatus(order.id, 'completed');
      }
      await fetchKdsOrders();
    } catch (err: any) {
      console.error('[KDS] Lỗi chuyển trạng thái đơn:', err.message);
    }
  };

  const getOrderTypeLabel = (t: string) => {
    if (t === 'dine_in') return 'Tại quán';
    if (t === 'takeaway') return 'Mang về';
    return 'Giao hàng';
  };

  const getSizeLabel = (sz: string) => {
    if (sz === 'small') return 'Size Nhỏ (S)';
    if (sz === 'medium') return 'Size Vừa (M)';
    return 'Size Lớn (L)';
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-[#101A15] text-[#E2EBE5] p-4 sm:p-6 space-y-6">
      {/* Thanh tiêu đề KDS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#21352A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2D6A4F] flex items-center justify-center text-white shadow-md">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Outfit'] font-bold text-xl sm:text-2xl text-white tracking-tight">
                Màn hình pha chế (KDS)
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#2D6A4F]/40 border border-[#40916C]/60 text-xs font-mono text-[#95D5B2]">
                QUẦY BARISTA
              </span>
            </div>
            <p className="text-xs text-[#889C92]">
              Điều phối pha chế trực tiếp &bull; Tự động đồng bộ với Thu ngân và Khách hàng
            </p>
          </div>
        </div>

        {/* Bộ lọc trạng thái & Chuông báo */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-[#182820] rounded-xl border border-[#21352A]">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'text-[#889C92] hover:text-white'
              }`}
            >
              Tất cả ({waitingCount + preparingCount})
            </button>
            <button
              onClick={() => setActiveTab('waiting')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'waiting'
                  ? 'bg-[#EA580C] text-white shadow-xs'
                  : 'text-[#889C92] hover:text-white'
              }`}
            >
              <span>Đơn mới</span>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] tabular-nums">
                {waitingCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('preparing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'preparing'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#889C92] hover:text-white'
              }`}
            >
              <span>Đang pha</span>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] tabular-nums">
                {preparingCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'completed'
                  ? 'bg-[#15803D] text-white shadow-xs'
                  : 'text-[#889C92] hover:text-white'
              }`}
            >
              Hoàn thành ({completedCount})
            </button>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-[#182820] border border-[#21352A] text-[#889C92] hover:text-white transition-colors"
            title={soundEnabled ? 'Chuông báo đơn mới: Bật' : 'Chuông báo: Tắt'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#40916C]" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Lưới các phiếu đơn pha chế */}
      {filteredOrders.length === 0 ? (
        <div className="p-16 rounded-2xl border border-dashed border-[#21352A] bg-[#14231B] text-center space-y-3">
          <ChefHat className="w-10 h-10 text-[#40916C] mx-auto opacity-60" />
          <h3 className="text-base font-bold text-white">Quầy pha chế đang trống đơn</h3>
          <p className="text-xs text-[#889C92]">
            Đơn mới từ quầy thu ngân hoặc khách đặt online sẽ tự động xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOrders.map((order) => {
            const elapsed = getElapsedMinutes(order.createdAt);
            const isUrgent = elapsed >= 5 && order.status !== 'completed';

            let borderClass = 'border-[#21352A]';
            let statusBadge = (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F2EDE2]/10 text-[#D8E2DC]">
                {order.status}
              </span>
            );

            if (order.status === 'waiting' || order.status === 'pending') {
              borderClass = isUrgent ? 'border-[#EA580C] ring-1 ring-[#EA580C]' : 'border-[#EA580C]/60';
              statusBadge = (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#EA580C] text-white tracking-wider animate-pulse">
                  Đơn mới ({elapsed} phút)
                </span>
              );
            } else if (order.status === 'preparing') {
              borderClass = 'border-[#2563EB] ring-1 ring-[#2563EB]/40';
              statusBadge = (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#2563EB] text-white tracking-wider">
                  Đang pha ({elapsed} phút)
                </span>
              );
            } else if (order.status === 'completed') {
              borderClass = 'border-[#15803D]/60 opacity-80';
              statusBadge = (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#15803D] text-white tracking-wider">
                  Đã xong
                </span>
              );
            }

            return (
              <div
                key={order.id}
                className={`bg-[#16251E] rounded-2xl border ${borderClass} p-4 flex flex-col justify-between space-y-4 shadow-lg transition-all`}
              >
                {/* Đầu phiếu đơn */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-extrabold text-white">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs text-[#889C92]">
                        {getOrderTypeLabel(order.orderType)}
                      </span>
                    </div>
                    {statusBadge}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#889C92] pt-1 border-t border-[#21352A]">
                    <span className="font-semibold text-[#E2EBE5]">
                      {order.customerName} {order.tableNumber ? `&bull; ${order.tableNumber}` : ''}
                    </span>
                    <span className="tabular-nums flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#40916C]" />
                      {formatTime(order.createdAt)}
                    </span>
                  </div>

                  {order.notes && (
                    <div className="p-2 rounded-lg bg-[#2A1810] border border-[#EA580C]/30 text-[11px] text-[#FED7AA]">
                      <span className="font-bold">GHI CHÚ:</span> {order.notes}
                    </div>
                  )}
                </div>

                {/* Danh sách món & Công thức pha chế */}
                <div className="space-y-2.5 py-2 border-t border-b border-[#21352A] flex-1">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-[#1A2D23] border border-[#233D30] space-y-1"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-bold text-white">
                          {item.quantity}x {item.drink.name}
                        </span>
                        <span className="text-[11px] font-mono text-[#40916C] uppercase px-1.5 py-0.2 rounded bg-[#101A15]">
                          {getSizeLabel(item.size)}
                        </span>
                      </div>

                      {/* Thông số Đường & Đá rõ ràng */}
                      <div className="flex flex-wrap gap-1 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-[#2D6A4F]/40 text-[#95D5B2] font-semibold">
                          Đường: {item.sugar}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#2D6A4F]/40 text-[#95D5B2] font-semibold">
                          Đá: {item.ice === 'no_ice' ? 'Không đá' : item.ice === 'less_ice' ? 'Ít đá' : item.ice === 'regular' ? 'Bình thường' : 'Nhiều đá'}
                        </span>
                        {item.boosters.map((b) => (
                          <span
                            key={b.id}
                            className="px-1.5 py-0.5 rounded bg-[#F59E0B]/20 text-[#FDE047] font-semibold"
                          >
                            +{b.name}
                          </span>
                        ))}
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-[#EA580C] italic">
                          &bull; {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Nút thao tác nhanh Barista */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setActiveReceiptOrder(order)}
                    className="p-2.5 rounded-xl border border-[#21352A] hover:bg-[#1A2D23] text-xs font-semibold text-[#889C92] hover:text-white transition-colors"
                    title="Chi tiết phiếu"
                  >
                    Xem phiếu
                  </button>

                  {(order.status === 'waiting' || order.status === 'pending') && (
                    <button
                      onClick={() => handleAdvanceStatus(order)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <span>Bắt đầu pha</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleAdvanceStatus(order)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Hoàn thành món</span>
                    </button>
                  )}

                  {order.status === 'completed' && (
                    <div className="flex-1 py-2 text-center text-xs font-semibold text-[#40916C] bg-[#14261D] rounded-xl border border-[#21352A]">
                      Đã phục vụ khách
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
