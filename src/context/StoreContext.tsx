import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  CartItem,
  Drink,
  Ingredient,
  NotificationItem,
  Order,
  OrderStatus,
  User,
  UserRole,
} from '../types';
import { AuthService } from '../services/authService';
import { ProductService } from '../services/productService';
import { OrderService } from '../services/orderService';
import { InventoryService } from '../services/inventoryService';

import { sanitizePrice } from '../utils/formatters';

interface StoreContextType {
  currentUser: User | null;
  role: UserRole;
  switchRole: (role: UserRole) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;

  products: Drink[];
  addProduct: (drink: Omit<Drink, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Drink>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartItemQty: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;

  orders: Order[];
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;

  ingredients: Ingredient[];
  restockIngredient: (id: string, amount: number) => Promise<void>;
  updateIngredientThreshold: (id: string, newMin: number) => Promise<void>;
  lowStockCount: number;

  activeDrinkForModal: Drink | null;
  openDrinkModal: (drink: Drink) => void;
  closeDrinkModal: () => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  activeReceiptOrder: Order | null;
  setActiveReceiptOrder: (order: Order | null) => void;

  notifications: NotificationItem[];
  addNotification: (title: string, message: string, type?: NotificationItem['type']) => void;
  removeNotification: (id: string) => void;
  markNotificationsAsRead: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Drink[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [activeDrinkForModal, setActiveDrinkForModal] = useState<Drink | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function init() {
      try {
        AuthService.getCurrentUser()
          .then((user) => { if (user) setCurrentUser(user); })
          .catch(() => {});

        const [drinksData, ordersData, ingredientsData] = await Promise.all([
          ProductService.getAllDrinks().catch((err) => {
            console.warn('[StoreContext] Tải sản phẩm từ MongoDB:', err.message);
            return [];
          }),
          OrderService.getOrders().catch((err) => {
            console.warn('[StoreContext] Tải đơn hàng từ MongoDB:', err.message);
            return [];
          }),
          InventoryService.getIngredients().catch((err) => {
            console.warn('[StoreContext] Tải kho nguyên liệu từ MongoDB:', err.message);
            return [];
          }),
        ]);

        setProducts(drinksData);
        setOrders(ordersData);
        setIngredients(ingredientsData);

        setNotifications([
          {
            id: 'notif_welcome',
            title: 'Hệ thống FreshLeaf sẵn sàng',
            message: 'Đã kết nối cơ sở dữ liệu MongoDB Atlas (freshleaf). Bán hàng và quản lý theo thời gian thực.',
            type: 'system',
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            read: false,
          },
        ]);
      } catch (err: any) {
        addNotification('Cảnh báo kết nối', 'Không thể kết nối đến cơ sở dữ liệu MongoDB Atlas. Vui lòng kiểm tra MONGODB_URI.', 'system');
      }
    }

    init();
  }, []);

  const role = currentUser?.role || 'customer';

  const switchRole = async (newRole: UserRole) => {
    const user = await AuthService.switchRole(newRole);
    setCurrentUser(user);
    const roleNames: Record<UserRole, string> = {
      customer: 'Khách hàng',
      staff: 'Nhân viên bán hàng (POS)',
      barista: 'Nhân viên pha chế (KDS)',
      manager: 'Quản lý cửa hàng',
    };
    addNotification(
      'Chuyển đổi vai trò',
      `Đã chuyển sang chế độ: ${roleNames[newRole]}.`,
      'system'
    );
  };

  const login = async (email: string, pass: string) => {
    const user = await AuthService.login(email, pass);
    setCurrentUser(user);
    addNotification('Đăng nhập thành công', `Chào mừng ${user.name} quay trở lại!`, 'success');
  };

  const logout = async () => {
    await AuthService.logout();
    const guest = await AuthService.getCurrentUser();
    setCurrentUser(guest);
  };

  const addProduct = async (drink: Omit<Drink, 'id'>) => {
    const newDrink = await ProductService.addDrink(drink);
    setProducts((prev) => [newDrink, ...prev]);
    addNotification('Thêm món thành công', `${newDrink.name} đã được thêm vào thực đơn.`, 'success');
  };

