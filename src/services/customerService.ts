import { ApiService } from './api';

export interface CustomerData {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  loyaltyPoints?: number;
  tier?: string;
  address?: string;
  totalOrders?: number;
  totalSpent?: number;
}

export class CustomerService {
  static async getCustomers(search?: string): Promise<CustomerData[]> {
    try {
      const endpoint = search ? `/customers?search=${encodeURIComponent(search)}` : '/customers';
      const response = await ApiService.get<CustomerData[]>(endpoint);
      if (response && response.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch {
      // fallback
    }

    return [
      {
        id: 'cust_1',
        name: 'Nguyễn Văn An',
        phone: '0901234567',
        email: 'nguyenvanan@gmail.com',
        loyaltyPoints: 350,
        tier: 'VIP Vàng',
        totalOrders: 12,
        totalSpent: 620000,
      },
      {
        id: 'cust_2',
        name: 'Trần Thị Bình',
        phone: '0912345678',
        email: 'binhtran@freshleaf.vn',
        loyaltyPoints: 120,
        tier: 'Thân thiết',
        totalOrders: 4,
        totalSpent: 180000,
      },
    ];
  }

  static async getCustomerById(id: string): Promise<CustomerData | undefined> {
    const response = await ApiService.get<CustomerData>(`/customers/${id}`);
    return response.data;
  }

  static async createCustomer(customer: Omit<CustomerData, 'id'>): Promise<CustomerData> {
    const response = await ApiService.post<CustomerData>('/customers', customer);
    return response.data;
  }

  static async updateCustomer(id: string, updates: Partial<CustomerData>): Promise<CustomerData> {
    const response = await ApiService.put<CustomerData>(`/customers/${id}`, updates);
    return response.data;
  }
}
