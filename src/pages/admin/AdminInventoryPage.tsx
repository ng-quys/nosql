import React, { useState, useEffect } from 'react';
import { Search, Truck, AlertCircle, RefreshCw } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Ingredient } from '../../types';
import { formatVND } from '../../utils/formatters';
import { InventoryService } from '../../services/inventoryService';

export const AdminInventoryPage: React.FC = () => {
  const { ingredients: storeIngredients, restockIngredient: storeRestock } = useStore();

  const [realIngredients, setRealIngredients] = useState<Ingredient[]>(storeIngredients);
  const [loading, setLoading] = useState(storeIngredients.length === 0);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [restockModalItem, setRestockModalItem] = useState<Ingredient | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await InventoryService.getIngredients();
      setRealIngredients(data);
    } catch (err: any) {
      console.warn('[AdminInventoryPage] Lỗi tải kho nguyên liệu từ MongoDB:', err.message);
      setError('Không thể tải dữ liệu tồn kho từ máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (storeIngredients.length > 0) {
      setRealIngredients(storeIngredients);
    }
  }, [storeIngredients]);

  const activeIngredients = realIngredients.length > 0 ? realIngredients : storeIngredients;

  const filtered = activeIngredients.filter((ing) => {
    if (filterCat !== 'all' && ing.category !== filterCat) return false;
    if (
      search &&
      !ing.name.toLowerCase().includes(search.toLowerCase()) &&
      !(ing.supplier || '').toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalItem) return;
    try {
      await InventoryService.restock(restockModalItem.id, restockAmount);
      await storeRestock(restockModalItem.id, restockAmount);
      await fetchInventory();
    } catch (err: any) {
      console.error('[AdminInventoryPage] Lỗi nhập thêm nguyên liệu:', err.message);
    } finally {
      setRestockModalItem(null);
    }
  };

  const handleQuickRestock = async (id: string, amount: number) => {
    try {
      await InventoryService.restock(id, amount);
      await storeRestock(id, amount);
      await fetchInventory();
    } catch (err: any) {
      console.error('[AdminInventoryPage] Lỗi nhập nhanh:', err.message);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'fruit':
        return 'Trái cây tươi';
      case 'dairy':
        return 'Sữa & Béo';
      case 'sweetener':
        return 'Đường & Mật';
      case 'ice':
        return 'Đá viên';
      case 'topping':
        return 'Topping thêm';
      default:
        return cat;
    }
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
            onClick={fetchInventory}
            className="px-3 py-1 bg-[#BE123C] text-white rounded-lg font-semibold hover:bg-[#9F1239] inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* Thanh lọc & tìm kiếm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-[#F2EDE2] rounded-xl text-xs">
            {[
              { id: 'all', label: 'Tất cả kho' },
              { id: 'fruit', label: 'Trái cây tươi' },
              { id: 'dairy', label: 'Sữa đặc & tươi' },
              { id: 'sweetener', label: 'Đường phèn' },
              { id: 'topping', label: 'Topping' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setFilterCat(c.id)}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                  filterCat === c.id ? 'bg-white text-[#1B4332] shadow-xs' : 'text-[#5D7067]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#889C92]" />
            <input
              type="text"
              placeholder="Tìm trái cây, vựa cung cấp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#E5DFCE] bg-white text-[#1B4332]"
            />
          </div>
        </div>
      </div>

      {/* Bảng tồn kho nguyên liệu */}
      <div className="bg-white rounded-2xl border border-[#E5DFCE] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F2] border-b border-[#E5DFCE] text-[#5D7067] uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Tên nguyên liệu &amp; Loại</th>
                <th className="py-3 px-4">Mức tồn hiện tại</th>
                <th className="py-3 px-4">Mức tối thiểu</th>
                <th className="py-3 px-4">Đơn giá nhập</th>
                <th className="py-3 px-4">Nhà vườn / Đại lý cung cấp</th>
                <th className="py-3 px-4">Trạng thái kho</th>
                <th className="py-3 px-4 text-right">Nhập thêm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EDE2]">
              {filtered.map((item) => {
                const ratio = Math.min(100, Math.round((item.currentStock / (item.minThreshold * 2)) * 100));

                let barColor = 'bg-[#2D6A4F]';
                let statusBadge = (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#E2F1E9] text-[#2D6A4F]">
                    Đầy đủ
                  </span>
                );

                if (item.status === 'low_stock') {
                  barColor = 'bg-[#EA580C]';
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FEF3C7] text-[#D97706]">
                      Sắp hết
                    </span>
                  );
                } else if (item.status === 'critical') {
                  barColor = 'bg-[#E11D48]';
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FFE4E6] text-[#E11D48] animate-pulse">
                      Khẩn cấp
                    </span>
                  );
                }

                return (
                  <tr key={item.id} className="hover:bg-[#FCFBF7] transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#1B4332]">{item.name}</p>
                      <span className="text-[10px] text-[#6CAE8F] uppercase font-semibold">
                        {getCategoryLabel(item.category)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 w-48">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] tabular-nums font-semibold">
                          <span className="text-[#1B4332]">{item.currentStock} {item.unit}</span>
                          <span className="text-[#889C92]">{ratio}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#F2EDE2] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums text-[#5D7067]">
                      {item.minThreshold} {item.unit}
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums text-[#1B4332]">
                      {formatVND(item.costPerUnit)} / {item.unit}
                    </td>

                    <td className="py-3.5 px-4 text-[#5D7067]">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3 h-3 text-[#889C92]" />
                        <span>{item.supplier}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">{statusBadge}</td>

                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleQuickRestock(item.id, item.unit === 'lít' ? 10 : 5)}
                        className="px-2 py-1 bg-[#FAF8F2] hover:bg-[#F2EDE2] border border-[#E5DFCE] text-[#1B4332] rounded-lg text-xs font-semibold"
                        title="Nhập nhanh định mức"
                      >
                        +{item.unit === 'lít' ? '10L' : `5${item.unit}`}
                      </button>
                      <button
                        onClick={() => {
                          setRestockModalItem(item);
                          setRestockAmount(item.unit === 'lít' ? 15 : 10);
                        }}
                        className="px-2.5 py-1 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-lg text-xs font-semibold shadow-xs"
                      >
                        Nhập kho
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nhập hàng theo chuyến */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E5DFCE] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2EDE2]">
              <h3 className="font-['Outfit'] font-bold text-base text-[#1B4332]">
                Ghi nhận đợt giao nguyên liệu
              </h3>
              <button
                onClick={() => setRestockModalItem(null)}
                className="text-[#889C92] hover:text-[#1B4332]"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4 text-xs">
              <p className="text-[#5D7067]">
                Nhập kho cho: <strong className="text-[#1B4332]">{restockModalItem.name}</strong> từ{' '}
                <em>{restockModalItem.supplier}</em>.
              </p>

              <div>
                <label className="block font-bold text-[#1B4332] mb-1">
                  Số lượng nhập thêm ({restockModalItem.unit})
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5DFCE] bg-white text-[#1B4332] font-bold tabular-nums"
                />
              </div>

              <div className="p-3 rounded-lg bg-[#FAF8F2] border border-[#E5DFCE] space-y-1">
                <div className="flex justify-between text-[#5D7067]">
                  <span>Tồn hiện tại trên quầy:</span>
                  <span className="tabular-nums font-bold">{restockModalItem.currentStock} {restockModalItem.unit}</span>
                </div>
                <div className="flex justify-between text-[#2D6A4F] font-bold">
                  <span>Số lượng sau khi nhập:</span>
                  <span className="tabular-nums">{(restockModalItem.currentStock + restockAmount).toFixed(1)} {restockModalItem.unit}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRestockModalItem(null)}
                  className="px-3 py-2 border border-[#E5DFCE] rounded-lg text-[#5D7067] font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-lg font-semibold shadow-xs"
                >
                  Xác nhận lưu kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
