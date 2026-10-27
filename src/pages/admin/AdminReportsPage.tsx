import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  PieChart,
  TrendingUp,
  Leaf,
  FileSpreadsheet,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatVND, formatNumber } from '../../utils/formatters';
import { ReportService, RevenueReport } from '../../services/reportService';

export const AdminReportsPage: React.FC = () => {
  const { orders } = useStore();
  const [reportTab, setReportTab] = useState<'revenue' | 'orders' | 'products' | 'inventory'>('revenue');
  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);

  useEffect(() => {
    ReportService.getRevenue('daily').then((res) => {
      if (res) setRevenueReport(res);
    }).catch(() => {});
  }, []);

  const totalGross = revenueReport?.summary?.totalRevenue ?? 0;

  // Phân loại doanh số theo danh mục
  const catSales: Record<string, { count: number; rev: number; label: string }> = {
    smoothie: { count: 0, rev: 0, label: 'Sinh tố tươi' },
    fresh_juice: { count: 0, rev: 0, label: 'Nước ép nguyên chất' },
    combo_drinks: { count: 0, rev: 0, label: 'Combo ưu đãi' },
  };

  orders.forEach((o) => {
    o.items.forEach((it) => {
      const c = it.drink.category;
      if (catSales[c]) {
        catSales[c].count += it.quantity;
        catSales[c].rev += it.unitPrice * it.quantity;
      }
    });
  });

  const totalSold = Object.values(catSales).reduce((sum, c) => sum + c.count, 0) || 1;

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      ['Mã đơn,Tên khách,Số tiền,Trạng thái,Thời gian']
        .concat(
          orders.map(
            (o) =>
              `${o.orderNumber},"${o.customerName}",${o.totalAmount},${o.status},${o.createdAt}`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `freshleaf_bao_cao_doanh_thu_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Bộ lọc loại báo cáo & Nút Xuất File */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-[#E5DFCE]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#E2F1E9] text-[#2D6A4F]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-base text-[#1B4332]">
              Báo cáo doanh thu &amp; Hiệu suất bán hàng
            </h3>
            <p className="text-xs text-[#5D7067]">Chi nhánh: 268 Nguyễn Trãi, Q.1 &bull; Tổng doanh thu: {formatVND(totalGross)}</p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Xuất báo cáo Excel (.CSV)</span>
        </button>
      </div>

      {/* Tabs loại báo cáo */}
      <div className="flex items-center gap-2 p-1 bg-[#F2EDE2] rounded-xl text-xs overflow-x-auto">
        {[
          { id: 'revenue', label: 'Báo cáo doanh thu' },
          { id: 'orders', label: 'Báo cáo đơn hàng' },
          { id: 'products', label: 'Báo cáo sản phẩm' },
          { id: 'inventory', label: 'Báo cáo tồn kho & nhập hàng' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setReportTab(t.id as any)}
            className={`px-4 py-2 font-semibold rounded-lg transition-all whitespace-nowrap ${
              reportTab === t.id ? 'bg-white text-[#1B4332] shadow-xs' : 'text-[#5D7067] hover:text-[#1B4332]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 3 Khối phân tích chi tiết */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tỷ trọng doanh thu theo danh mục */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5DFCE] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2EDE2]">
            <h4 className="font-sans font-bold text-sm text-[#1B4332]">
              Tỷ trọng doanh thu danh mục
            </h4>
            <PieChart className="w-4 h-4 text-[#40916C]" />
          </div>

          <div className="space-y-3 text-xs">
            {/* Sinh tố */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-[#1B4332]">Sinh tố tươi</span>
                <span className="tabular-nums">{formatVND(catSales.smoothie.rev)}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#F2EDE2] overflow-hidden">
                <div
                  className="h-full bg-[#2D6A4F] rounded-full"
                  style={{ width: `${Math.round((catSales.smoothie.count / totalSold) * 100)}%` }}
                />
              </div>
            </div>

            {/* Nước ép */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-[#1B4332]">Nước ép nguyên chất</span>
                <span className="tabular-nums">{formatVND(catSales.fresh_juice.rev)}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#F2EDE2] overflow-hidden">
                <div
                  className="h-full bg-[#EA580C] rounded-full"
                  style={{ width: `${Math.round((catSales.fresh_juice.count / totalSold) * 100)}%` }}
                />
              </div>
            </div>

            {/* Combo */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-[#1B4332]">Combo ưu đãi</span>
                <span className="tabular-nums">{formatVND(catSales.combo_drinks.rev)}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#F2EDE2] overflow-hidden">
                <div
                  className="h-full bg-[#D97706] rounded-full"
                  style={{ width: `${Math.round((catSales.combo_drinks.count / totalSold) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tốc độ phục vụ Barista */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5DFCE] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2EDE2]">
            <h4 className="font-sans font-bold text-sm text-[#1B4332]">
              Tốc độ phục vụ tại quầy
            </h4>
            <TrendingUp className="w-4 h-4 text-[#2D6A4F]" />
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#F2EDE2]">
              <span className="text-[#5D7067]">Thời gian pha chế trung bình:</span>
              <span className="font-bold text-[#1B4332] tabular-nums">3.6 phút / ly</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#F2EDE2]">
              <span className="text-[#5D7067]">Tỷ lệ trả món đúng giờ (&lt;5p):</span>
              <span className="font-bold text-[#2D6A4F] tabular-nums">96.5%</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#F2EDE2]">
              <span className="text-[#5D7067]">Hiệu suất máy xay &amp; ép:</span>
              <span className="font-bold text-[#1B4332] tabular-nums">Ổn định (100%)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[#5D7067]">Tỷ lệ hao hụt nguyên liệu:</span>
              <span className="font-bold text-[#2D6A4F] tabular-nums">&lt; 3%</span>
            </div>
          </div>
        </div>

        {/* Nguyên liệu & Tái chế bã trái cây */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5DFCE] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2EDE2]">
            <h4 className="font-sans font-bold text-sm text-[#1B4332]">
              Bảo vệ môi trường
            </h4>
            <Leaf className="w-4 h-4 text-[#40916C]" />
          </div>

          <p className="text-xs text-[#5D7067] leading-relaxed">
            100% bã ép trái cây (thơm, cà rốt, dưa hấu, cam) được phân loại và chuyển cho các vườn ươm nông nghiệp sạch tại Hóc Môn làm phân bón hữu cơ vi sinh.
          </p>

          <div className="p-3 rounded-xl bg-[#F2F8F5] border border-[#C5E3D3] space-y-1 text-xs">
            <div className="flex justify-between font-bold text-[#1B4332]">
              <span>Bã hữu cơ tái chế tuần này:</span>
              <span className="tabular-nums">54.5 kg</span>
            </div>
            <p className="text-[11px] text-[#40916C]">Sử dụng 100% ly giấy và ống hút cỏ bàng</p>
          </div>
        </div>
      </div>
    </div>
  );
};
