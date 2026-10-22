import { Drink } from '../types';
import { ApiService } from './api';
import { sanitizePrice } from '../utils/formatters';

export function mapProductToDrink(p: any): Drink {
  const numericPrice = sanitizePrice(p.price ?? p.basePrice, 45000);
  const id = (p.id || p._id || '').toString();
  const rawCat = (p.categoryId || p.category || '').toString().trim().toUpperCase();

  // Map categoryId strictly as specified:
  // categoryId = CAT01 → Sinh tố ('smoothie')
  // categoryId = CAT02 → Nước ép ('fresh_juice')
  // categoryId = CAT03 → Combo ('combo_drinks')
  let uiCategory: any = 'smoothie';
  if (rawCat === 'CAT01' || rawCat === 'SMOOTHIE' || rawCat.includes('SINH TỐ') || rawCat.includes('SINH TO')) {
    uiCategory = 'smoothie';
  } else if (rawCat === 'CAT02' || rawCat === 'FRESH_JUICE' || rawCat === 'JUICE' || rawCat.includes('NƯỚC ÉP') || rawCat.includes('NUOC EP')) {
    uiCategory = 'fresh_juice';
  } else if (rawCat === 'CAT03' || rawCat === 'COMBO' || rawCat === 'COMBO_DRINKS') {
    uiCategory = 'combo_drinks';
  } else {
    // Check product name as fallback
    const lowerName = (p.name || '').toLowerCase();
    if (lowerName.includes('juice') || lowerName.includes('nước ép')) {
      uiCategory = 'fresh_juice';
    } else if (lowerName.includes('combo') || lowerName.includes('detox')) {
      uiCategory = 'combo_drinks';
    } else {
      uiCategory = 'smoothie';
    }
  }

  // Enrich Vietnamese description / ingredients if database has empty arrays
  const VIETNAMESE_NAMES: Record<string, string> = {
    P001: 'Sinh tố xoài cát Chu',
    P002: 'Sinh tố dâu tây Đà Lạt',
    P003: 'Sinh tố bơ sáp Đắk Lắk',
    P004: 'Nước ép cam sành',
    P005: 'Nước ép dưa hấu',
    P006: 'Nước ép thơm mật',
    P007: 'Nước ép chanh dây',
    P008: 'Sinh tố berry tổng hợp',
    P009: 'Nước ép ổi hồng',
    P010: 'Combo Green Detox',
    P011: 'Combo Tropical Mix',
    P012: 'Combo Berry Delight',
  };

  const rawLower = (p.name || '').toLowerCase();
  let displayName = p.name || 'Thức uống tươi';
  if (p.name && (p.name.includes('Sinh tố') || p.name.includes('Nước ép') || p.name.includes('Combo'))) {
    displayName = p.name;
  } else if (rawLower.includes('avocado') || rawLower.includes('bơ')) {
    displayName = 'Sinh tố bơ sáp Đắk Lắk';
  } else if (rawLower.includes('mango') || rawLower.includes('xoài')) {
    displayName = 'Sinh tố xoài cát Chu';
  } else if (rawLower.includes('strawberry') || rawLower.includes('dâu')) {
    displayName = 'Sinh tố dâu tây Đà Lạt';
  } else if (rawLower.includes('orange') || rawLower.includes('cam')) {
    displayName = 'Nước ép cam sành';
  } else if (rawLower.includes('watermelon') || rawLower.includes('dưa hấu')) {
    displayName = 'Nước ép dưa hấu';
  } else if (rawLower.includes('pineapple') || rawLower.includes('thơm') || rawLower.includes('dứa')) {
    displayName = 'Nước ép thơm mật';
  } else if (rawLower.includes('passion') || rawLower.includes('chanh dây')) {
    displayName = 'Nước ép chanh dây';
  } else if (rawLower.includes('berry') || rawLower.includes('việt quất')) {
    displayName = 'Sinh tố berry tổng hợp';
  } else if (rawLower.includes('guava') || rawLower.includes('ổi')) {
    displayName = 'Nước ép ổi hồng';
  } else if (VIETNAMESE_NAMES[id]) {
    displayName = VIETNAMESE_NAMES[id];
  }

  const name = displayName;
  let defaultIngredients: string[] = ['Trái cây tươi tuyển chọn', 'Đá viên tinh khiết'];
  let defaultTagline = p.tagline || 'Tươi ngon nguyên chất mỗi ngày';
  let defaultDesc = p.description || 'Thức uống dinh dưỡng pha chế từ nguyên liệu tươi chất lượng cao.';
  let themeColor = p.themeColor || '#2D6A4F';
  let bgGradient = p.bgGradient || 'from-[#E2F1E9] via-[#C5E3D3] to-[#9BCBB4]';

  const lowerName = name.toLowerCase();
  if (lowerName.includes('mango') || lowerName.includes('xoài')) {
    defaultIngredients = ['Xoài cát Chu', 'Sữa tươi thanh trùng', 'Đá viên'];
    defaultTagline = 'Xoài cát Chu chín cây & sữa tươi';
    defaultDesc = 'Sinh tố xoài tươi mát lành, vị ngọt thanh tự nhiên từ xoài chín cây tuyển chọn.';
    themeColor = '#D97706';
    bgGradient = 'from-[#FEF3C7] via-[#FDE68A] to-[#F59E0B]/30';
  } else if (lowerName.includes('avocado') || lowerName.includes('bơ')) {
    defaultIngredients = ['Bơ sáp Đắk Lắk', 'Sữa đặc', 'Sữa tươi'];
    defaultTagline = 'Bơ sáp béo ngậy nguyên chất';
    defaultDesc = 'Sinh tố bơ sánh mịn, béo ngậy tự nhiên từ những quả bơ sáp Đắk Lắk tuyển chọn kĩ lưỡng.';
    themeColor = '#2D6A4F';
    bgGradient = 'from-[#E2F1E9] via-[#C5E3D3] to-[#9BCBB4]';
  } else if (lowerName.includes('strawberry') || lowerName.includes('dâu')) {
    defaultIngredients = ['Dâu tây Đà Lạt', 'Sữa chua', 'Mật ong'];
    defaultTagline = 'Dâu tây đỏ mọng chua ngọt';
    defaultDesc = 'Sinh tố dâu tây tươi thanh khiết, giàu vitamin C và chất chống oxy hóa tự nhiên.';
    themeColor = '#BE185D';
    bgGradient = 'from-[#FCE7F3] via-[#FBCFE8] to-[#F472B6]/30';
  } else if (lowerName.includes('orange') || lowerName.includes('cam')) {
    defaultIngredients = ['Cam sành miền Tây vắt tươi'];
    defaultTagline = 'Cam sành miền Tây vắt tươi 100%';
    defaultDesc = 'Nước ép cam sành mọng nước, vị chua ngọt hài hòa bổ sung vitamin C tức thì.';
    themeColor = '#EA580C';
    bgGradient = 'from-[#FFEDD5] via-[#FED7AA] to-[#FB923C]/30';
  } else if (lowerName.includes('watermelon') || lowerName.includes('dưa hấu')) {
    defaultIngredients = ['Dưa hấu Long An', 'Chanh tươi'];
    defaultTagline = 'Dưa hấu thanh mát ngọt dịu';
    defaultDesc = 'Nước ép dưa hấu giải nhiệt tức thì, vị ngọt thanh tự nhiên không thêm đường.';
    themeColor = '#E11D48';
    bgGradient = 'from-[#FFE4E6] via-[#FECDD3] to-[#FB7185]/30';
  } else if (lowerName.includes('pineapple') || lowerName.includes('thơm') || lowerName.includes('dứa')) {
    defaultIngredients = ['Thơm mật Cầu Đúc', 'Gừng tươi'];
    defaultTagline = 'Thơm mật Cầu Đúc chua ngọt đậm đà';
    defaultDesc = 'Nước ép dứa thơm giàu enzyme tự nhiên hỗ trợ tiêu hóa và làm sáng da.';
    themeColor = '#D97706';
    bgGradient = 'from-[#FEF9C3] via-[#FEF08A] to-[#FBBF24]/30';
  } else if (lowerName.includes('passion') || lowerName.includes('chanh dây')) {
    defaultIngredients = ['Chanh dây Gia Lai', 'Mật ong hoa rừng'];
    defaultTagline = 'Chanh dây thơm nồng vị nhiệt đới';
    defaultDesc = 'Nước ép chanh dây chua thanh dịu ngọt, thơm lừng hương hoa quả nhiệt đới.';
    themeColor = '#F59E0B';
    bgGradient = 'from-[#FFFBEB] via-[#FEF3C7] to-[#FCD34D]/30';
  } else if (lowerName.includes('berry') || lowerName.includes('việt quất')) {
    defaultIngredients = ['Việt quất', 'Dâu rừng', 'Sữa chua Hy Lạp'];
    defaultTagline = 'Hỗn hợp quả mọng giàu dưỡng chất';
    defaultDesc = 'Sinh tố berry tổng hợp chống lão hóa, vị chua ngọt đậm đà cuốn hút.';
    themeColor = '#4338CA';
    bgGradient = 'from-[#EEF2FF] via-[#C7D2FE] to-[#818CF8]/30';
  } else if (lowerName.includes('guava') || lowerName.includes('ổi')) {
    defaultIngredients = ['Ổi hồng ruột đỏ', 'Xí muội'];
    defaultTagline = 'Ổi hồng thơm giòn giàu chất xơ';
    defaultDesc = 'Nước ép ổi hồng chứa hàm lượng vitamin C vượt trội, vị chát nhẹ ngọt dịu.';
    themeColor = '#BE185D';
    bgGradient = 'from-[#FDF2F8] via-[#FCE7F3] to-[#F472B6]/30';
  } else if (lowerName.includes('detox') || lowerName.includes('green')) {
    defaultIngredients = ['Cần tây', 'Táo xanh', 'Dưa leo', 'Chanh'];
    defaultTagline = 'Combo thanh lọc cơ thể tươi xanh';
    defaultDesc = 'Nước ép detox xanh mát giúp thải độc, giữ dáng và làm sạch cơ thể mỗi sáng.';
    themeColor = '#059669';
    bgGradient = 'from-[#D1FAE5] via-[#A7F3D0] to-[#34D399]/30';
  } else if (lowerName.includes('combo')) {
    defaultIngredients = ['Trái cây nhiệt đới mix', 'Hạt chia'];
    defaultTagline = 'Hương vị trái cây nhiệt đới tổng hợp';
    defaultDesc = 'Combo hoàn hảo kết hợp nhiều loại trái cây tươi ngon cho ngày dài hứng khởi.';
    themeColor = '#2D6A4F';
    bgGradient = 'from-[#E2F1E9] via-[#C5E3D3] to-[#9BCBB4]';
  }

  const status = p.status || (p.isAvailable !== false ? 'available' : 'out_of_stock');

  return {
    id,
    name,
    tagline: p.tagline || defaultTagline,
    description: p.description || defaultDesc,
    category: uiCategory,
    categoryId: p.categoryId || (uiCategory === 'fresh_juice' ? 'CAT02' : uiCategory === 'combo_drinks' ? 'CAT03' : 'CAT01'),
    basePrice: numericPrice,
    themeColor: p.themeColor || themeColor,
    bgGradient: p.bgGradient || bgGradient,
    ingredients: Array.isArray(p.ingredients) && p.ingredients.length > 0 ? p.ingredients : defaultIngredients,
    calories: Number(p.calories || 150),
    prepTimeMin: Number(p.prepTimeMin || 3),
    isAvailable: status === 'available',
    isFeatured: Boolean(p.isFeatured),
    isPopular: Boolean(p.isPopular),
    nutrition: p.nutrition || { protein: '2g', carbs: '25g', sugars: '15g', fiber: '3g' },
    benefits: Array.isArray(p.benefits) && p.benefits.length > 0 ? p.benefits : ['Giàu vitamin tự nhiên', 'Thanh mát giải nhiệt', 'Không chất bảo quản'],
  };
}

