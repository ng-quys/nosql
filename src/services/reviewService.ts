import { ApiService } from './api';

export interface ReviewItem {
  id: string;
  productId: string;
  customerId?: string;
  orderId?: string;
  rating: number;
  comment: string;
  customerName?: string;
  createdAt?: string;
}

export class ReviewService {
  static async getProductReviews(productId: string): Promise<ReviewItem[]> {
    const response = await ApiService.get<ReviewItem[]>(`/products/${productId}/reviews`);
    if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  }

  static async addReview(productId: string, review: Omit<ReviewItem, 'id'>): Promise<ReviewItem> {
    const response = await ApiService.post<ReviewItem>(`/products/${productId}/reviews`, review);
    return response.data;
  }

  static async updateReview(id: string, updates: Partial<ReviewItem>): Promise<ReviewItem> {
    const response = await ApiService.put<ReviewItem>(`/reviews/${id}`, updates);
    return response.data;
  }

  static async deleteReview(id: string): Promise<boolean> {
    await ApiService.delete(`/reviews/${id}`);
    return true;
  }
}
