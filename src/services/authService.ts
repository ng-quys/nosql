import { User, UserRole } from '../types';
import { ApiService } from './api';

const CURRENT_USER_KEY = 'freshleaf_active_user_v2';
const JWT_TOKEN_KEY = 'freshleaf_jwt_token';

function normalizeRole(role: string): UserRole {
  const r = (role || '').toLowerCase();
  if (r === 'staff' || r === 'cashier') return 'staff';
  if (r === 'barista') return 'barista';
  if (r === 'manager' || r === 'admin') return 'manager';
  return 'customer';
}

function mapApiUserToUser(data: any): User {
  return {
    id: (data.id || data._id || '').toString(),
    name: data.name || data.username || 'Thành viên FreshLeaf',
    email: data.email || `${data.username || 'user'}@freshleaf.vn`,
    role: normalizeRole(data.role),
    phone: data.phone || '',
    avatar: (data.name || data.username || 'FL').slice(0, 2).toUpperCase(),
    loyaltyPoints: Number(data.points ?? data.loyaltyPoints ?? 0),
    tier: data.tier || 'Thành viên Mới',
  };
}

export class AuthService {
  /**
   * GET /api/auth/me
   * Validates JWT token and retrieves real user from MongoDB
   */
  static async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token) {
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }

    try {
      const response = await ApiService.get<any>('/api/auth/me');
      if (response && response.data) {
        const user = mapApiUserToUser(response.data);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        return user;
      }
    } catch {
      // If token is invalid or expired
      localStorage.removeItem(JWT_TOKEN_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
    }

    return null;
  }

  /**
   * POST /api/auth/login
   * Supports login with username or email
   */
  static async login(identifier: string, pass: string): Promise<User> {
    const response = await ApiService.post<any>('/api/auth/login', {
      usernameOrEmail: identifier,
      password: pass,
    });

    if (response && response.data) {
      const { token, user: rawUser } = response.data;
      if (token) {
        localStorage.setItem(JWT_TOKEN_KEY, token);
      }
      const user = mapApiUserToUser(rawUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }

    throw new Error(response.message || 'Đăng nhập không thành công');
  }

  /**
   * POST /api/auth/register
   */
  static async register(name: string, identifier: string, role: string = 'CUSTOMER', phone?: string, password: string = '123456'): Promise<User> {
    const isEmail = identifier.includes('@');
    const payload = {
      name,
      email: isEmail ? identifier : undefined,
      username: !isEmail ? identifier : identifier.split('@')[0],
      phone,
      password,
    };

    const response = await ApiService.post<any>('/api/auth/register', payload);
    if (response && response.data) {
      const { token, user: rawUser } = response.data;
      if (token) {
        localStorage.setItem(JWT_TOKEN_KEY, token);
      }
      const user = mapApiUserToUser(rawUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }

    throw new Error(response.message || 'Đăng ký không thành công');
  }

  /**
   * Role switcher for dev/demo testing
   */
  static async switchRole(role: UserRole): Promise<User> {
    throw new Error(`Không thể tự chuyển sang vai trò ${role}. Hãy đăng nhập bằng tài khoản được quản lý cấp quyền.`);
  }

  /**
   * Logout
   */
  static async logout(): Promise<void> {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(JWT_TOKEN_KEY);
  }
}