export class ProductService {
  /**
   * GET /api/products
   * Fetches real products from MongoDB Atlas
   */
  static async getAllDrinks(params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<Drink[]> {
    const queryParts: string[] = [];
    if (params?.category && params.category !== 'all') {
      // Map UI category to database categoryId if needed
      let catId = params.category;
      if (catId === 'smoothie') catId = 'CAT01';
      else if (catId === 'fresh_juice') catId = 'CAT02';
      else if (catId === 'combo_drinks') catId = 'CAT03';
      queryParts.push(`category=${encodeURIComponent(catId)}`);
    }
    if (params?.search) {
      queryParts.push(`search=${encodeURIComponent(params.search)}`);
    }
    if (params?.page) {
      queryParts.push(`page=${params.page}`);
    }
    if (params?.limit) {
      queryParts.push(`limit=${params.limit}`);
    }
    if (params?.sort) {
      queryParts.push(`sort=${params.sort}`);
    }

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const response = await ApiService.get<any>(`/api/products${queryString}`);

    // Real API response format: { success: true, data: [...] }
    const rawList = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
      ? response
      : [];

    return rawList.map(mapProductToDrink);
  }

  /**
   * GET /api/products/:id
   */
  static async getDrinkById(id: string): Promise<Drink | undefined> {
    const response = await ApiService.get<any>(`/api/products/${id}`);
    if (response && response.data) {
      return mapProductToDrink(response.data);
    }
    return undefined;
  }

  /**
   * POST /api/products
   */
  static async addDrink(drink: Omit<Drink, 'id'>): Promise<Drink> {
    const cleanPrice = sanitizePrice(drink.basePrice, 45000);
    let categoryId = 'CAT01';
    if (drink.category === 'fresh_juice') categoryId = 'CAT02';
    else if (drink.category === 'combo_drinks') categoryId = 'CAT03';

    const payload = {
      ...drink,
      categoryId,
      price: cleanPrice,
      basePrice: cleanPrice,
      status: drink.isAvailable !== false ? 'available' : 'out_of_stock',
    };

    const response = await ApiService.post<any>('/api/products', payload);
    return mapProductToDrink(response.data);
  }

  /**
   * PUT /api/products/:id
   */
  static async updateDrink(id: string, updates: Partial<Drink>): Promise<Drink> {
    const payload: any = { ...updates };
    if (updates.basePrice !== undefined) {
      const p = sanitizePrice(updates.basePrice, 45000);
      payload.price = p;
      payload.basePrice = p;
    }
    if (updates.isAvailable !== undefined) {
      payload.status = updates.isAvailable ? 'available' : 'out_of_stock';
    }

    const response = await ApiService.put<any>(`/api/products/${id}`, payload);
    return mapProductToDrink(response.data);
  }

  /**
   * DELETE /api/products/:id
   */
  static async deleteDrink(id: string): Promise<boolean> {
    await ApiService.delete(`/api/products/${id}`);
    return true;
  }
}
