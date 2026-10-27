import { ApiService } from './api';

export interface ManagedUser {
  id: string;
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  role: 'CUSTOMER' | 'STAFF' | 'BARISTA' | 'MANAGER';
  isActive: boolean;
  createdAt?: string;
}

export class UserService {
  static async list(filters: { search?: string; role?: string; status?: string } = {}) {
    const qs = new URLSearchParams([...Object.entries(filters).filter(([, value]) => value), ['limit', '100']] as string[][]).toString();
    const response = await ApiService.get<ManagedUser[]>(`/users${qs ? `?${qs}` : ''}`);
    return response.data;
  }
  static async create(data: Record<string, unknown>) {
    return (await ApiService.post<ManagedUser>('/users', data)).data;
  }
  static async update(id: string, data: Partial<ManagedUser>) {
    return (await ApiService.put<ManagedUser>(`/users/${id}`, data)).data;
  }
  static async resetPassword(id: string, password: string) {
    await ApiService.put(`/users/${id}/password`, { password });
  }
}
