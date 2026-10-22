import { Ingredient } from '../types';
import { ApiService } from './api';

const INGREDIENT_DISPLAY_MAP: Record<string, { fullName: string; category: string; supplier: string }> = {
  Xoai: { fullName: 'Xoài cát Chu chín cây', category: 'fruit', supplier: 'Hợp tác xã Xoài Cao Lãnh' },
  Bo: { fullName: 'Bơ sáp Đắk Lắk tuyển chọn', category: 'fruit', supplier: 'Nông trại Bơ Cư M’gar' },
  Oi: { fullName: 'Ổi hồng ruột đỏ', category: 'fruit', supplier: 'Vườn cây Tiền Giang' },
  'Chanh day': { fullName: 'Chanh dây tím Gia Lai', category: 'fruit', supplier: 'HTX Nông nghiệp Đắk Đoa' },
  'Dau tay': { fullName: 'Dâu tây đỏ Đà Lạt', category: 'fruit', supplier: 'Vườn dâu Biofresh Đà Lạt' },
  Cam: { fullName: 'Cam sành miền Tây mọng nước', category: 'fruit', supplier: 'Nhà vườn Bến Tre' },
  'Dua hau': { fullName: 'Dưa hấu không hạt Long An', category: 'fruit', supplier: 'Nông sản Tân Thạnh' },
  Thom: { fullName: 'Thơm mật Cầu Đúc', category: 'fruit', supplier: 'Vựa khóm Hậu Giang' },
  'Viet quat': { fullName: 'Việt quất tươi', category: 'fruit', supplier: 'Đại lý Việt Fresh' },
  'Sua dac': { fullName: 'Sữa đặc có đường', category: 'dairy', supplier: 'Vinamilk Việt Nam' },
  'Sua tuoi': { fullName: 'Sữa tươi thanh trùng', category: 'dairy', supplier: 'Đà Lạt Milk' },
  'Duong phen': { fullName: 'Đường phèn tự nhiên', category: 'sweetener', supplier: 'Đặc sản Miền Trung' },
};

function mapApiInventoryToIngredient(item: any): Ingredient {
  const currentStock = Number(item.quantity ?? item.currentStock ?? 0);
  const minThreshold = Number(item.minStock ?? item.minThreshold ?? 5);
  const rawName = item.name || 'Nguyên liệu';
  const displayInfo = INGREDIENT_DISPLAY_MAP[rawName];

  const status: 'in_stock' | 'low_stock' | 'critical' =
    currentStock <= minThreshold * 0.5 ? 'critical' : currentStock <= minThreshold ? 'low_stock' : 'in_stock';

  return {
    id: (item.id || item._id || item.ingredientId || '').toString(),
    name: displayInfo?.fullName || rawName,
    unit: item.unit || 'kg',
    category: (item.category || displayInfo?.category || 'fruit') as any,
    currentStock,
    minThreshold,
    costPerUnit: Number(item.costPerUnit || 30000),
    status,
    lastRestocked: item.lastRestocked || new Date().toISOString().split('T')[0],
    supplier: item.supplier || displayInfo?.supplier || 'Nông sản FreshLeaf',
  };
}

export class InventoryService {
  /**
   * GET /api/inventory
   * Real inventory from MongoDB Atlas
   */
  static async getIngredients(): Promise<Ingredient[]> {
    const response = await ApiService.get<any[]>('/api/inventory');
    if (response && response.data && Array.isArray(response.data)) {
      return response.data.map(mapApiInventoryToIngredient);
    }
    return [];
  }

  /**
   * GET /api/inventory/low-stock
   */
  static async getLowStock(): Promise<Ingredient[]> {
    const response = await ApiService.get<any[]>('/api/inventory/low-stock');
    if (response && response.data && Array.isArray(response.data)) {
      return response.data.map(mapApiInventoryToIngredient);
    }
    return [];
  }

  /**
   * PUT /api/inventory/:id/restock
   */
  static async restock(id: string, amount: number): Promise<Ingredient> {
    const response = await ApiService.put<any>(`/api/inventory/${id}/restock`, { amount });
    return mapApiInventoryToIngredient(response.data);
  }

  /**
   * PUT /api/inventory/:id
   */
  static async updateThreshold(id: string, newMin: number): Promise<Ingredient> {
    const response = await ApiService.put<any>(`/api/inventory/${id}`, { minStock: newMin });
    return mapApiInventoryToIngredient(response.data);
  }
}
