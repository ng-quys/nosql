import { ApiService } from './api';

export interface RevenueReport {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
  };
  timeline: {
    date: string;
    revenue: number;
    orders: number;
    avg?: number;
  }[];
}

export interface TopProductReport {
  id: string;
  productId: string;
  name: string;
  quantitySold: number;
  revenue: number;
}

export class ReportService {
  static async getRevenue(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<RevenueReport> {
    try {
      const response = await ApiService.get<any>(`/api/reports/revenue?period=${period}`);
      const resData = response?.data || response;
      const summary = resData?.summary || resData;
      const timeline = resData?.timeline || [];

      return {
        summary: {
          totalRevenue: Math.round(Number(summary?.totalRevenue || 0)),
          totalOrders: Number(summary?.totalOrders || 0),
          avgOrderValue: Math.round(Number(summary?.avgOrderValue || 0)),
        },
        timeline: Array.isArray(timeline)
          ? timeline.map((t: any) => ({
              date: t.date || t._id || '',
              revenue: Math.round(Number(t.revenue || 0)),
              orders: Number(t.orders ?? t.orderCount ?? 0),
              avg: Math.round(Number(t.avg ?? t.avgOrderValue ?? 0)),
            }))
          : [],
      };
    } catch (err: any) {
      console.warn('[ReportService] Không thể tải báo cáo doanh thu từ MongoDB:', err.message);
      throw err;
    }
  }

  static async getTopProducts(limit: number = 10): Promise<TopProductReport[]> {
    try {
      const response = await ApiService.get<any>(`/api/reports/top-products?limit=${limit}`);
      const rawList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];
      return rawList.map((p: any) => ({
        id: (p.id || p._id || p.productId || '').toString(),
        productId: (p.productId || p.id || p._id || '').toString(),
        name: p.name || 'Món uống',
        quantitySold: Number(p.quantitySold || 0),
        revenue: Math.round(Number(p.revenue || 0)),
      }));
    } catch (err: any) {
      console.warn('[ReportService] Không thể tải top sản phẩm từ MongoDB:', err.message);
      return [];
    }
  }

  static async getOrderStats(): Promise<any> {
    try {
      const response = await ApiService.get<any>('/api/reports/orders');
      const resData = response?.data || response;
      return resData || {
        totalOrders: 0,
        byStatus: { pending: 0, preparing: 0, completed: 0, cancelled: 0 },
      };
    } catch (err: any) {
      console.warn('[ReportService] Không thể tải thống kê đơn hàng từ MongoDB:', err.message);
      return {
        totalOrders: 0,
        byStatus: { pending: 0, preparing: 0, completed: 0, cancelled: 0 },
      };
    }
  }
}
