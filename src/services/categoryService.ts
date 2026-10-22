import { ApiService } from './api';

export interface CategoryItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export class CategoryService {
  static async getCategories(): Promise<CategoryItem[]> {
    const response = await ApiService.get<CategoryItem[]>('/api/categories');
    if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  }

  static async addCategory(cat: Omit<CategoryItem, 'id'>): Promise<CategoryItem> {
    const response = await ApiService.post<CategoryItem>('/api/categories', cat);
    return response.data;
  }

  static async updateCategory(id: string, updates: Partial<CategoryItem>): Promise<CategoryItem> {
    const response = await ApiService.put<CategoryItem>(`/api/categories/${id}`, updates);
    return response.data;
  }

  static async deleteCategory(id: string): Promise<boolean> {
    await ApiService.delete(`/api/categories/${id}`);
    return true;
  }
}
