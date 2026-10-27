import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  Coins,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatVND, formatNumber } from '../../utils/formatters';
import { ReportService, TopProductReport, RevenueReport } from '../../services/reportService';

export const AdminDashboardPage: React.FC = () => {
  const { orders, ingredients, restockIngredient } = useStore();
  const [topFromDb, setTopFromDb] = useState<TopProductReport[]>([]);
  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);
  const [orderStats, setOrderStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [revResult, topResult, statsResult] = await Promise.allSettled([
        ReportService.getRevenue('daily'),
        ReportService.getTopProducts(4),
        ReportService.getOrderStats(),
      ]);

      if (revResult.status === 'fulfilled') {
        setRevenueReport(revResult.value);
      }
      if (topResult.status === 'fulfilled' && topResult.value.length > 0) {
        setTopFromDb(topResult.value);
      }
      if (statsResult.status === 'fulfilled') {
        setOrderStats(statsResult.value);
      }
    } catch (err: any) {
      console.warn('[AdminDashboard] Lỗi tải báo cáo MongoDB:', err.message);
      setError('Không thể kết nối đến máy chủ để tải dữ liệu thống kê.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real aggregated values from MongoDB /api/reports/revenue (data.summary)
  const totalRevenue = revenueReport?.summary?.totalRevenue ?? 0;
  const totalOrdersCount = revenueReport?.summary?.totalOrders ?? 0;
  const avgOrderValue = revenueReport?.summary?.avgOrderValue ?? (totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0);
  const totalCompletedOrders = orderStats?.byStatus?.completed ?? orders.filter((o) => o.status === 'completed').length;

  // Sản phẩm bán chạy
  const salesMap = new Map<string, { count: number; revenue: number; name: string }>();
  orders.forEach((ord) => {
    ord.items.forEach((item) => {
      const existing = salesMap.get(item.drinkId) || {
        count: 0,
        revenue: 0,
        name: item.drink.name,
      };
      existing.count += item.quantity;
      existing.revenue += item.unitPrice * item.quantity;
      salesMap.set(item.drinkId, existing);
    });
  });

  const bestSellers =
    topFromDb.length > 0
      ? topFromDb.map((t) => ({ count: t.quantitySold, revenue: t.revenue, name: t.name }))
      : Array.from(salesMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 4);

  // Nguyên liệu sắp hết
  const alertIngredients = ingredients.filter(
    (i) => i.status === 'low_stock' || i.status === 'critical'
  );

  // Doanh thu theo khung giờ bán từ dữ liệu thật MongoDB
  const revenueTrend = (revenueReport?.timeline && revenueReport.timeline.length > 0)
    ? revenueReport.timeline.slice(-7).map((t) => ({
        hour: t.date.length > 5 ? t.date.slice(5) : t.date,
        amount: t.revenue,
        orders: t.orders,
      }))
    : [
        { hour: 'Hôm nay', amount: totalRevenue, orders: totalOrdersCount },
      ];

  const maxTrend = Math.max(...revenueTrend.map((t) => t.amount), 1);

  return (
    <div className="space-y-8">
      {error && !revenueReport && (
        <div className="p-4 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDashboardData} className="px-3 py-1 bg-[#BE123C] text-white rounded-lg font-semibold hover:bg-[#9F1239]">
            Thử lại
          </button>
        </div>
      )}

      {/* 4 Thẻ chỉ số tổng quan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh thu hôm nay */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5DFCE] space-y-2">
          <div className="flex items-center justify-between text-[#5D7067]">
            <span className="text-xs font-semibold uppercase tracking-wider">Doanh thu hôm nay</span>
            <div className="p-2 rounded-lg bg-[#E2F1E9] text-[#2D6A4F]">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="font-sans text-2xl font-bold text-[#1B4332] tabular-nums">
              {formatVND(totalRevenue)}
            </h3>
            <span className="text-xs font-semibold text-[#2D6A4F] flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +15.2%
            </span>
          </div>
          <p className="text-[11px] text-[#889C92]">Tính trên tất cả các kênh tại quán &amp; mang về</p>
        </div>

        {/* Tổng đơn hàng */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5DFCE] space-y-2">
          <div className="flex items-center justify-between text-[#5D7067]">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng đơn hàng</span>
            <div className="p-2 rounded-lg bg-[#FFEDD5] text-[#EA580C]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="font-sans text-2xl font-bold text-[#1B4332] tabular-nums">
              {formatNumber(totalOrdersCount)} Đơn
            </h3>
            <span className="text-xs text-[#5D7067]">
              {formatNumber(totalCompletedOrders)} đã hoàn thành
            </span>
          </div>
          <p className="text-[11px] text-[#889C92]">Tính trên hệ thống bán hàng &amp; KDS thời gian thực</p>
        </div>

        {/* Khách hàng & Giá trị đơn */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5DFCE] space-y-2">
          <div className="flex items-center justify-between text-[#5D7067]">
            <span className="text-xs font-semibold uppercase tracking-wider">Giá trị đơn bình quân</span>
            <div className="p-2 rounded-lg bg-[#FEF3C7] text-[#D97706]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="font-sans text-2xl font-bold text-[#1B4332] tabular-nums">
              {formatVND(avgOrderValue)}
            </h3>
            <span className="text-xs font-semibold text-[#2D6A4F] flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +5.000 ₫
            </span>
          </div>
          <p className="text-[11px] text-[#889C92]">Nhờ vào combo và chọn size Lớn</p>
        </div>

        {/* Nguyên liệu sắp hết */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5DFCE] space-y-2">
          <div className="flex items-center justify-between text-[#5D7067]">
            <span className="text-xs font-semibold uppercase tracking-wider">Nguyên liệu sắp hết</span>
            <div className="p-2 rounded-lg bg-[#FFE4E6] text-[#E11D48]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="font-sans text-2xl font-bold text-[#1B4332] tabular-nums">
              {alertIngredients.length} Cảnh báo
            </h3>
            <span className="text-xs font-bold text-[#EA580C]">
              {alertIngredients.filter((i) => i.status === 'critical').length} Khẩn cấp
            </span>
          </div>
          <p className="text-[11px] text-[#889C92]">Dâu tây Đà Lạt &amp; Bơ sáp cần nhập thêm</p>
        </div>
      </div>

      {/* Biểu đồ phân bổ doanh thu theo khung giờ */}
      <section className="bg-white rounded-3xl border border-[#E5DFCE] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#F2EDE2]">
          <div>
            <h3 className="font-sans font-bold text-lg text-[#1B4332]">
              Doanh thu theo khung giờ trong ngày
            </h3>
            <p className="text-xs text-[#5D7067]">
              Ghi nhận từ lúc mở cửa 07:00 đến hiện tại.
            </p>
          </div>
          <div className="text-xs font-semibold text-[#2D6A4F] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Khung giờ cao điểm: 19:00 – 20:30 (1.450.000 ₫)
          </div>
        </div>

        {/* Biểu đồ cột */}
        <div className="pt-4">
          <div className="h-44 flex items-end justify-between gap-3 sm:gap-6 pt-6">
            {revenueTrend.map((point) => {
              const heightPct = Math.round((point.amount / maxTrend) * 100);
              return (
                <div key={point.hour} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[10px] font-bold text-[#1B4332] tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatVND(point.amount)}
                  </span>
                  <div className="w-full max-w-[48px] bg-[#E2F1E9] group-hover:bg-[#2D6A4F] transition-colors rounded-t-lg relative overflow-hidden" style={{ height: `${heightPct}%` }}>
                    <div className="absolute inset-0 bg-[#2D6A4F]/20" />
                  </div>
                  <span className="text-[11px] font-medium text-[#5D7067] whitespace-nowrap">
                    {point.hour}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2 Cột: Sản phẩm bán chạy + Nguyên liệu cảnh báo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sản phẩm bán chạy (7 cột) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E5DFCE] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2EDE2]">
            <div>
              <h3 className="font-sans font-bold text-base text-[#1B4332]">
                Sản phẩm bán chạy nhất
              </h3>
              <p className="text-xs text-[#5D7067]">Xếp hạng theo số lượng ly đã bán ra</p>
            </div>
            <Link
              to="/admin/products"
              className="text-xs font-semibold text-[#2D6A4F] hover:underline"
            >
              Quản lý thực đơn &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {bestSellers.length === 0 ? (
              <p className="text-xs text-[#889C92] py-4 text-center">Chưa có dữ liệu bán hàng.</p>
            ) : (
              bestSellers.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F2] border border-[#E5DFCE] text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#E2F1E9] text-[#1B4332] flex items-center justify-center font-bold text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-[#1B4332]">{item.name}</h4>
                      <p className="text-[11px] text-[#5D7067] tabular-nums">
                        {item.count} ly đã pha chế
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#1B4332] font-sans text-sm tabular-nums">
                      {formatVND(item.revenue)}
                    </span>
                    <p className="text-[10px] text-[#40916C] font-medium">Doanh số cao</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Nguyên liệu sắp hết (5 cột) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E5DFCE] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2EDE2]">
            <div>
              <h3 className="font-sans font-bold text-base text-[#1B4332]">
                Nguyên liệu sắp hết
              </h3>
              <p className="text-xs text-[#5D7067]">Trái cây &amp; nguyên liệu dưới mức an toàn</p>
            </div>
            <Link
              to="/admin/inventory"
              className="text-xs font-semibold text-[#2D6A4F] hover:underline"
            >
              Kho nguyên liệu &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {alertIngredients.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#2D6A4F] bg-[#F2F8F5] rounded-xl border border-[#C5E3D3]">
                <CheckCircle2 className="w-5 h-5 mx-auto mb-1" />
                Kho trái cây và nguyên liệu đang ở mức an toàn.
              </div>
            ) : (
              alertIngredients.map((ing) => (
                <div
                  key={ing.id}
                  className="p-3 rounded-xl border border-[#E5DFCE] bg-[#FAF8F2] text-xs flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#1B4332]">{ing.name}</span>
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                          ing.status === 'critical'
                            ? 'bg-[#FFE4E6] text-[#E11D48]'
                            : 'bg-[#FEF3C7] text-[#D97706]'
                        }`}
                      >
                        {ing.status === 'critical' ? 'Khẩn cấp' : 'Sắp hết'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5D7067] mt-0.5 tabular-nums">
                      Còn: {ing.currentStock} {ing.unit} (Định mức tối thiểu: {ing.minThreshold} {ing.unit})
                    </p>
                  </div>

                  <button
                    onClick={() => restockIngredient(ing.id, 5.0)}
                    className="px-2.5 py-1 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap"
                  >
                    +5 {ing.unit}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
