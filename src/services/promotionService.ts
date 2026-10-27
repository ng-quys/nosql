import { ApiService } from './api';

export interface PromotionItem {
  id: string;
  code: string;
  title: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  isActive: boolean;
  status?: 'upcoming' | 'active' | 'expired' | 'exhausted' | 'disabled';
  startAt?: string;
  endAt?: string;
  usageLimit?: number;
  perCustomerLimit?: number;
  usedCount?: number;
  scope?: 'all' | 'category' | 'products';
  categoryIds?: string[];
  productIds?: string[];
}

export interface PromotionFilters { page?: number; limit?: number; search?: string; type?: string; status?: string; from?: string; to?: string }

export class PromotionService {
  static async getPromotions(): Promise<PromotionItem[]> {
    const response = await ApiService.get<PromotionItem[]>('/promotions');
    if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  }

  static async getPromotionPage(filters: PromotionFilters) {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined).map(([key, value]) => [key, String(value)])).toString();
    const response = await ApiService.get<PromotionItem[]>(`/promotions?${query}`);
    return { items: response.data || [], pagination: response.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 } };
  }

  static async validate(code: string, subtotal: number, context: Record<string, unknown> = {}): Promise<{ promotion: PromotionItem; discount: number }> {
    return (await ApiService.post<{ promotion: PromotionItem; discount: number }>('/promotions/validate', { code, subtotal, ...context })).data;
  }

  static async createPromotion(promo: Omit<PromotionItem, 'id'>): Promise<PromotionItem> {
    const response = await ApiService.post<PromotionItem>('/promotions', promo);
    return response.data;
  }

  static async updatePromotion(id: string, updates: Partial<PromotionItem>): Promise<PromotionItem> {
    const response = await ApiService.put<PromotionItem>(`/promotions/${id}`, updates);
    return response.data;
  }

  static async deletePromotion(id: string): Promise<boolean> {
    await ApiService.delete(`/promotions/${id}`);
    return true;
  }
}