  const updateProduct = async (id: string, updates: Partial<Drink>) => {
    const updated = await ProductService.updateDrink(id, updates);
    setProducts((prev) => prev.map((d) => (d.id === id ? updated : d)));
    addNotification('Cập nhật món', `Đã lưu thay đổi cho món ${updated.name}.`, 'success');
  };

  const deleteProduct = async (id: string) => {
    await ProductService.deleteDrink(id);
    setProducts((prev) => prev.filter((d) => d.id !== id));
    addNotification('Đã xóa món', 'Món đã được gỡ khỏi thực đơn.', 'system');
  };

  const addToCart = (itemData: Omit<CartItem, 'id'>) => {
    const cleanUnitPrice = sanitizePrice(itemData.unitPrice, 45000);
    const cleanDrink = itemData.drink
      ? { ...itemData.drink, basePrice: sanitizePrice(itemData.drink.basePrice, 45000) }
      : itemData.drink;

    const newItem: CartItem = {
      ...itemData,
      drink: cleanDrink,
      unitPrice: cleanUnitPrice,
      id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    };
    setCart((prev) => [...prev, newItem]);
    addNotification('Đã thêm vào giỏ', `${newItem.drink.name} (${newItem.size === 'small' ? 'Nhỏ' : newItem.size === 'medium' ? 'Vừa' : 'Lớn'}) đã vào đơn.`, 'order');
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateCartItemQty = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = useMemo(() => cart.reduce((acc, it) => acc + it.quantity, 0), [cart]);

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
    [cart]
  );

  // In Vietnamese cafes, menu prices already include VAT
  const cartTax = 0;

  const cartTotal = useMemo(() => cartSubtotal, [cartSubtotal]);

  const createOrder = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => {
    const newOrder = await OrderService.createOrder(orderData);
    setOrders((prev) => [newOrder, ...prev]);

    addNotification(
      'Đơn hàng mới',
      `Đơn ${newOrder.orderNumber} của khách ${newOrder.customerName} đã được gửi đến quầy pha chế.`,
      'order'
    );

    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const updated = await OrderService.updateOrderStatus(orderId, status);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));

    const statusLabels: Record<OrderStatus, string> = {
      pending: 'vừa tiếp nhận, đang xếp hàng chờ',
      waiting: 'đang chờ pha chế',
      preparing: 'đang được Barista chuẩn bị',
      completed: 'đã sẵn sàng phục vụ khách!',
      cancelled: 'đã được hủy',
    };

    addNotification(
      `Đơn ${updated.orderNumber}`,
      `Trạng thái: ${statusLabels[status]}.`,
      status === 'completed' ? 'success' : 'order'
    );
  };

  const restockIngredient = async (id: string, amount: number) => {
    const updated = await InventoryService.restock(id, amount);
    setIngredients((prev) => prev.map((ing) => (ing.id === id ? updated : ing)));
    addNotification('Nhập kho thành công', `${updated.name} đã nhập thêm +${amount} ${updated.unit}.`, 'inventory');
  };

  const updateIngredientThreshold = async (id: string, newMin: number) => {
    const updated = await InventoryService.updateThreshold(id, newMin);
    setIngredients((prev) => prev.map((ing) => (ing.id === id ? updated : ing)));
  };

  const lowStockCount = useMemo(
    () => ingredients.filter((ing) => ing.status === 'low_stock' || ing.status === 'critical').length,
    [ingredients]
  );

  const openDrinkModal = (drink: Drink) => setActiveDrinkForModal(drink);
  const closeDrinkModal = () => setActiveDrinkForModal(null);

  const addNotification = (
    title: string,
    message: string,
    type: NotificationItem['type'] = 'system'
  ) => {
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 15)]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        role,
        switchRole,
        login,
        logout,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        cart,
        addToCart,
        removeFromCart,
        updateCartItemQty,
        clearCart,
        cartCount,
        cartSubtotal,
        cartTax,
        cartTotal,
        orders,
        createOrder,
        updateOrderStatus,
        ingredients,
        restockIngredient,
        updateIngredientThreshold,
        lowStockCount,
        activeDrinkForModal,
        openDrinkModal,
        closeDrinkModal,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        activeReceiptOrder,
        setActiveReceiptOrder,
        notifications,
        addNotification,
        removeNotification,
        markNotificationsAsRead,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
