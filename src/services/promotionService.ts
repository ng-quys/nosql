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
}

export class PromotionService {
  static async getPromotions(): Promise<PromotionItem[]> {
    const response = await ApiService.get<PromotionItem[]>('/promotions');
    if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  }

  static async validate(code: string, subtotal: number): Promise<{ promotion: PromotionItem; discount: number }> {
    return (await ApiService.post<{ promotion: PromotionItem; discount: number }>('/promotions/validate', { code, subtotal })).data;
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
