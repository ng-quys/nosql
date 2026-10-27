import { API_BASE_URL, ApiService } from './api';

export interface ProductImportRow { row: number; errors: string[]; data: { name: string; categoryId: string; price: number; status: string } }

export class ProductImportService {
  static async preview(csv: string) {
    return (await ApiService.post<{ rows: ProductImportRow[]; validCount: number; errorCount: number }>('/products/import/preview', { csv })).data;
  }
  static async import(csv: string) {
    return (await ApiService.post<{ imported: number }>('/products/import', { csv })).data;
  }
  static async download() {
    const response = await fetch(`${API_BASE_URL}/products/export/csv`, { headers: { Authorization: `Bearer ${localStorage.getItem('freshleaf_jwt_token') || ''}` } });
    if (!response.ok) throw new Error((await response.json().catch(()=>({}))).message || 'Không thể xuất CSV');
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `freshleaf-products-${new Date().toISOString().slice(0,10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }
}
