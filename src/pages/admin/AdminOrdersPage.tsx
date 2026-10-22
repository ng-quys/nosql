import React, { useState, useEffect } from 'react';
import { Search, Receipt, AlertCircle, RefreshCw } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus, OrderType } from '../../types';
import { formatVND, formatDate, formatTime } from '../../utils/formatters';
import { OrderService } from '../../services/orderService';

export const AdminOrdersPage: React.FC = () => {
  const { orders: storeOrders, updateOrderStatus: storeUpdateStatus, setActiveReceiptOrder } = useStore();

  const [realOrders, setRealOrders] = useState<Order[]>(storeOrders);
  const [loading, setLoading] = useState(storeOrders.length === 0);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<OrderType | 'all'>('all');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await OrderService.getOrders();
      setRealOrders(data);
    } catch (err: any) {
      console.warn('[AdminOrdersPage] Lỗi tải đơn hàng từ MongoDB:', err.message);
      setError('Không thể tải danh sách đơn hàng từ máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (storeOrders.length > 0) {
      setRealOrders(storeOrders);
    }
  }, [storeOrders]);

  const activeOrders = realOrders.length > 0 ? realOrders : storeOrders;

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await OrderService.updateOrderStatus(orderId, newStatus);
      await storeUpdateStatus(orderId, newStatus);
      await fetchOrders();
    } catch (err: any) {
      console.error('[AdminOrdersPage] Lỗi cập nhật trạng thái đơn:', err.message);
    }
  };

  const filteredOrders = activeOrders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (typeFilter !== 'all' && o.orderType !== typeFilter) return false;
    if (
      search &&
      !o.orderNumber.toLowerCase().includes(search.toLowerCase()) &&
      !o.customerName.toLowerCase().includes(search.toLowerCase()) &&
      !o.items.some((i) => i.drink?.name?.toLowerCase().includes(search.toLowerCase()) || (i as any).name?.toLowerCase().includes(search.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const getOrderTypeLabel = (t: string) => {
    if (t === 'dine_in') return 'Tại quán';
    if (t === 'takeaway') return 'Mang về';
    return 'Giao hàng';
  };

  const getPaymentMethodLabel = (pm: string) => {
    if (pm === 'cash') return 'Tiền mặt';
    if (pm === 'qr_code') return 'Chuyển khoản';
    return 'Thẻ';
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchOrders}
            className="px-3 py-1 bg-[#BE123C] text-white rounded-lg font-semibold hover:bg-[#9F1239] inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* Tìm kiếm & Lọc trạng thái */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-[#F2EDE2] rounded-xl text-xs">
            {[
              { id: 'all', label: 'Tất cả đơn' },
              { id: 'waiting', label: 'Đơn mới' },
              { id: 'preparing', label: 'Đang pha' },
              { id: 'completed', label: 'Hoàn thành' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id as OrderStatus | 'all')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                  statusFilter === s.id ? 'bg-white text-[#1B4332] shadow-xs' : 'text-[#5D7067]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#889C92]" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn hoặc tên khách..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#E5DFCE] bg-white text-[#1B4332]"
            />
          </div>
        </div>

        <span className="text-xs text-[#889C92] tabular-nums">
          Hiển thị {filteredOrders.length} trên tổng {activeOrders.length} đơn hàng
        </span>
      </div>

      {/* Bảng đơn hàng */}
      <div className="bg-white rounded-2xl border border-[#E5DFCE] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F2] border-b border-[#E5DFCE] text-[#5D7067] uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Mã đơn &amp; Giờ</th>
                <th className="py-3 px-4">Khách hàng &amp; Bàn</th>
                <th className="py-3 px-4">Món uống đã chọn</th>
                <th className="py-3 px-4">Tổng tiền thanh toán</th>
                <th className="py-3 px-4">Trạng thái pha chế</th>
                <th className="py-3 px-4 text-right">Xem hóa đơn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EDE2]">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#FCFBF7] transition-colors">
                  <td className="py-3.5 px-4 font-mono">
                    <p className="font-bold text-[#1B4332]">{ord.orderNumber}</p>
                    <p className="text-[10px] text-[#889C92] tabular-nums">
                      {formatDate(ord.createdAt)} {formatTime(ord.createdAt)}
                    </p>
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-[#1B4332]">{ord.customerName}</p>
                    <p className="text-[11px] text-[#5D7067]">
                      {getOrderTypeLabel(ord.orderType)} {ord.tableNumber ? `(${ord.tableNumber})` : ''}
                    </p>
                    {ord.customerPhone && (
                      <p className="text-[10px] text-[#889C92] tabular-nums">{ord.customerPhone}</p>
                    )}
                  </td>

                  <td className="py-3.5 px-4 max-w-xs space-y-1">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="text-[11px] text-[#2D3F37]">
                        <span className="font-semibold">{it.quantity}x {it.drink.name}</span>
                        <span className="text-[#889C92] ml-1">
                          ({it.size === 'small' ? 'Nhỏ' : it.size === 'medium' ? 'Vừa' : 'Lớn'}, {it.sugar} đường, {it.ice === 'no_ice' ? 'không đá' : it.ice === 'less_ice' ? 'ít đá' : it.ice === 'regular' ? 'đá vừa' : 'nhiều đá'})
                        </span>
                      </div>
                    ))}
                    {ord.notes && (
                      <p className="text-[10px] text-[#EA580C] italic">Ghi chú: {ord.notes}</p>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="font-bold text-sm font-['Outfit'] text-[#1B4332] tabular-nums">
                      {formatVND(ord.totalAmount)}
                    </p>
                    <span className="text-[10px] font-semibold text-[#40916C]">
                      {getPaymentMethodLabel(ord.paymentMethod)} &bull; Đã thanh toán
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <select
                      value={ord.status}
                      onChange={(e) => handleStatusChange(ord.id, e.target.value as OrderStatus)}
                      className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition-colors ${
                        ord.status === 'completed'
                          ? 'bg-[#E2F1E9] text-[#2D6A4F] border-[#C5E3D3]'
                          : ord.status === 'preparing'
                          ? 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]'
                          : ord.status === 'waiting'
                          ? 'bg-[#FFEDD5] text-[#EA580C] border-[#FED7AA]'
                          : 'bg-[#F2EDE2] text-[#5D7067] border-[#E5DFCE]'
                      }`}
                    >
                      <option value="waiting">Đơn mới</option>
                      <option value="preparing">Đang pha</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setActiveReceiptOrder(ord)}
                      className="px-3 py-1.5 rounded-lg border border-[#E5DFCE] hover:bg-[#FAF8F2] text-xs font-semibold text-[#1B4332] inline-flex items-center gap-1"
                    >
                      <Receipt className="w-3.5 h-3.5 text-[#5D7067]" />
                      <span>Hóa đơn</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
