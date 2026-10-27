export type UserRole = 'customer' | 'staff' | 'barista' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  loyaltyPoints?: number;
  tier?: 'Thành viên Mới' | 'Thân thiết' | 'VIP Vàng';
}

export type Category = 'smoothie' | 'fresh_juice' | 'combo_drinks';

export type DrinkSize = 'small' | 'medium' | 'large';

export type SugarLevel = '0%' | '30%' | '50%' | '70%' | '100%';

export type IceLevel = 'no_ice' | 'less_ice' | 'regular' | 'more_ice';

export interface BoosterAddon {
  id: string;
  name: string;
  price: number;
}

export interface Drink {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: Category;
  categoryId?: string;
  basePrice: number; // in VNĐ (e.g. 40000, 45000)
  themeColor: string;
  bgGradient: string;
  ingredients: string[];
  calories: number;
  prepTimeMin: number;
  isAvailable: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  nutrition: {
    protein: string;
    carbs: string;
    sugars: string;
    fiber: string;
  };
  benefits: string[];
}

export interface CartItem {
  id: string;
  drinkId: string;
  drink: Drink;
  size: DrinkSize;
  sugar: SugarLevel;
  ice: IceLevel;
  boosters: BoosterAddon[];
  notes?: string;
  unitPrice: number;
  quantity: number;
}

export type OrderStatus = 'pending' | 'waiting' | 'preparing' | 'completed' | 'cancelled';
export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type PaymentMethod = 'cash' | 'card' | 'qr_code';
export type PaymentStatus = 'paid' | 'pending';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  tableNumber?: string;
  orderType: OrderType;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  estimatedMinutes: number;
  notes?: string;
  cashGiven?: number;
  changeDue?: number;
  promotionCode?: string;
  checkoutRequestId?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  category: 'fruit' | 'dairy' | 'sweetener' | 'topping' | 'ice';
  currentStock: number;
  minThreshold: number;
  unit: string; // kg, lít, hộp, gói, bao
  costPerUnit: number;
  lastRestocked: string;
  supplier: string;
  status: 'in_stock' | 'low_stock' | 'critical';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'inventory' | 'system' | 'success';
  timestamp: string;
  read: boolean;
}
