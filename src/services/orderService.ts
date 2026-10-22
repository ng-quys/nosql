import { Order, OrderStatus, Category } from '../types';
import { ApiService } from './api';
import { sanitizePrice } from '../utils/formatters';

const PRODUCT_INFO_MAP: Record<string, { name: string; category: Category; color: string }> = {
  P001: { name: 'Mango Smoothie', category: 'smoothie', color: '#D97706' },
  P002: { name: 'Strawberry Smoothie', category: 'smoothie', color: '#BE185D' },
  P003: { name: 'Avocado Smoothie', category: 'smoothie', color: '#2D6A4F' },
  P004: { name: 'Orange Juice', category: 'fresh_juice', color: '#EA580C' },
  P005: { name: 'Watermelon Juice', category: 'fresh_juice', color: '#E11D48' },
  P006: { name: 'Pineapple Juice', category: 'fresh_juice', color: '#D97706' },
  P007: { name: 'Passion Fruit Juice', category: 'fresh_juice', color: '#F59E0B' },
  P008: { name: 'Mixed Berry Smoothie', category: 'smoothie', color: '#4338CA' },
  P009: { name: 'Guava Juice', category: 'fresh_juice', color: '#BE185D' },
  P010: { name: 'Green Detox', category: 'combo_drinks', color: '#059669' },
  P011: { name: 'Tropical Combo', category: 'combo_drinks', color: '#2D6A4F' },
  P012: { name: 'Berry Combo', category: 'combo_drinks', color: '#831843' },
};

function mapApiOrderToOrder(ord: any): Order {
  const items = (ord.items || []).map((it: any) => {
    const cleanUnitPrice = sanitizePrice(it.unitPrice, 45000);
    const pId = (it.productId || it.drinkId || it.id || '').toString();
    const info = PRODUCT_INFO_MAP[pId];
    const resolvedName = it.name && it.name !== 'Món uống' ? it.name : info?.name || it.name || 'Món uống';
    const resolvedCat: Category = info?.category || 'smoothie';
    const resolvedColor = info?.color || '#2D6A4F';

    return {
      ...it,
      id: it.id || `ci_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      drinkId: pId,
      name: resolvedName,
      quantity: Number(it.quantity ?? it.qty ?? 1),
      unitPrice: cleanUnitPrice,
      drink: it.drink || {
        id: pId,
        name: resolvedName,
        basePrice: cleanUnitPrice,
        category: resolvedCat,
        description: '',
        tagline: '',
        themeColor: resolvedColor,
        bgGradient: '',
        ingredients: [],
        calories: 150,
        prepTimeMin: 3,
        isAvailable: true,
        nutrition: { protein: '', carbs: '', sugars: '', fiber: '' },
        benefits: [],
      },
    };
  });

  const subtotal = sanitizePrice(ord.subtotal, items.reduce((s: number, i: any) => s + i.unitPrice * i.quantity, 0));
  const totalAmount = sanitizePrice(ord.totalAmount ?? ord.total, subtotal);

  return {
    ...ord,
    id: (ord.id || ord._id || '').toString(),
    orderNumber: ord.orderNumber || (ord.id || ord._id || '').toString(),
    customerName: ord.customerName || 'Khách hàng',
    customerPhone: ord.customerPhone || '',
    tableNumber: ord.tableNumber ? String(ord.tableNumber) : '1',
    items,
    subtotal,
    discount: sanitizePrice(ord.discount, 0),
    tax: 0,
    totalAmount,
    status: ord.status || 'pending',
    paymentMethod: ord.paymentMethod || 'cash',
    paymentStatus: ord.paymentStatus || 'paid',
    createdAt: ord.createdAt || new Date().toISOString(),
    estimatedMinutes: ord.estimatedMinutes || 5,
  };
}

export class OrderService {
  /**
   * GET /api/orders
   * Loads real orders from MongoDB Atlas
   */
  static async getOrders(params?: { status?: string; customerId?: string }): Promise<Order[]> {
    const queryParts: string[] = [];
    if (params?.status) queryParts.push(`status=${params.status}`);
    if (params?.customerId) queryParts.push(`customerId=${params.customerId}`);
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    const response = await ApiService.get<any[]>(`/api/orders${qs}`);
    if (response && response.data && Array.isArray(response.data)) {
      return response.data.map(mapApiOrderToOrder);
    }
    return [];
  }

  /**
   * GET /api/orders/:id
   */
  static async getOrderById(id: string): Promise<Order | undefined> {
    const response = await ApiService.get<any>(`/api/orders/${id}`);
    if (response && response.data) {
      return mapApiOrderToOrder(response.data);
    }
    return undefined;
  }

  /**
   * POST /api/orders
   * Real order creation with backend calculation
   */
  static async createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>): Promise<Order> {
    const payload = {
      customerId: (orderData as any).customerId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      tableNumber: orderData.tableNumber,
      orderType: orderData.orderType || 'dine_in',
      discount: sanitizePrice(orderData.discount, 0),
      payment: orderData.paymentMethod || 'cash',
      paymentMethod: orderData.paymentMethod || 'cash',
      paymentStatus: orderData.paymentStatus || 'paid',
      notes: orderData.notes || '',
      items: orderData.items.map((it) => ({
        productId: it.drinkId || it.drink?.id,
        qty: it.quantity,
        quantity: it.quantity,
        sugar: it.sugar,
        ice: it.ice,
        size: it.size,
        note: it.notes,
        boosters: it.boosters,
      })),
    };

    const response = await ApiService.post<any>('/api/orders', payload);
    return mapApiOrderToOrder(response.data);
  }

  /**
   * PUT /api/orders/:id/status
   */
  static async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const response = await ApiService.put<any>(`/api/orders/${id}/status`, { status });
    return mapApiOrderToOrder(response.data);
  }

  /**
   * KDS: GET /api/kds/orders
   */
  static async getKdsOrders(): Promise<Order[]> {
    const response = await ApiService.get<any[]>('/api/kds/orders');
    if (response && response.data && Array.isArray(response.data)) {
      return response.data.map(mapApiOrderToOrder);
    }
    return [];
  }

  /**
   * KDS: PUT /api/kds/orders/:id/start
   */
  static async startKdsOrder(id: string): Promise<Order> {
    const response = await ApiService.put<any>(`/api/kds/orders/${id}/start`, {});
    return mapApiOrderToOrder(response.data);
  }

  /**
   * KDS: PUT /api/kds/orders/:id/complete
   */
  static async completeKdsOrder(id: string): Promise<Order> {
    const response = await ApiService.put<any>(`/api/kds/orders/${id}/complete`, {});
    return mapApiOrderToOrder(response.data);
  }
}
